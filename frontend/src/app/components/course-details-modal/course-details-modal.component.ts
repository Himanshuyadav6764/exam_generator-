import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CourseDetails {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  instructorEmail: string;
  difficulty: string;
  status: string;
  thumbnail: string;
  subjects: string[];
  enrolledStudents: number;
  averageRating: number;
  topics: string[];
  topicSubcontents: { [key: string]: SubtopicDetails[] };
  contentCounts: ContentCounts;
  createdAt: string;
  updatedAt: string;
}

export interface SubtopicDetails {
  name: string;
  description: string;
  videoUrls: string[];
  videoFileNames: string[];
  pdfUrls: string[];
  pdfFileNames: string[];
  thumbnailUrl: string;
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface ContentCounts {
  totalTopics: number;
  totalSubtopics: number;
  totalVideos: number;
  totalPdfs: number;
  totalMcqs: number;
  topicBreakdown: { [key: string]: TopicContentCounts };
}

export interface TopicContentCounts {
  subtopicCount: number;
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

@Component({
  selector: 'app-course-details-modal',
  templateUrl: './course-details-modal.component.html',
  styleUrls: ['./course-details-modal.component.css']
})
export class CourseDetailsModalComponent implements OnInit, OnChanges {
  @Input() courseId!: string;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  
  courseDetails: CourseDetails | null = null;
  loading: boolean = false;
  error: string = '';
  
  // Accordion state
  expandedTopics: Set<string> = new Set();
  expandedSubtopics: Set<string> = new Set();
  
  constructor(
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    if (this.courseId && this.isVisible) {
      this.loadCourseDetails();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible && this.courseId) {
      this.loadCourseDetails();
    }
  }
  
  loadCourseDetails(): void {
    if (!this.courseId) return;
    
    this.loading = true;
    this.error = '';
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<CourseDetails>(`${environment.apiUrl}/courses/${this.courseId}/details`, { headers })
      .subscribe({
        next: (data) => {
          this.courseDetails = data;
          this.loading = false;
          console.log('✅ Course details loaded:', data);
        },
        error: (err) => {
          console.error('❌ Error loading course details:', err);
          this.error = 'Failed to load course details';
          this.loading = false;
        }
      });
  }
  
  toggleTopic(topicName: string): void {
    if (this.expandedTopics.has(topicName)) {
      this.expandedTopics.delete(topicName);
    } else {
      this.expandedTopics.add(topicName);
    }
  }
  
  toggleSubtopic(topicName: string, subtopicName: string): void {
    const key = `${topicName}-${subtopicName}`;
    if (this.expandedSubtopics.has(key)) {
      this.expandedSubtopics.delete(key);
    } else {
      this.expandedSubtopics.add(key);
    }
  }
  
  isTopicExpanded(topicName: string): boolean {
    return this.expandedTopics.has(topicName);
  }
  
  isSubtopicExpanded(topicName: string, subtopicName: string): boolean {
    return this.expandedSubtopics.has(`${topicName}-${subtopicName}`);
  }
  
  getSubtopicsForTopic(topicName: string): SubtopicDetails[] {
    if (!this.courseDetails || !this.courseDetails.topicSubcontents) {
      return [];
    }
    return this.courseDetails.topicSubcontents[topicName] || [];
  }
  
  getTopicCounts(topicName: string): TopicContentCounts | null {
    if (!this.courseDetails || !this.courseDetails.contentCounts) {
      return null;
    }
    return this.courseDetails.contentCounts.topicBreakdown[topicName] || null;
  }
  
  closeModal(): void {
    this.isVisible = false;
    this.expandedTopics.clear();
    this.expandedSubtopics.clear();
    this.close.emit();
  }
}

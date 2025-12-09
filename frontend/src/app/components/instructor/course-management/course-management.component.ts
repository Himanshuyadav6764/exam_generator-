import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { ContentService } from '../../../services/content.service';
import { MCQService } from '../../../services/mcq.service';

@Component({
  selector: 'app-course-management',
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
  instructorEmail: string = '';
  searchTerm: string = '';
  filterStatus: string = 'ALL';
  message = '';
  errorMessage = '';
  
  // Course details modal
  showDetailsModal = false;
  selectedCourse: any = null;
  courseContent: any = null;
  courseMCQs: any[] = [];
  expandedTopics: Set<string> = new Set();
  topicSubcontents: { [key: string]: any[] } = {};
  
  // Content viewer modal
  showContentViewer = false;
  selectedContent: any = null;

  constructor(
    private courseService: CourseService,
    private contentService: ContentService,
    private mcqService: MCQService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.instructorEmail = localStorage.getItem('email') || '';
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getCoursesByInstructor(this.instructorEmail).subscribe({
      next: (data) => {
        this.courses = data;
        this.applyFilters();
      },
      error: (error) => {
        this.errorMessage = 'Error loading courses: ' + error.message;
      }
    });
  }

  applyFilters(): void {
    this.filteredCourses = this.courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.filterStatus === 'ALL' || course.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  createCourse(): void {
    this.router.navigate(['/create-course']);
  }

  editCourse(courseId: string): void {
    this.router.navigate(['/edit-course', courseId]);
  }

  bulkUpload(courseId: string): void {
    this.router.navigate(['/bulk-content-upload', courseId]);
  }

  manageContent(courseId: string): void {
    // Navigate to create-course page in edit mode to add subcontents
    this.closeDetailsModal();
    this.router.navigate(['/create-course'], { 
      queryParams: { 
        editMode: 'true', 
        courseId: courseId 
      } 
    });
  }

  manageMCQs(courseId: string): void {
    this.router.navigate(['/mcq-management', courseId]);
  }

  deleteCourse(courseId: string, courseTitle: string): void {
    this.courseService.deleteCourse(courseId).subscribe({
      next: (response) => {
        this.message = `✅ Course "${courseTitle}" deleted successfully (${response.enrollmentsRemoved || 0} student enrollments removed)`;
        this.errorMessage = '';
        this.loadCourses();
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.error || 'Unknown error';
        this.errorMessage = `Failed to delete course: ${errorMsg}`;
        this.message = '';
      }
    });
  }

  publishCourse(courseId: string): void {
    this.courseService.publishCourse(courseId).subscribe({
      next: (response) => {
        console.log('✅ Publish response:', response);
        this.message = response.message || 'Course published successfully';
        this.errorMessage = '';
        setTimeout(() => {
          this.loadCourses();
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Publish error:', error);
        let errorMsg = 'Unknown error';
        
        if (error.error instanceof ErrorEvent) {
          errorMsg = error.error.message;
        } else if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMsg = error.error;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to server. Please check if backend is running on port 8081.';
        } else {
          errorMsg = `Server returned ${error.status}: ${error.statusText}`;
        }
        
        this.errorMessage = 'Error publishing course: ' + errorMsg;
        this.message = '';
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    return `badge-${status.toLowerCase()}`;
  }

  getDifficultyBadgeClass(difficulty: string): string {
    return `badge-${difficulty.toLowerCase()}`;
  }

  getPublishedCount(): number {
    return this.courses.filter(c => c.status === 'PUBLISHED').length;
  }

  getTotalStudents(): number {
    return this.courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
  }

  getAverageRating(): string {
    if (this.courses.length === 0) return '0.0';
    const total = this.courses.reduce((sum, c) => sum + (c.averageRating || 0), 0);
    return (total / this.courses.length).toFixed(1);
  }

  // Course Details Modal Methods
  viewCourseDetails(course: any): void {
    console.log('👁️ Viewing course details:', course);
    this.selectedCourse = course;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCourse = null;
  }

  loadCourseContent(courseId: string): void {
    console.log('🔍 Loading course content for:', courseId);
    console.log('📚 Selected course:', this.selectedCourse);
    
    // FIRST: Load topicSubcontents from course object (NEW system with videos/PDFs/MCQs)
    if (this.selectedCourse && this.selectedCourse.topicSubcontents) {
      this.topicSubcontents = { ...this.selectedCourse.topicSubcontents };
      console.log('✅ Loaded topicSubcontents from course:', this.topicSubcontents);
      console.log('📋 Topics in course.subjects:', this.selectedCourse.subjects);
      console.log('📋 Topics in course.topics:', this.selectedCourse.topics);
      
      // Debug: show what's in each topic
      Object.keys(this.topicSubcontents).forEach(key => {
        console.log(`   📌 Topic "${key}":`, this.topicSubcontents[key]);
      });
    } else {
      console.log('⚠️ No topicSubcontents found in course');
      this.topicSubcontents = {};
    }
    
    // SECOND: Load old SubContent system (fallback for courses created before the new system)
    this.contentService.getContentByCourse(courseId).subscribe({
      next: (data: any) => {
        console.log('📦 Old content system loaded:', data);
        
        // Process the content data
        if (Array.isArray(data)) {
          this.courseContent = {
            contents: data,
            totalVideos: data.filter((c: any) => c.contentType === 'VIDEO').length,
            totalPDFs: data.filter((c: any) => c.contentType === 'PDF').length
          };
          
          // Only populate from old content system if topicSubcontents is empty
          if (Object.keys(this.topicSubcontents).length === 0 && this.selectedCourse && this.selectedCourse.subjects) {
            console.log('🔄 Using old content system as fallback');
            this.selectedCourse.subjects.forEach((topicName: string) => {
              const topicContents = data.filter((content: any) => {
                if (!content.topic) return false;
                
                const contentTopic = content.topic.toLowerCase().trim();
                const courseTopic = topicName.toLowerCase().trim();
                
                return contentTopic === courseTopic || 
                       contentTopic.includes(courseTopic) || 
                       courseTopic.includes(contentTopic);
              });
              
              this.topicSubcontents[topicName] = topicContents;
              console.log(`📌 Topic "${topicName}" has ${topicContents.length} contents from old system`);
            });
          }
        } else {
          this.courseContent = data;
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading course content:', error);
        this.courseContent = { contents: [], totalVideos: 0, totalPDFs: 0 };
      }
    });
  }

  loadCourseMCQs(courseId: string): void {
    // Load all MCQs first
    this.mcqService.getAllMCQs().subscribe({
      next: (data: any) => {
        // Filter MCQs that match course topics if we have the selected course
        if (this.selectedCourse && this.selectedCourse.topics && Array.isArray(data)) {
          const courseTopicNames = this.selectedCourse.topics.map((t: string) => 
            t.replace('[BEGINNER]', '').replace('[INTERMEDIATE]', '').replace('[ADVANCED]', '').trim()
          );
          this.courseMCQs = data.filter((mcq: any) => {
            // Check if MCQ topic matches any course topic
            const mcqTopic = mcq.topic || mcq.topicName || '';
            return courseTopicNames.some((courseTopic: string) => 
              mcqTopic.toLowerCase().includes(courseTopic.toLowerCase()) ||
              courseTopic.toLowerCase().includes(mcqTopic.toLowerCase())
            );
          });
        } else {
          this.courseMCQs = Array.isArray(data) ? data : [];
        }
      },
      error: (error: any) => {
        console.error('Error loading MCQs:', error);
        // Set empty array on error instead of failing
        this.courseMCQs = [];
      }
    });
  }

  getTotalTopics(course: any): number {
    if (!course.topics) return 0;
    return course.topics.length;
  }

  hasTopics(course: any): boolean {
    return course.topics && course.topics.length > 0;
  }

  getBeginnerTopics(course: any): string[] {
    if (!course.topics) return [];
    return course.topics
      .filter((topic: string) => topic.includes('[BEGINNER]'))
      .map((topic: string) => topic.replace('[BEGINNER]', '').trim());
  }

  getIntermediateTopics(course: any): string[] {
    if (!course.topics) return [];
    return course.topics
      .filter((topic: string) => topic.includes('[INTERMEDIATE]'))
      .map((topic: string) => topic.replace('[INTERMEDIATE]', '').trim());
  }

  getAdvancedTopics(course: any): string[] {
    if (!course.topics) return [];
    return course.topics
      .filter((topic: string) => topic.includes('[ADVANCED]'))
      .map((topic: string) => topic.replace('[ADVANCED]', '').trim());
  }

  // Toggle topic expansion to show/hide subcontents
  toggleTopicExpansion(topicName: string): void {
    if (this.expandedTopics.has(topicName)) {
      this.expandedTopics.delete(topicName);
    } else {
      this.expandedTopics.add(topicName);
      // Load subcontents for this topic if not already loaded
      if (!this.topicSubcontents[topicName]) {
        this.loadTopicSubcontents(topicName);
      }
    }
  }

  isTopicExpanded(topicName: string): boolean {
    return this.expandedTopics.has(topicName);
  }

  expandAllTopics(): void {
    if (this.selectedCourse && this.selectedCourse.subjects) {
      this.selectedCourse.subjects.forEach((topic: string) => {
        this.expandedTopics.add(topic);
        if (!this.topicSubcontents[topic]) {
          this.loadTopicSubcontents(topic);
        }
      });
    }
  }

  collapseAllTopics(): void {
    this.expandedTopics.clear();
  }

  loadTopicSubcontents(topicName: string): void {
    // First check if course has topicSubcontents field (new system)
    if (this.selectedCourse && this.selectedCourse.topicSubcontents) {
      const subcontents = this.selectedCourse.topicSubcontents[topicName] || [];
      this.topicSubcontents[topicName] = subcontents;
      console.log(`Loaded ${subcontents.length} subcontents from course.topicSubcontents for topic: ${topicName}`, subcontents);
      return;
    }
    
    // Fallback to old system: Extract subcontents from courseContent if they exist
    if (this.courseContent && this.courseContent.contents) {
      const subcontents = this.courseContent.contents.filter((content: any) => 
        content.topic === topicName ||
        content.topic?.toLowerCase().includes(topicName.toLowerCase()) ||
        topicName.toLowerCase().includes(content.topic?.toLowerCase() || '')
      );
      this.topicSubcontents[topicName] = subcontents;
      console.log(`Loaded ${subcontents.length} subcontents from courseContent for topic: ${topicName}`, subcontents);
    } else {
      this.topicSubcontents[topicName] = [];
    }
  }

  getSubcontentsForTopic(topicName: string): any[] {
    return this.topicSubcontents[topicName] || [];
  }

  hasSubcontents(topicName: string): boolean {
    const subcontents = this.getSubcontentsForTopic(topicName);
    return subcontents && subcontents.length > 0;
  }

  getTopicVideoCount(topicName: string): number {
    const subcontents = this.getSubcontentsForTopic(topicName);
    if (!subcontents) return 0;
    
    // New structure: count videoUrls arrays
    const newStructureCount = subcontents.reduce((sum, sc) => {
      return sum + (sc.videoUrls?.length || 0);
    }, 0);
    
    // Old structure: count VIDEO contentType
    const oldStructureCount = subcontents.filter(c => c.contentType === 'VIDEO').length;
    
    return newStructureCount + oldStructureCount;
  }

  getTopicPdfCount(topicName: string): number {
    const subcontents = this.getSubcontentsForTopic(topicName);
    if (!subcontents) return 0;
    
    // New structure: count pdfUrls arrays
    const newStructureCount = subcontents.reduce((sum, sc) => {
      return sum + (sc.pdfUrls?.length || 0);
    }, 0);
    
    // Old structure: count PDF/DOCUMENT contentType
    const oldStructureCount = subcontents.filter(c => 
      c.contentType === 'PDF' || c.contentType === 'DOCUMENT'
    ).length;
    
    return newStructureCount + oldStructureCount;
  }

  // Content viewer methods
  viewContent(content: any): void {
    this.selectedContent = content;
    this.showContentViewer = true;
  }

  closeContentViewer(): void {
    this.showContentViewer = false;
    this.selectedContent = null;
  }

  getEmbedUrl(url: string): string {
    if (!url) return '';
    
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  }

  isVideoContent(content: any): boolean {
    return content?.contentType === 'VIDEO';
  }

  isPdfContent(content: any): boolean {
    return content?.contentType === 'PDF' || content?.contentType === 'DOCUMENT';
  }

  downloadPdf(url: string, title: string): void {
    window.open(url, '_blank');
  }
}

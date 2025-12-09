import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService, CompleteSubjectContent, TopicWithContent } from '../../services/content.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-detail',
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent implements OnInit {
  subjectId: string = '';
  subjectContent?: CompleteSubjectContent;
  expandedTopics: Set<string> = new Set();
  isLoading: boolean = false;
  errorMessage: string = '';
  userRole: string = '';
  userEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.userEmail = localStorage.getItem('email') || '';
    
    this.route.params.subscribe(params => {
      this.subjectId = params['id'];
      this.loadSubjectContent();
    });
  }

  loadSubjectContent(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.contentService.getCompleteSubjectContent(this.subjectId).subscribe({
      next: (data) => {
        this.subjectContent = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load subject content';
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  toggleTopic(topicId: string): void {
    if (this.expandedTopics.has(topicId)) {
      this.expandedTopics.delete(topicId);
    } else {
      this.expandedTopics.add(topicId);
    }
  }

  isTopicExpanded(topicId: string): boolean {
    return this.expandedTopics.has(topicId);
  }

  expandAll(): void {
    this.subjectContent?.topics.forEach(t => this.expandedTopics.add(t.topic.id!));
  }

  collapseAll(): void {
    this.expandedTopics.clear();
  }

  goBack(): void {
    this.router.navigate(['/subjects']);
  }

  editSubject(): void {
    this.router.navigate(['/subjects/edit', this.subjectId]);
  }

  manageTopics(): void {
    this.router.navigate(['/subjects', this.subjectId, 'topics']);
  }

  addVideo(topicId: string): void {
    this.router.navigate(['/videos/upload'], { 
      queryParams: { topicId, subjectId: this.subjectId } 
    });
  }

  addPDF(topicId: string): void {
    this.router.navigate(['/pdfs/upload'], { 
      queryParams: { topicId, subjectId: this.subjectId } 
    });
  }

  addMCQ(topicId: string): void {
    this.router.navigate(['/mcqs/create'], { 
      queryParams: { topicId, subjectId: this.subjectId } 
    });
  }

  playVideo(videoId: string): void {
    // TODO: Open video player modal or navigate to video page
    console.log('Play video:', videoId);
  }

  viewPDF(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }

  downloadPDF(pdfUrl: string, title: string): void {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title + '.pdf';
    link.click();
  }

  takeMCQQuiz(topicId: string): void {
    this.router.navigate(['/quiz'], { 
      queryParams: { topicId } 
    });
  }

  getDifficultyClass(difficulty: string): string {
    return 'difficulty-' + difficulty.toLowerCase();
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER': return '🌱';
      case 'INTERMEDIATE': return '🔥';
      case 'ADVANCED': return '⚡';
      default: return '';
    }
  }

  canEdit(): boolean {
    return this.userRole === 'INSTRUCTOR' && 
           this.subjectContent?.subject.instructorEmail === this.userEmail ||
           this.userRole === 'ADMIN';
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}

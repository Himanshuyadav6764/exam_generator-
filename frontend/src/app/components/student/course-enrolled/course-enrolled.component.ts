import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StudentProgressService, StudentProgress } from '../../../services/student-progress.service';
import { AuthService } from '../../../services/auth.service';
import { AiQuizService } from '../../../services/ai-quiz.service';

interface TopicWithContent {
  name: string;
  topicId?: string;
  subtopics: Subtopic[];
  completionPercentage: number;
  expanded?: boolean;
  aiQuizCount?: number;
  hasAIQuiz?: boolean;
}

interface Subtopic {
  name: string;
  description: string;
  estimatedTime: string;
  videoUrls: string[];
  pdfUrls: string[];
  mcqCount: number;
  icon: string;
}

interface ContentItem {
  title: string;
  url?: string;
  completed: boolean;
  type: string;
}

@Component({
  selector: 'app-course-enrolled',
  templateUrl: './course-enrolled.component.html',
  styleUrls: ['./course-enrolled.component.css']
})
export class CourseEnrolledComponent implements OnInit {
  courseId: string = '';
  courseDetails: any = null;
  topics: TopicWithContent[] = [];
  loading = false;
  error = '';
  
  // Math object for template
  Math = Math;
  
  // New properties for the redesigned interface
  activeTab: string = 'chapters';
  showTopicDetails: boolean = false;
  selectedTopic: TopicWithContent | null = null;
  contentType: string = 'video';
  completedItems: number = 0;
  totalItems: number = 0;

  // Progress tracking
  studentProgress: StudentProgress | null = null;
  studentEmail: string = '';
  loadingProgress: boolean = false;

  // Performance tracking
  coursePerformance: any = null;
  aiQuizAttempts: number = 0;
  normalQuizAttempts: number = 0;
  aiQuizAvgScore: number = 0;
  normalQuizAvgScore: number = 0;
  aiQuizLowScore: number = 0;
  normalQuizLowScore: number = 0;
  totalTimeSpent: number = 0; // in seconds

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private progressService: StudentProgressService,
    private authService: AuthService,
    private aiQuizService: AiQuizService
  ) {}

  ngOnInit(): void {
    this.studentEmail = this.authService.getEmail() || '';
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.courseId) {
      this.loadCourseDetails();
      this.loadStudentProgress();
      this.loadCoursePerformance();
    }

    // Subscribe to real-time progress updates
    this.progressService.progress$.subscribe(progress => {
      if (progress && progress.courseId === this.courseId) {
        this.studentProgress = progress;
        console.log('📊 Progress updated:', progress);
      }
    });
  }

  loadCourseDetails(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>(`${environment.apiUrl}/courses/${this.courseId}/details`, { headers })
      .subscribe({
        next: (data) => {
          this.courseDetails = data;
          this.prepareTopics(data);
          this.calculateProgress();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load course details';
          this.loading = false;
        }
      });
  }

  prepareTopics(courseData: any): void {
    // Get all topics from the course
    const allTopics = courseData.topics || courseData.subjects || [];
    
    this.topics = allTopics.map((topicName: string) => {
      // Check if this topic has subcontents
      const hasSubcontents = courseData.topicSubcontents && courseData.topicSubcontents[topicName];
      
      let subtopics = [];
      if (hasSubcontents) {
        subtopics = courseData.topicSubcontents[topicName].map((sub: any, index: number) => ({
          name: sub.name,
          description: sub.description || 'Learn more about this topic',
          estimatedTime: this.calculateTime(sub),
          videoUrls: sub.videoUrls || [],
          pdfUrls: sub.pdfUrls || [],
          mcqCount: sub.mcqCount || 0,
          icon: this.getSubtopicIcon(index)
        }));
      }

      // Calculate completion percentage
      let completionPercentage = 0;
      if (subtopics.length > 0) {
        const totalItems = subtopics.reduce((sum: number, sub: any) => 
          sum + sub.videoUrls.length + sub.pdfUrls.length + (sub.mcqCount > 0 ? 1 : 0), 0);
        completionPercentage = totalItems > 0 ? Math.floor(Math.random() * 100) : 0;
      }

      const topic: TopicWithContent = {
        name: topicName,
        topicId: topicName.replace(/\s+/g, '_').toLowerCase(),
        subtopics: subtopics,
        completionPercentage: completionPercentage,
        expanded: false,
        aiQuizCount: 0,
        hasAIQuiz: false
      };

      // Fetch AI Quiz count for this topic
      this.loadAIQuizCountForTopic(topic);

      return topic;
    });
  }

  loadAIQuizCountForTopic(topic: TopicWithContent): void {
    if (!this.courseId) return;
    
    // Get all AI quizzes for this course and filter by topic name
    this.aiQuizService.getAIQuizzesForCourse(this.courseId).subscribe({
      next: (response) => {
        if (response.success && response.quizzes) {
          // Count quizzes matching this topic name
          const topicQuizzes = response.quizzes.filter((quiz: any) => 
            quiz.topicName === topic.name
          );
          topic.aiQuizCount = topicQuizzes.length;
          topic.hasAIQuiz = topicQuizzes.length > 0;
          console.log(`✓ Found ${topicQuizzes.length} AI quizzes for topic: ${topic.name}`);
        }
      },
      error: (err) => {
        console.log('No AI quizzes for course:', this.courseId);
        topic.aiQuizCount = 0;
        topic.hasAIQuiz = false;
      }
    });
  }

  calculateProgress(): void {
    // Calculate total items and completed items
    this.totalItems = 0;
    this.completedItems = 0;

    this.topics.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        this.totalItems += subtopic.videoUrls.length;
        this.totalItems += subtopic.pdfUrls.length;
        this.totalItems += (subtopic.mcqCount > 0 ? 1 : 0);
      });
    });

    // For demo, set some items as completed (replace with backend data)
    this.completedItems = Math.floor(this.totalItems * 0.07);
  }

  getCompletionPercentage(): number {
    if (this.totalItems === 0) return 0;
    return Math.floor((this.completedItems / this.totalItems) * 100);
  }

  calculateTime(subtopic: any): string {
    const videos = subtopic.videoCount || 0;
    const pdfs = subtopic.pdfCount || 0;
    const minutes = (videos * 10) + (pdfs * 5);
    return minutes > 0 ? `${minutes} min` : '5 min';
  }

  getSubtopicIcon(index: number): string {
    const icons = ['📖', '🎯', '💡', '🚀', '⚡', '🔥', '✨', '🌟'];
    return icons[index % icons.length];
  }

  getUserInitials(): string {
    const email = localStorage.getItem('email') || 'Student';
    return email.substring(0, 2).toUpperCase();
  }

  openTopicDetails(topic: TopicWithContent): void {
    this.selectedTopic = topic;
    this.showTopicDetails = true;
    this.contentType = 'video'; // Default to video tab
  }

  closeTopicDetails(): void {
    this.showTopicDetails = false;
    this.selectedTopic = null;
  }

  changeContentType(type: string): void {
    this.contentType = type;
  }

  getVideoContent(): ContentItem[] {
    if (!this.selectedTopic) return [];
    
    const videos: ContentItem[] = [];
    this.selectedTopic.subtopics.forEach((subtopic) => {
      subtopic.videoUrls.forEach((url, videoIndex) => {
        videos.push({
          title: subtopic.name,
          url: url,
          completed: false, // Will be tracked from backend later
          type: 'video'
        });
      });
    });
    return videos;
  }

  getPDFContent(): ContentItem[] {
    if (!this.selectedTopic) return [];
    
    const pdfs: ContentItem[] = [];
    this.selectedTopic.subtopics.forEach((subtopic) => {
      subtopic.pdfUrls.forEach((url, pdfIndex) => {
        pdfs.push({
          title: subtopic.name,
          url: url,
          completed: false,
          type: 'pdf'
        });
      });
    });
    return pdfs;
  }

  getMCQContent(): ContentItem[] {
    if (!this.selectedTopic) return [];
    
    const mcqs: ContentItem[] = [];
    this.selectedTopic.subtopics.forEach((subtopic) => {
      if (subtopic.mcqCount > 0) {
        mcqs.push({
          title: subtopic.name,
          completed: false,
          type: 'mcq'
        });
      }
    });
    return mcqs;
  }

  getAIQuizContent(): ContentItem[] {
    if (!this.selectedTopic || !this.selectedTopic.hasAIQuiz) return [];
    
    return [{
      title: `AI Quiz - ${this.selectedTopic.name}`,
      completed: false,
      type: 'ai-quiz'
    }];
  }

  openContent(item: ContentItem, type: string): void {
    if (!this.selectedTopic) return;
    
    const topicName = this.selectedTopic.name;
    
    if (type === 'video') {
      // Open video in learning workspace with video URL
      const subtopicName = item.title;
      const videoUrl = item.url || '';
      this.router.navigate(['/learning-workspace', this.courseId, topicName, subtopicName], {
        queryParams: { contentType: 'video', url: videoUrl }
      });
    } else if (type === 'pdf' || type === 'article') {
      // Open PDF in learning workspace
      const subtopicName = item.title;
      const pdfUrl = item.url || '';
      this.router.navigate(['/learning-workspace', this.courseId, topicName, subtopicName], {
        queryParams: { contentType: 'pdf', url: pdfUrl }
      });
    } else if (type === 'mcq' || type === 'quiz') {
      // Navigate to learning workspace with MCQ content type
      const subtopicName = item.title;
      this.router.navigate(['/learning-workspace', this.courseId, topicName, subtopicName], {
        queryParams: { 
          contentType: 'mcq',
          courseId: this.courseId,
          topic: topicName,
          subtopic: subtopicName
        }
      });
    } else if (type === 'ai-quiz') {
      // Navigate to AI Quiz attempt page
      this.router.navigate(['/ai-quiz-attempt', this.courseId, this.selectedTopic.topicId], {
        queryParams: { 
          topicName: topicName
        }
      });
    }
  }

  toggleTopic(topic: TopicWithContent): void {
    topic.expanded = !topic.expanded;
  }

  openSubtopic(topicName: string, subtopic: Subtopic): void {
    this.router.navigate(['/learning-workspace', this.courseId, topicName, subtopic.name]);
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard']);
  }

  // Progress tracking methods
  loadStudentProgress(): void {
    if (!this.studentEmail || !this.courseId) return;
    
    this.loadingProgress = true;
    this.progressService.getProgress(this.studentEmail, this.courseId).subscribe({
      next: (progress) => {
        this.studentProgress = progress;
        this.loadingProgress = false;
        console.log('✅ Student progress loaded:', progress);
        
        // Calculate course performance from progress data
        this.loadCoursePerformance();
      },
      error: (err) => {
        console.error('Error loading progress:', err);
        this.loadingProgress = false;
      }
    });
  }

  getOverallScore(): string {
    if (!this.coursePerformance) return '0%';
    // Calculate average from all quizzes
    const totalAttempts = this.normalQuizAttempts + this.aiQuizAttempts;
    if (totalAttempts === 0) return '0%';
    const avgScore = ((this.normalQuizAvgScore * this.normalQuizAttempts) + (this.aiQuizAvgScore * this.aiQuizAttempts)) / totalAttempts;
    return Math.round(avgScore) + '%';
  }

  getTimeSpent(): string {
    if (!this.coursePerformance || this.totalTimeSpent === 0) return '0m';
    return this.formatTimeSpent(this.totalTimeSpent);
  }

  getQuizzesCount(): number {
    return this.normalQuizAttempts;
  }

  getAIQuizzesCount(): number {
    return this.aiQuizAttempts;
  }

  getCurrentLevel(): string {
    const totalAttempts = this.normalQuizAttempts + this.aiQuizAttempts;
    if (totalAttempts === 0) return 'BEGINNER';
    const avgScore = ((this.normalQuizAvgScore * this.normalQuizAttempts) + (this.aiQuizAvgScore * this.aiQuizAttempts)) / totalAttempts;
    if (avgScore >= 90) return 'ADVANCED';
    if (avgScore >= 70) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  getLevelColor(): string {
    const level = this.getCurrentLevel();
    switch(level) {
      case 'ADVANCED': return '#10b981';
      case 'INTERMEDIATE': return '#f59e0b';
      case 'BEGINNER': return '#6366f1';
      default: return '#6366f1';
    }
  }

  getTotalAttempts(): number {
    return this.normalQuizAttempts + this.aiQuizAttempts;
  }

  getAverageScore(): string {
    const totalAttempts = this.normalQuizAttempts + this.aiQuizAttempts;
    if (totalAttempts === 0) return '0%';
    const avgScore = ((this.normalQuizAvgScore * this.normalQuizAttempts) + (this.aiQuizAvgScore * this.aiQuizAttempts)) / totalAttempts;
    return Math.round(avgScore) + '%';
  }

  getCompletionStatus(): string {
    // Calculate completion based on quizzes passed vs available
    if (!this.studentProgress) return '0%';
    const total = this.normalQuizAttempts + this.aiQuizAttempts;
    if (total === 0) return '0%';
    const passed = this.studentProgress.quizzesPassed || 0;
    const percentage = Math.round((passed / total) * 100);
    return percentage + '%';
  }

  // Load course performance (AI and normal quizzes)
  loadCoursePerformance(): void {
    if (!this.studentEmail || !this.courseId) return;

    // Use StudentProgress data which is already loaded
    if (this.studentProgress && this.studentProgress.quizAttempts) {
      this.coursePerformance = { success: true };
      
      // Separate normal and AI quizzes
      const normalQuizzes = this.studentProgress.quizAttempts.filter((q: any) => q.quizType === 'normal' || !q.quizType);
      const aiQuizzes = this.studentProgress.quizAttempts.filter((q: any) => q.quizType === 'ai');
      
      // Calculate normal quiz stats
      this.normalQuizAttempts = normalQuizzes.length;
      if (normalQuizzes.length > 0) {
        const normalScores = normalQuizzes.map((q: any) => (q.score / q.totalQuestions) * 100);
        const normalScoreSum = normalScores.reduce((sum: number, score: number) => sum + score, 0);
        this.normalQuizAvgScore = Math.round(normalScoreSum / normalQuizzes.length);
        this.normalQuizLowScore = Math.round(Math.min(...normalScores));
      } else {
        this.normalQuizAvgScore = 0;
        this.normalQuizLowScore = 0;
      }
      
      // Calculate AI quiz stats
      this.aiQuizAttempts = aiQuizzes.length;
      if (aiQuizzes.length > 0) {
        const aiScores = aiQuizzes.map((q: any) => (q.score / q.totalQuestions) * 100);
        const aiScoreSum = aiScores.reduce((sum: number, score: number) => sum + score, 0);
        this.aiQuizAvgScore = Math.round(aiScoreSum / aiQuizzes.length);
        this.aiQuizLowScore = Math.round(Math.min(...aiScores));
      } else {
        this.aiQuizAvgScore = 0;
        this.aiQuizLowScore = 0;
      }
      
      // Get total time spent in minutes
      this.totalTimeSpent = this.studentProgress.totalTimeSpentMinutes || 0;
      
      console.log('✓ Performance calculated from StudentProgress:', {
        normalQuizzes: this.normalQuizAttempts,
        normalAvg: this.normalQuizAvgScore,
        normalLow: this.normalQuizLowScore,
        aiQuizzes: this.aiQuizAttempts,
        aiAvg: this.aiQuizAvgScore,
        aiLow: this.aiQuizLowScore,
        timeSpentMinutes: this.totalTimeSpent,
        totalQuizAttempts: this.studentProgress.quizAttempts?.length || 0
      });
      
      // Log quiz attempts for debugging
      if (this.studentProgress.quizAttempts && this.studentProgress.quizAttempts.length > 0) {
        console.log('📊 Quiz Attempts Breakdown:');
        this.studentProgress.quizAttempts.forEach((q: any, index: number) => {
          console.log(`   ${index + 1}. Type: ${q.quizType || 'undefined'}, Score: ${q.score}/${q.totalQuestions}, Title: ${q.quizTitle}`);
        });
      }
    }
  }

  // Format time from minutes to readable format
  formatTimeSpent(minutes: number): string {
    if (minutes < 1) return '0m';
    const mins = Math.floor(minutes);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

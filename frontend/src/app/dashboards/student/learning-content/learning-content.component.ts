import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-learning-content',
  templateUrl: './learning-content.component.html',
  styleUrls: ['./learning-content.component.css']
})
export class LearningContentComponent implements OnInit, OnDestroy {
  
  courseId: string = '';
  courseName: string = '';
  course: any = null;
  studentEmail: string = '';
  
  // Current selection
  selectedTopic: string = '';
  selectedSubtopic: any = null;
  
  // Content display
  currentVideoUrl: SafeResourceUrl | null = null;
  currentPdfUrl: string = '';
  showingVideo: boolean = false;
  showingPdf: boolean = false;
  showingMcq: boolean = false;
  
  // MCQ data
  mcqQuestions: any[] = [];
  currentQuestionIndex: number = 0;
  userAnswers: any = {};
  quizSubmitted: boolean = false;
  quizScore: number = 0;
  mcqLoading: boolean = false;
  mcqError: string = '';
  
  // Timer
  quizTimer: any = null;
  timeRemaining: number = 0;
  totalQuizTime: number = 0;
  quizStartTime: Date | null = null;
  quizEndTime: Date | null = null;
  
  // Progress tracking
  completedSubtopics: Set<string> = new Set();
  videoStartTime: Date | null = null;
  pdfStartTime: Date | null = null;
  
  // Expose helpers to template
  Math = Math;
  String = String;
  
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentEmail = user.email;
    }

    this.route.queryParams.subscribe(params => {
      this.courseId = params['courseId'] || '';
      this.courseName = params['courseName'] || '';
      
      if (this.courseId) {
        this.loadCourse();
      } else {
        this.error = 'No course selected';
        this.loading = false;
      }
    });
  }

  loadCourse(): void {
    this.loading = true;
    
    if (!this.courseId) {
      console.error('No course ID provided');
      this.error = 'No course selected';
      this.loading = false;
      return;
    }
    
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (response) => {
        this.course = response;
        this.loading = false;
        
        if (this.course.topics && this.course.topics.length > 0) {
          this.selectTopic(this.course.topics[0]);
        }
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.error = 'Failed to load course content. Please try again.';
        this.loading = false;
      }
    });
  }

  selectTopic(topicName: string): void {
    this.selectedTopic = topicName;
    this.selectedSubtopic = null;
    this.resetContentDisplay();
  }

  selectSubtopic(subtopic: any): void {
    this.selectedSubtopic = subtopic;
    this.resetContentDisplay();
    
    // Mark as completed and track progress
    const subtopicKey = `${this.selectedTopic}-${subtopic.title}`;
    this.completedSubtopics.add(subtopicKey);
    this.saveSubtopicProgress(subtopic.title);
    
    // Auto-play video if available
    if (subtopic.videoUrl) {
      this.playVideo(subtopic.videoUrl);
    } else if (subtopic.pdfUrl) {
      this.viewPdf(subtopic.pdfUrl);
    }
  }

  getSubtopicsForTopic(topicName: string): any[] {
    if (!this.course || !this.course.topicSubcontents) {
      return [];
    }
    return this.course.topicSubcontents[topicName] || [];
  }

  playVideo(videoUrl: string): void {
    // Track previous video time before switching
    if (this.showingVideo && this.videoStartTime) {
      this.trackVideoWatch();
    }
    
    this.resetContentDisplay();
    this.showingVideo = true;
    this.videoStartTime = new Date();
    
    // Convert YouTube URL to embed format if needed
    let embedUrl = videoUrl;
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    this.currentVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  viewPdf(pdfUrl: string): void {
    // Track previous PDF time before switching
    if (this.showingPdf && this.pdfStartTime) {
      this.trackPdfView();
    }
    
    this.resetContentDisplay();
    this.showingPdf = true;
    this.pdfStartTime = new Date();
    this.currentPdfUrl = pdfUrl;
  }

  loadMcqForTopic(): void {
    if (!this.selectedTopic) {
      alert('Please select a topic first!');
      return;
    }
    
    this.resetContentDisplay();
    this.showingMcq = true;
    this.mcqLoading = true;
    this.mcqError = '';
    
    console.log('Loading MCQ for:', {
      courseId: this.courseId,
      topic: this.selectedTopic
    });
    
    // Load MCQ questions for this topic from instructor-created quizzes
    this.courseService.getMcqByCourseTopic(this.courseId, this.selectedTopic).subscribe({
      next: (response) => {
        console.log('MCQ Response:', response);
        
        if (response && response.length > 0) {
          this.mcqQuestions = response;
          this.currentQuestionIndex = 0;
          this.userAnswers = {};
          this.quizSubmitted = false;
          this.mcqLoading = false;
          
          // Start timer (30 seconds per question)
          this.totalQuizTime = this.mcqQuestions.length * 30;
          this.timeRemaining = this.totalQuizTime;
          this.quizStartTime = new Date();
          this.startQuizTimer();
        } else {
          this.mcqError = 'No quizzes available for this topic yet. Your instructor will add them soon!';
          this.mcqQuestions = [];
          this.mcqLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading MCQ:', err);
        this.mcqError = 'Failed to load quizzes. Please try again later.';
        this.mcqQuestions = [];
        this.mcqLoading = false;
      }
    });
  }

  startQuizTimer(): void {
    this.stopQuizTimer();
    this.quizTimer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.stopQuizTimer();
        this.submitQuiz();
        alert('Time is up! Quiz submitted automatically.');
      }
    }, 1000);
  }

  submitQuiz(): void {
    this.stopQuizTimer();
    this.quizEndTime = new Date();
    
    let correctCount = 0;
    
    this.mcqQuestions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
        correctCount++;
      }
    });
    
    this.quizScore = Math.round((correctCount / this.mcqQuestions.length) * 100);
    this.quizSubmitted = true;
    
    // Track quiz attempt
    this.trackQuizAttempt(correctCount);
  }

  retryQuiz(): void {
    this.userAnswers = {};
    this.quizSubmitted = false;
    this.currentQuestionIndex = 0;
    this.quizScore = 0;
    
    // Restart timer
    this.timeRemaining = this.totalQuizTime;
    this.quizStartTime = new Date();
    this.quizEndTime = null;
    this.startQuizTimer();
  }

  getTimeTaken(): string {
    if (!this.quizStartTime || !this.quizEndTime) return '0m 0s';
    
    const diff = this.quizEndTime.getTime() - this.quizStartTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  getCorrectAnswersCount(): number {
    let count = 0;
    this.mcqQuestions.forEach((question, index) => {
      if (this.userAnswers[index] === question.correctAnswer) {
        count++;
      }
    });
    return count;
  }

  getWrongAnswersCount(): number {
    return this.mcqQuestions.length - this.getCorrectAnswersCount();
  }

  stopQuizTimer(): void {
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }
  }

  getTimerDisplay(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    const percentRemaining = (this.timeRemaining / this.totalQuizTime) * 100;
    if (percentRemaining > 50) return '#4ade80'; // green
    if (percentRemaining > 20) return '#f59e0b'; // orange
    return '#ef4444'; // red
  }

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (!this.quizSubmitted) {
      this.userAnswers[questionIndex] = optionIndex;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.mcqQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  resetContentDisplay(): void {
    // Track time before resetting
    if (this.showingVideo && this.videoStartTime) {
      this.trackVideoWatch();
    }
    if (this.showingPdf && this.pdfStartTime) {
      this.trackPdfView();
    }
    
    this.showingVideo = false;
    this.showingPdf = false;
    this.showingMcq = false;
    this.currentVideoUrl = null;
    this.currentPdfUrl = '';
    this.stopQuizTimer();
    this.videoStartTime = null;
    this.pdfStartTime = null;
  }

  goBack(): void {
    // Track time before leaving
    if (this.showingVideo && this.videoStartTime) {
      this.trackVideoWatch();
    }
    if (this.showingPdf && this.pdfStartTime) {
      this.trackPdfView();
    }
    
    this.stopQuizTimer();
    this.router.navigate(['/adaptive-panel']);
  }

  ngOnDestroy(): void {
    // Track time before component destroys
    if (this.showingVideo && this.videoStartTime) {
      this.trackVideoWatch();
    }
    if (this.showingPdf && this.pdfStartTime) {
      this.trackPdfView();
    }
    
    this.stopQuizTimer();
  }

  // Progress tracking methods
  trackVideoWatch(): void {
    if (!this.videoStartTime || !this.selectedSubtopic) return;
    
    const timeSpentSeconds = Math.floor((new Date().getTime() - this.videoStartTime.getTime()) / 1000);
    
    if (timeSpentSeconds < 3) return; // Ignore very short views
    
    const payload = {
      studentEmail: this.studentEmail,
      courseId: this.courseId,
      topicName: this.selectedTopic,
      videoTitle: this.selectedSubtopic.title,
      timeSpentSeconds: timeSpentSeconds
    };
    
    this.courseService.trackVideoWatch(payload).subscribe({
      next: () => console.log('📊 Video watch tracked:', timeSpentSeconds, 'seconds'),
      error: (err) => console.error('❌ Failed to track video:', err)
    });
  }

  trackPdfView(): void {
    if (!this.pdfStartTime || !this.selectedSubtopic) return;
    
    const timeSpentSeconds = Math.floor((new Date().getTime() - this.pdfStartTime.getTime()) / 1000);
    
    if (timeSpentSeconds < 3) return; // Ignore very short views
    
    const payload = {
      studentEmail: this.studentEmail,
      courseId: this.courseId,
      topicName: this.selectedTopic,
      pdfTitle: this.selectedSubtopic.title,
      timeSpentSeconds: timeSpentSeconds
    };
    
    this.courseService.trackPdfView(payload).subscribe({
      next: () => {},
      error: (err) => console.error('Failed to track PDF:', err)
    });
  }

  saveSubtopicProgress(subtopicName: string): void {
    if (!this.studentEmail || !this.courseId) return;
    
    const payload = {
      studentEmail: this.studentEmail,
      courseId: this.courseId,
      topicName: this.selectedTopic,
      subtopicName: subtopicName
    };
    
    this.courseService.saveSubtopicProgress(payload).subscribe({
      next: () => {},
      error: (err) => console.error('Failed to save progress:', err)
    });
  }

  trackQuizAttempt(correctCount: number): void {
    if (!this.studentEmail || !this.courseId || !this.quizStartTime || !this.quizEndTime) {
      return;
    }

    const timeSpentSeconds = Math.floor((this.quizEndTime.getTime() - this.quizStartTime.getTime()) / 1000);
    
    const payload = {
      studentEmail: this.studentEmail,
      courseId: this.courseId,
      topicName: this.selectedTopic,
      score: correctCount,
      totalQuestions: this.mcqQuestions.length,
      timeSpentSeconds: timeSpentSeconds,
      difficulty: 'MEDIUM'
    };
    
    this.courseService.trackQuizAttempt(payload).subscribe({
      next: (response) => {
      },
      error: (error) => {
        console.error('Error tracking quiz attempt:', error);
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.course || !this.course.topics) {
      return 0;
    }
    
    // Calculate based on completed subtopics
    let totalSubtopics = 0;
    this.course.topics.forEach((topic: string) => {
      const subtopics = this.getSubtopicsForTopic(topic);
      totalSubtopics += subtopics.length;
    });
    
    if (totalSubtopics === 0) {
      return 0;
    }
    
    return Math.round((this.completedSubtopics.size / totalSubtopics) * 100);
  }
  
  isSubtopicCompleted(topic: string, subtopic: any): boolean {
    const subtopicKey = `${topic}-${subtopic.title}`;
    return this.completedSubtopics.has(subtopicKey);
  }
}

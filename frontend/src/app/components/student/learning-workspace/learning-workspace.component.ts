import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MCQService, MCQ } from '../../../services/mcq.service';
import { StudentProgressService } from '../../../services/student-progress.service';
import { AdaptiveLearningService } from '../../../services/adaptive-learning.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-learning-workspace',
  templateUrl: './learning-workspace.component.html',
  styleUrls: ['./learning-workspace.component.css']
})
export class LearningWorkspaceComponent implements OnInit, OnDestroy {
  courseId: string = '';
  topicName: string = '';
  subtopicName: string = '';
  
  activeTab: 'video' | 'pdf' | 'mcq' | 'notes' | 'assignment' = 'video';
  
  // Sample data - will be loaded from API
  videoUrls: string[] = [];
  pdfUrls: string[] = [];
  mcqCount: number = 0;
  notes: string = '';
  
  // Notes state
  notesLoading: boolean = false;
  notesSaving: boolean = false;
  notesSaveMessage: string = '';
  
  currentVideoIndex: number = 0;
  currentPdfIndex: number = 0;

  // Quiz state
  quizStarted: boolean = false;
  quizCompleted: boolean = false;
  mcqQuestions: MCQ[] = [];
  currentQuestionIndex: number = 0;
  currentQuestion: MCQ | null = null;
  selectedAnswer: number | null = null;
  answerSubmitted: boolean = false;
  quizScore: number = 0;
  userAnswers: (number | null)[] = [];

  // Time tracking
  private sessionStartTime: Date = new Date();
  private videoStartTime: Date | null = null;
  private pdfStartTime: Date | null = null;
  private quizStartTime: Date | null = null;
  private trackingInterval: any;
  
  studentEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public sanitizer: DomSanitizer,
    private mcqService: MCQService,
    private progressService: StudentProgressService,
    private adaptiveService: AdaptiveLearningService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.studentEmail = this.authService.getEmail() || '';
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.topicName = this.route.snapshot.paramMap.get('topic') || '';
    this.subtopicName = this.route.snapshot.paramMap.get('subtopic') || '';
    
    // Start tracking time
    this.sessionStartTime = new Date();
    this.startTimeTracking();
    
    // Load notes for this topic/subtopic
    this.loadNotes();
    
    // Check for query parameters from course-enrolled component
    this.route.queryParams.subscribe(params => {
      const contentType = params['contentType'];
      const contentUrl = params['url'];
      
      if (contentType && contentUrl) {
        // Set the active tab based on content type
        if (contentType === 'video') {
          this.activeTab = 'video';
          this.videoUrls = [contentUrl];
          this.currentVideoIndex = 0;
          this.videoStartTime = new Date();
        } else if (contentType === 'pdf') {
          this.activeTab = 'pdf';
          this.pdfUrls = [contentUrl];
          this.currentPdfIndex = 0;
          this.pdfStartTime = new Date();
        }
      } else if (contentType === 'mcq') {
        // Handle MCQ content type
        this.activeTab = 'mcq';
        // Load MCQs immediately when navigating to MCQ tab
        this.loadMCQsForPreview();
      } else {
        // Load subtopic data only if no specific content URL provided
        this.loadSubtopicData();
      }
    });
  }

  ngOnDestroy(): void {
    // Save all tracked time before leaving
    this.stopTimeTracking();
    this.saveCurrentTabTime();
  }

  private startTimeTracking(): void {
    // Track time every 30 seconds
    this.trackingInterval = setInterval(() => {
      this.saveCurrentTabTime();
    }, 30000); // 30 seconds
  }

  private stopTimeTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
  }

  private saveCurrentTabTime(): void {
    const now = new Date();
    
    if (this.activeTab === 'video' && this.videoStartTime) {
      const seconds = Math.floor((now.getTime() - this.videoStartTime.getTime()) / 1000);
      if (seconds > 5) { // Only save if watched for more than 5 seconds
        this.recordVideoTime(seconds);
        this.videoStartTime = now; // Reset timer
      }
    } else if (this.activeTab === 'pdf' && this.pdfStartTime) {
      const seconds = Math.floor((now.getTime() - this.pdfStartTime.getTime()) / 1000);
      if (seconds > 5) {
        this.recordPdfTime(seconds);
        this.pdfStartTime = now;
      }
    }
  }

  private recordVideoTime(seconds: number): void {
    if (!this.studentEmail || !this.courseId) return;
    
    const videoTitle = `${this.topicName} - Video ${this.currentVideoIndex + 1}`;
    
    this.progressService.recordVideoWatch(
      this.studentEmail,
      this.courseId,
      this.topicName,
      seconds,
      videoTitle
    ).subscribe({
      next: () => console.log(`✅ Recorded ${seconds}s of video watch`),
      error: (err) => console.error('Error recording video time:', err)
    });
  }

  private recordPdfTime(seconds: number): void {
    if (!this.studentEmail || !this.courseId) return;
    
    const pdfTitle = `${this.topicName} - PDF ${this.currentPdfIndex + 1}`;
    
    this.progressService.recordPdfView(
      this.studentEmail,
      this.courseId,
      this.topicName,
      seconds,
      pdfTitle
    ).subscribe({
      next: () => console.log(`✅ Recorded ${seconds}s of PDF view`),
      error: (err) => console.error('Error recording PDF time:', err)
    });
  }

  loadSubtopicData(): void {
    // TODO: Load from API
    // For now using sample data
    this.videoUrls = [
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/jNQXAC9IVRw'
    ];
    this.pdfUrls = [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    ];
    this.mcqCount = 5;
  }

  switchTab(tab: 'video' | 'pdf' | 'mcq' | 'notes' | 'assignment'): void {
    // Save time for current tab before switching
    this.saveCurrentTabTime();
    
    this.activeTab = tab;
    
    // Start tracking for new tab
    if (tab === 'video') {
      this.videoStartTime = new Date();
    } else if (tab === 'pdf') {
      this.pdfStartTime = new Date();
    } else if (tab === 'mcq') {
      // MCQs already loaded in preview
    }
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Enhanced PDF viewer that works with all document types
  getSafePdfUrl(url: string): SafeResourceUrl {
    // Use Google Docs Viewer for better compatibility with all document types
    // Supports PDF, Word, Excel, PowerPoint, etc.
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  goBack(): void {
    this.router.navigate(['/course-enrolled', this.courseId]);
  }

  nextVideo(): void {
    if (this.currentVideoIndex < this.videoUrls.length - 1) {
      this.currentVideoIndex++;
    }
  }

  previousVideo(): void {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
    }
  }

  nextPdf(): void {
    if (this.currentPdfIndex < this.pdfUrls.length - 1) {
      this.currentPdfIndex++;
    }
  }

  previousPdf(): void {
    if (this.currentPdfIndex > 0) {
      this.currentPdfIndex--;
    }
  }

  saveNotes(): void {
    if (!this.studentEmail || !this.courseId || !this.topicName || !this.subtopicName) {
      console.error('Missing required parameters for saving notes');
      return;
    }

    this.notesSaving = true;
    this.notesSaveMessage = '';

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const requestBody = {
      studentEmail: this.studentEmail,
      courseId: this.courseId,
      topicName: this.topicName,
      subtopicName: this.subtopicName,
      notes: this.notes
    };

    const http = (this.progressService as any).http;
    
    http.post('http://localhost:8081/api/progress/notes/save', requestBody, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Notes saved successfully:', response);
          this.notesSaving = false;
          this.notesSaveMessage = '✓ Notes saved!';
          setTimeout(() => this.notesSaveMessage = '', 3000);
        },
        error: (err: any) => {
          console.error('❌ Error saving notes:', err);
          this.notesSaving = false;
          this.notesSaveMessage = '✗ Failed to save notes';
          setTimeout(() => this.notesSaveMessage = '', 3000);
        }
      });
  }

  loadNotes(): void {
    if (!this.studentEmail || !this.courseId || !this.topicName || !this.subtopicName) {
      return;
    }

    this.notesLoading = true;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const http = (this.progressService as any).http;
    const url = `http://localhost:8081/api/progress/notes/${this.studentEmail}/${this.courseId}/${this.topicName}/${this.subtopicName}`;

    http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.notes = response.notes || '';
        this.notesLoading = false;
        console.log('✅ Notes loaded:', this.notes.length, 'characters');
      },
      error: (err: any) => {
        console.error('❌ Error loading notes:', err);
        this.notesLoading = false;
        this.notes = '';
      }
    });
  }

  // MCQ Quiz Methods
  loadMCQsForPreview(): void {
    // Load MCQs just to check count, don't start quiz yet
    if (!this.courseId || !this.topicName) {
      console.error('Missing courseId or topicName for MCQ preview');
      return;
    }

    console.log('🔍 Loading MCQs for preview - CourseId:', this.courseId, 'Topic:', this.topicName);

    this.mcqService.getMCQsByCourse(this.courseId).subscribe({
      next: (mcqs: MCQ[]) => {
        console.log('📦 Received MCQs from API:', mcqs.length);
        // Filter MCQs by topic name
        this.mcqQuestions = mcqs.filter(mcq => mcq.topicName === this.topicName);
        this.mcqCount = this.mcqQuestions.length;
        
        console.log('✅ Filtered MCQs for topic "' + this.topicName + '":', this.mcqCount);
        
        if (this.mcqQuestions.length === 0) {
          console.warn('⚠️ No MCQs found for topic:', this.topicName);
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading MCQs for preview:', error);
        this.mcqCount = 0;
      }
    });
  }

  startQuiz(): void {
    if (this.mcqQuestions.length > 0) {
      // MCQs already loaded, just start
      this.quizStarted = true;
      this.quizStartTime = new Date(); // Start quiz timer
      this.currentQuestionIndex = 0;
      this.currentQuestion = this.mcqQuestions[0];
      this.userAnswers = new Array(this.mcqQuestions.length).fill(null);
    } else {
      // Load MCQs and start
      this.loadMCQs();
    }
  }

  loadMCQs(): void {
    if (!this.courseId || !this.topicName) {
      console.error('Missing courseId or topicName');
      return;
    }

    // Fetch MCQs for this course and topic
    this.mcqService.getMCQsByCourse(this.courseId).subscribe({
      next: (mcqs: MCQ[]) => {
        // Filter MCQs by topic name
        this.mcqQuestions = mcqs.filter(mcq => mcq.topicName === this.topicName);
        this.mcqCount = this.mcqQuestions.length;
        
        if (this.mcqQuestions.length > 0) {
          this.quizStarted = true;
          this.quizStartTime = new Date(); // Start quiz timer
          this.currentQuestionIndex = 0;
          this.currentQuestion = this.mcqQuestions[0];
          this.userAnswers = new Array(this.mcqQuestions.length).fill(null);
        } else {
          console.warn('No MCQs found for this topic');
        }
      },
      error: (error: any) => {
        console.error('Error loading MCQs:', error);
        this.mcqCount = 0;
      }
    });
  }

  selectAnswer(optionIndex: number): void {
    if (!this.answerSubmitted) {
      this.selectedAnswer = optionIndex;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null) return;
    
    this.answerSubmitted = true;
    this.userAnswers[this.currentQuestionIndex] = this.selectedAnswer;
    
    // Check if answer is correct
    if (this.selectedAnswer === this.currentQuestion?.correctAnswerIndex) {
      this.quizScore++;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.mcqQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.mcqQuestions[this.currentQuestionIndex];
      this.selectedAnswer = this.userAnswers[this.currentQuestionIndex];
      this.answerSubmitted = this.userAnswers[this.currentQuestionIndex] !== null;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.mcqQuestions[this.currentQuestionIndex];
      this.selectedAnswer = this.userAnswers[this.currentQuestionIndex];
      this.answerSubmitted = this.userAnswers[this.currentQuestionIndex] !== null;
    }
  }

  finishQuiz(): void {
    this.quizCompleted = true;
    this.quizStarted = false;
    
    // Calculate quiz duration
    if (this.quizStartTime) {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - this.quizStartTime.getTime()) / 1000);
      
      // Record quiz attempt in BOTH systems for backward compatibility
      if (this.studentEmail && this.courseId) {
        // 1. Record in adaptive learning system (NEW - with separate MCQ tracking)
        const adaptiveRequest = {
          studentEmail: this.studentEmail,
          courseId: this.courseId,
          topicName: this.topicName,
          score: this.quizScore,
          totalQuestions: this.mcqQuestions.length,
          difficulty: 'INTERMEDIATE',
          timeSpent: seconds
          // quizId is undefined/null for normal MCQs (not AI_QUIZ)
        };
        
        this.adaptiveService.recordQuizAttempt(adaptiveRequest).subscribe({
          next: (response) => {
            console.log('✅ MCQ Quiz tracked in adaptive system:', response);
            console.log('  - Current Difficulty:', response.currentDifficulty);
            console.log('  - Recommended Topic:', response.recommendation?.topic);
          },
          error: (err) => console.error('❌ Failed to track MCQ in adaptive system:', err)
        });
        
        // 2. Record in old progress system (for backward compatibility)
        this.progressService.recordQuizAttempt(
          this.studentEmail,
          this.courseId,
          this.topicName,
          this.quizScore,
          this.mcqQuestions.length,
          seconds,
          'MEDIUM'
        ).subscribe({
          next: (progress) => {
            console.log('✅ Quiz recorded in old system - Overall Score:', progress.overallScore + '%');
          },
          error: (err) => console.error('Error recording quiz in old system:', err)
        });
      }
      
      this.quizStartTime = null;
    }
  }

  retakeQuiz(): void {
    this.quizCompleted = false;
    this.quizStarted = true;
    this.quizStartTime = new Date(); // Restart timer
    this.currentQuestionIndex = 0;
    this.currentQuestion = this.mcqQuestions[0];
    this.selectedAnswer = null;
    this.answerSubmitted = false;
    this.quizScore = 0;
    this.userAnswers = new Array(this.mcqQuestions.length).fill(null);
  }

  exitQuiz(): void {
    this.quizCompleted = false;
    this.quizStarted = false;
    this.goBack();
  }

  getScorePercentage(): number {
    if (this.mcqQuestions.length === 0) return 0;
    return Math.round((this.quizScore / this.mcqQuestions.length) * 100);
  }
}

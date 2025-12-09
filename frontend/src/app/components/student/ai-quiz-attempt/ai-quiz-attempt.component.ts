import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AiQuizService } from '../../../services/ai-quiz.service';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  marks: number;
  selectedAnswer?: number;
}

interface Quiz {
  _id: string;
  courseId: string;
  topicName: string;
  title: string;
  description?: string;
  duration: number;
  questions: QuizQuestion[];
}

@Component({
  selector: 'app-ai-quiz-attempt',
  templateUrl: './ai-quiz-attempt.component.html',
  styleUrls: ['./ai-quiz-attempt.component.css']
})
export class AiQuizAttemptComponent implements OnInit {
  courseId: string = '';
  topicId: string = '';
  topicName: string = '';
  quiz: Quiz | null = null;
  questions: QuizQuestion[] = [];
  loading: boolean = true;
  submitted: boolean = false;
  score: number = 0;
  totalQuestions: number = 0;
  correctAnswers: number = 0;
  wrongAnswers: number = 0;
  startTime: Date = new Date();
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aiQuizService: AiQuizService,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.topicId = this.route.snapshot.paramMap.get('topicId') || '';
    this.topicName = this.route.snapshot.queryParamMap.get('topicName') || '';
    
    console.log('Loading quiz for:', { courseId: this.courseId, topicName: this.topicName });
    this.loadQuiz();
  }

  loadQuiz(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Get all quizzes for the course and find the one for this topic
    this.aiQuizService.getAIQuizzesForCourse(this.courseId).subscribe({
      next: (response) => {
        console.log('Received quizzes:', response);
        
        if (response.success && response.quizzes && response.quizzes.length > 0) {
          // Find quiz matching the topic name
          const matchingQuiz = response.quizzes.find((q: Quiz) => q.topicName === this.topicName);
          
          if (matchingQuiz) {
            this.quiz = matchingQuiz;
            this.questions = matchingQuiz.questions || [];
            this.totalQuestions = this.questions.length;
            console.log(`✓ Loaded ${this.totalQuestions} questions for ${this.topicName}`);
          } else {
            this.errorMessage = `No AI quiz found for topic: ${this.topicName}`;
            console.error(this.errorMessage);
          }
        } else {
          this.errorMessage = 'No quizzes available for this course';
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load AI quiz:', err);
        this.errorMessage = 'Failed to load quiz. Please try again.';
        this.loading = false;
      }
    });
  }

  selectAnswer(question: QuizQuestion, optionIndex: number): void {
    if (!this.submitted) {
      question.selectedAnswer = optionIndex;
    }
  }

  submitQuiz(): void {
    const unanswered = this.questions.filter(q => q.selectedAnswer === undefined);
    if (unanswered.length > 0) {
      const confirmed = confirm(`You have ${unanswered.length} unanswered questions. Submit anyway?`);
      if (!confirmed) return;
    }

    // Calculate time taken in seconds
    const endTime = new Date();
    const timeTakenSeconds = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);

    // Calculate results
    this.submitted = true;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;

    this.questions.forEach(q => {
      if (q.selectedAnswer !== undefined && q.selectedAnswer === q.correctOption) {
        this.correctAnswers++;
      } else if (q.selectedAnswer !== undefined) {
        this.wrongAnswers++;
      }
    });

    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    
    console.log('Quiz submitted:', {
      correct: this.correctAnswers,
      wrong: this.wrongAnswers,
      score: this.score,
      timeTaken: timeTakenSeconds
    });

    // Save performance to backend
    this.savePerformance(timeTakenSeconds);
  }

  savePerformance(timeTakenSeconds: number): void {
    const studentEmail = this.authService.getEmail();
    if (!studentEmail) {
      console.error('No student email found');
      return;
    }

    const performanceData = {
      studentId: studentEmail,
      courseId: this.courseId,
      topicName: this.topicName,
      quizId: this.quiz?._id || '',
      totalQuestions: this.totalQuestions,
      correctAnswers: this.correctAnswers,
      wrongAnswers: this.wrongAnswers,
      timeTakenSeconds: timeTakenSeconds,
      scorePercent: this.score,
      details: this.questions.map(q => ({
        questionId: q.id,
        selectedAnswer: q.selectedAnswer !== undefined ? q.selectedAnswer.toString() : '',
        correctAnswer: q.correctOption.toString(),
        isCorrect: q.selectedAnswer === q.correctOption
      }))
    };

    // Save to AI quiz service
    this.aiQuizService.savePerformance(performanceData).subscribe({
      next: (response) => {
        console.log('✓ AI Quiz performance saved:', response);
        // Also track in main progress system for analytics
        this.trackInProgressSystem(timeTakenSeconds);
      },
      error: (err) => {
        console.error('Failed to save AI quiz performance:', err);
      }
    });
  }

  trackInProgressSystem(timeTakenSeconds: number): void {
    const studentEmail = this.authService.getEmail();
    if (!studentEmail) return;

    // Track AI quiz attempt in main progress system for analytics dashboard
    const progressPayload = {
      studentEmail: studentEmail,
      courseId: this.courseId,
      topicName: this.topicName,
      score: this.correctAnswers,
      totalQuestions: this.totalQuestions,
      timeSpentSeconds: timeTakenSeconds,
      difficulty: 'INTERMEDIATE',
      quizType: 'AI_GENERATED'
    };

    this.courseService.trackQuizAttempt(progressPayload).subscribe({
      next: (response) => {
        console.log('✓ AI Quiz tracked in progress system:', response);
        console.log('📊 Overall Score:', response.overallScore);
        console.log('🎯 Current Level:', response.currentLevel);
      },
      error: (err) => {
        console.error('❌ Failed to track AI quiz in progress:', err);
      }
    });
  }

  isCorrect(question: QuizQuestion): boolean {
    return question.selectedAnswer === question.correctOption;
  }

  goBack(): void {
    this.router.navigate(['/course-enrolled', this.courseId]);
  }

  retryQuiz(): void {
    this.submitted = false;
    this.questions.forEach(q => q.selectedAnswer = undefined);
    this.startTime = new Date();
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MCQService, MCQ, MCQValidationResult } from '../../services/mcq.service';
import { TopicService, Topic } from '../../services/topic.service';
import { AdaptiveLearningService, QuizAttemptRequest } from '../../services/adaptive-learning.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mcq-quiz',
  templateUrl: './mcq-quiz.component.html',
  styleUrls: ['./mcq-quiz.component.css']
})
export class MCQQuizComponent implements OnInit {
  topicId: string | null = null;
  topic: Topic | null = null;
  mcqs: MCQ[] = [];
  currentIndex = 0;
  selectedAnswers: number[] = [];
  
  loading = false;
  error: string | null = null;
  
  quizStarted = false;
  quizCompleted = false;
  validationResults: MCQValidationResult[] = [];
  totalScore = 0;
  maxScore = 0;
  
  // Adaptive Learning
  quizStartTime: number = 0;
  courseId: string = '';
  adaptiveRecommendation: any = null;

  constructor(
    private mcqService: MCQService,
    private topicService: TopicService,
    private route: ActivatedRoute,
    private router: Router,
    private adaptiveService: AdaptiveLearningService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('topicId');
    this.courseId = this.route.snapshot.queryParamMap.get('courseId') || '';
    
    if (this.topicId) {
      this.loadTopic();
      this.loadMCQs();
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  loadTopic(): void {
    if (!this.topicId) return;

    this.topicService.getTopicById(this.topicId).subscribe({
      next: (topic) => {
        this.topic = topic;
      },
      error: (err) => {
        this.error = 'Failed to load topic details';
        console.error('Error loading topic:', err);
      }
    });
  }

  loadMCQs(): void {
    if (!this.topicId) return;

    this.loading = true;
    this.error = null;

    this.mcqService.getMCQsByTopic(this.topicId).subscribe({
      next: (mcqs) => {
        this.mcqs = mcqs;
        this.selectedAnswers = new Array(mcqs.length).fill(-1);
        this.maxScore = mcqs.reduce((sum, mcq) => sum + (mcq.points || 1), 0);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load MCQs. Please try again.';
        this.loading = false;
        console.error('Error loading MCQs:', err);
      }
    });
  }

  startQuiz(): void {
    this.quizStarted = true;
    this.currentIndex = 0;
    this.quizStartTime = Date.now();
  }

  selectAnswer(optionIndex: number): void {
    this.selectedAnswers[this.currentIndex] = optionIndex;
  }

  nextQuestion(): void {
    if (this.currentIndex < this.mcqs.length - 1) {
      this.currentIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  goToQuestion(index: number): void {
    this.currentIndex = index;
  }

  submitQuiz(): void {
    if (this.selectedAnswers.some(answer => answer === -1)) {
      if (!confirm('You have unanswered questions. Do you want to submit anyway?')) {
        return;
      }
    }

    this.loading = true;
    this.error = null;

    // Validate all answers
    const validationPromises = this.mcqs.map((mcq, index) => {
      if (mcq.id && this.selectedAnswers[index] !== -1) {
        return this.mcqService.validateAnswer(mcq.id, this.selectedAnswers[index]).toPromise();
      }
      return Promise.resolve({ 
        isCorrect: false, 
        correctAnswerIndex: mcq.correctAnswerIndex, 
        points: 0,
        explanation: mcq.explanation 
      } as MCQValidationResult);
    });

    Promise.all(validationPromises).then((results) => {
      this.validationResults = results.filter(r => r !== undefined) as MCQValidationResult[];
      this.totalScore = this.validationResults.reduce((sum, result, index) => {
        return sum + (result.isCorrect ? (this.mcqs[index].points || 1) : 0);
      }, 0);
      this.quizCompleted = true;
      this.loading = false;
      
      // 🎯 ADAPTIVE LEARNING INTEGRATION
      this.recordAdaptiveAttempt();
    }).catch((err) => {
      this.error = 'Failed to submit quiz. Please try again.';
      this.loading = false;
      console.error('Error submitting quiz:', err);
    });
  }
  
  /**
   * Record quiz attempt in adaptive learning system
   */
  recordAdaptiveAttempt(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !this.courseId || !this.topic) {
      console.warn('Missing data for adaptive learning');
      return;
    }
    
    const timeSpent = Math.floor((Date.now() - this.quizStartTime) / 1000); // seconds
    const correctAnswers = this.validationResults.filter(r => r.isCorrect).length;
    
    // Determine current difficulty based on score
    let difficulty = 'BEGINNER';
    const percentage = this.percentage;
    if (percentage > 80) {
      difficulty = 'INTERMEDIATE';
    } else if (percentage > 90) {
      difficulty = 'ADVANCED';
    }
    
    const request: QuizAttemptRequest = {
      studentEmail: user.email,
      courseId: this.courseId,
      topicName: this.topic.name,
      score: correctAnswers,
      totalQuestions: this.mcqs.length,
      difficulty: difficulty,
      timeSpent: timeSpent
    };
    
    console.log('🎯 Recording adaptive attempt:', request);
    
    this.adaptiveService.recordQuizAttempt(request).subscribe({
      next: (response) => {
        console.log('✅ Adaptive learning updated:', response);
        if (response.recommendation) {
          this.adaptiveRecommendation = response.recommendation;
        }
      },
      error: (err) => {
        console.error('⚠️ Failed to record adaptive attempt:', err);
      }
    });
  }

  restartQuiz(): void {
    this.quizStarted = false;
    this.quizCompleted = false;
    this.currentIndex = 0;
    this.selectedAnswers = new Array(this.mcqs.length).fill(-1);
    this.validationResults = [];
    this.totalScore = 0;
  }

  exitQuiz(): void {
    this.router.navigate(['/topics', this.topicId]);
  }

  get currentMCQ(): MCQ {
    return this.mcqs[this.currentIndex];
  }

  get progress(): number {
    const answered = this.selectedAnswers.filter(a => a !== -1).length;
    return (answered / this.mcqs.length) * 100;
  }

  get percentage(): number {
    return (this.totalScore / this.maxScore) * 100;
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { AiQuizService, AIQuiz, QuizQuestion, GeneratedQuiz } from '../../../services/ai-quiz.service';

@Component({
  selector: 'app-ai-quiz-generator',
  templateUrl: './ai-quiz-generator.component.html',
  styleUrls: ['./ai-quiz-generator.component.css']
})
export class AiQuizGeneratorComponent implements OnInit {
  @Input() courseId: string = '';
  @Input() topicName: string = '';

  // Form data
  topic: string = '';
  numberOfQuestions: number = 10;
  apiKey: string = ''; // Optional API key override
  testTitle: string = '';
  testDescription: string = '';
  duration: number = 30; // minutes

  // State
  loading: boolean = false;
  generatedQuiz: GeneratedQuiz | null = null;
  editMode: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Saved quizzes
  savedQuizzes: AIQuiz[] = [];
  showSavedQuizzes: boolean = false;

  constructor(private aiQuizService: AiQuizService) {}

  ngOnInit() {
    // Pre-fill topic if provided
    if (this.topicName) {
      this.topic = this.topicName;
    }

    // Load saved quizzes if courseId is provided
    if (this.courseId) {
      this.loadSavedQuizzes();
    }
  }

  /**
   * Generate quiz using AI
   */
  generateQuiz() {
    if (!this.topic || this.topic.trim().length === 0) {
      this.errorMessage = 'Please enter a topic';
      return;
    }

    if (this.numberOfQuestions < 3 || this.numberOfQuestions > 50) {
      this.errorMessage = 'Number of questions must be between 3 and 50';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.generatedQuiz = null;

    console.log('🤖 Generating AI Quiz:', {
      topic: this.topic,
      questions: this.numberOfQuestions
    });

    this.aiQuizService.generateQuiz(
      this.topic,
      this.numberOfQuestions,
      this.apiKey || undefined
    ).subscribe({
      next: (response) => {
        console.log('✅ Quiz generated:', response);

        if (response.success) {
          this.generatedQuiz = response.quiz;
          this.editMode = true;
          this.successMessage = '✓ Quiz generated successfully! Review and edit before saving.';

          // Auto-fill title if empty
          if (!this.testTitle) {
            this.testTitle = `${this.topic} - Quiz`;
          }
        } else {
          this.errorMessage = response.error || 'Failed to generate quiz';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Quiz generation error:', error);
        this.errorMessage = error.error?.error || error.message || 'Failed to generate quiz. Please check your API key.';
        this.loading = false;
      }
    });
  }

  /**
   * Update question field
   */
  updateQuestion(index: number, field: string, value: any) {
    if (!this.generatedQuiz || !this.generatedQuiz.questions) return;
    (this.generatedQuiz.questions[index] as any)[field] = value;
  }

  /**
   * Update MCQ option
   */
  updateOption(questionIndex: number, optionIndex: number, value: string) {
    if (!this.generatedQuiz || !this.generatedQuiz.questions) return;
    const question = this.generatedQuiz.questions[questionIndex];
    if (question.options) {
      question.options[optionIndex] = value;
    }
  }

  /**
   * Save quiz to database
   */
  saveQuiz() {
    if (!this.generatedQuiz) return;

    if (!this.testTitle || this.testTitle.trim().length === 0) {
      this.errorMessage = 'Please enter a quiz title';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const quiz: AIQuiz = {
      courseId: this.courseId || 'default',
      topicName: this.topicName || this.topic,
      title: this.testTitle,
      description: this.testDescription,
      questions: this.generatedQuiz.questions,
      duration: this.duration,
      published: false
    };

    console.log('💾 Saving quiz:', quiz);

    this.aiQuizService.saveQuiz(quiz).subscribe({
      next: (response) => {
        console.log('✅ Quiz saved:', response);

        if (response.success) {
          this.successMessage = '✓ Quiz saved successfully!';
          this.resetForm();
          this.loadSavedQuizzes();

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.error || 'Failed to save quiz';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Save error:', error);
        this.errorMessage = error.error?.error || 'Failed to save quiz';
        this.loading = false;
      }
    });
  }

  /**
   * Load saved quizzes
   */
  loadSavedQuizzes() {
    if (!this.courseId) return;

    this.aiQuizService.getQuizzesByCourse(this.courseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.savedQuizzes = response.quizzes;
          console.log('📚 Loaded', this.savedQuizzes.length, 'quizzes');
        }
      },
      error: (error) => {
        console.error('Failed to load quizzes:', error);
      }
    });
  }

  /**
   * Delete quiz
   */
  deleteQuiz(quizId: string) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    this.aiQuizService.deleteQuiz(quizId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✓ Quiz deleted successfully';
          this.loadSavedQuizzes();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete quiz';
        console.error(error);
      }
    });
  }

  /**
   * Reset form
   */
  resetForm() {
    this.generatedQuiz = null;
    this.editMode = false;
    this.topic = this.topicName || '';
    this.testTitle = '';
    this.testDescription = '';
    this.numberOfQuestions = 10;
    this.duration = 30;
    this.apiKey = '';
  }

  /**
   * Discard quiz
   */
  discardQuiz() {
    if (confirm('Are you sure you want to discard this quiz?')) {
      this.resetForm();
    }
  }

  /**
   * Toggle saved quizzes view
   */
  toggleSavedQuizzes() {
    this.showSavedQuizzes = !this.showSavedQuizzes;
    if (this.showSavedQuizzes) {
      this.loadSavedQuizzes();
    }
  }
}

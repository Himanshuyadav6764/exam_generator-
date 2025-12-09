import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AdaptiveLearningService } from '../../../services/adaptive-learning.service';
import { AuthService } from '../../../services/auth.service';

interface PerformanceData {
  overallScore: number;
  totalTimeSpent: number;
  currentLevel: string;
  totalQuizzes: number;
  topicScores: { [key: string]: number };
  topicCompletion: { [key: string]: number };
  strengthWeakness: { [key: string]: string };
  quizAttempts?: any[]; // Optional: array of quiz attempt objects
}

interface QuizHistory {
  topic: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  timeSpent: number;
  date: string;
  percentage: number;
}

@Component({
  selector: 'app-course-overview',
  templateUrl: './course-overview.component.html',
  styleUrls: ['./course-overview.component.css']
})
export class CourseOverviewComponent implements OnInit {
  
  courseId: string = '';
  courseDetails: any = null;
  studentEmail: string = '';
  fullName: string = '';
  
  // Performance data
  performanceData: PerformanceData | null = null;
  recentQuizzes: QuizHistory[] = [];
  
  loading: boolean = true;
  error: string = '';
  
  // Stats
  totalAttempts: number = 0;
  averageScore: number = 0;
  completionStatus: number = 0;
  
  // Topic labels for charts
  topicLabels: string[] = [];
  topicScoreData: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private adaptiveService: AdaptiveLearningService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentEmail = user.email;
      this.fullName = user.fullName || user.email.split('@')[0];
    }
    
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    if (this.courseId) {
      this.loadCourseDetails();
      this.loadPerformanceData();
    }
  }

  loadCourseDetails(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Try to load course details from backend
    this.http.get<any>(`http://localhost:8081/api/courses/${this.courseId}`, { headers })
      .subscribe({
        next: (data) => {
          this.courseDetails = data;
          console.log('✅ Course details loaded:', data);
        },
        error: (err) => {
          console.error('Error loading course details:', err);
          // Try alternate endpoint
          this.http.get<any>(`http://localhost:8081/api/courses/${this.courseId}/details`, { headers })
            .subscribe({
              next: (data) => {
                this.courseDetails = data;
                console.log('✅ Course details loaded (alternate):', data);
              },
              error: (err2) => {
                console.error('Error loading course details (alternate):', err2);
                this.error = 'Failed to load course details';
                // Set dummy data so page still renders
                this.courseDetails = {
                  title: 'Course Details Loading...',
                  description: 'Please wait while we fetch the course information.',
                  instructorName: 'Instructor',
                  difficulty: 'BEGINNER',
                  topicCount: 0
                };
              }
            });
        }
      });
  }

  loadPerformanceData(): void {
    this.adaptiveService.getPerformance(this.studentEmail, this.courseId)
      .subscribe({
        next: (response: any) => {
          console.log('📊 Performance API Response:', response);
          
          // Unwrap the response - API returns { success: true, performance: {...} }
          const data = response.performance || response;
          
          this.performanceData = {
            overallScore: data.overallScore || 0,
            totalTimeSpent: data.totalTimeSpent || 0,
            currentLevel: data.currentDifficultyLevel || 'BEGINNER',
            totalQuizzes: data.quizAttempts?.length || 0,
            topicScores: data.topicScores || {},
            topicCompletion: data.completionPercentage || {},
            strengthWeakness: data.strengthWeakness || {},
            quizAttempts: data.quizAttempts || []
          };
          
          this.processPerformanceData(this.performanceData);
          this.loadQuizHistory();
        },
        error: (err: any) => {
          console.error('❌ Error loading performance:', err);
          // Show empty state if no performance yet
          this.showDemoData();
          this.loading = false;
        }
      });
  }

  processPerformanceData(data: PerformanceData): void {
    // Extract topic data for display
    if (data.topicScores) {
      this.topicLabels = Object.keys(data.topicScores);
      this.topicScoreData = Object.values(data.topicScores);
    }
    
    // Calculate completion status
    if (data.topicCompletion) {
      const completions = Object.values(data.topicCompletion);
      this.completionStatus = completions.length > 0
        ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length)
        : 0;
    }
  }

  loadQuizHistory(): void {
    // Extract quiz attempts from performance data
    if (this.performanceData && this.performanceData.quizAttempts) {
      const quizzes = this.performanceData.quizAttempts;
      this.recentQuizzes = quizzes.slice(-5).reverse().map((quiz: any) => ({
        topic: quiz.topicName || quiz.topic || 'General',
        score: quiz.score,
        totalQuestions: quiz.totalQuestions || 10,
        difficulty: quiz.difficultyLevel || quiz.difficulty || 'INTERMEDIATE',
        timeSpent: quiz.timeSpent || 0,
        date: quiz.attemptDate || quiz.date || new Date().toISOString(),
        percentage: Math.round((quiz.score / (quiz.totalQuestions || 10)) * 100)
      }));
      
      this.totalAttempts = quizzes.length;
      this.averageScore = quizzes.length > 0
        ? Math.round(quizzes.reduce((sum: number, q: any) => sum + Math.round((q.score / (q.totalQuestions || 10)) * 100), 0) / quizzes.length)
        : 0;
    } else {
      this.recentQuizzes = [];
      this.totalAttempts = 0;
      this.averageScore = 0;
    }
    
    this.loading = false;
  }

  showDemoData(): void {
    this.performanceData = {
      overallScore: 0,
      totalTimeSpent: 0,
      currentLevel: 'BEGINNER',
      totalQuizzes: 0,
      topicScores: {},
      topicCompletion: {},
      strengthWeakness: {}
    };
    
    this.recentQuizzes = [];
    this.totalAttempts = 0;
    this.averageScore = 0;
    this.completionStatus = 0;
  }

  startLearning(): void {
    this.router.navigate(['/course-enrolled', this.courseId]);
  }

  goBack(): void {
    this.router.navigate(['/student-dashboard'], { fragment: 'adaptive-learning' });
  }

  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      'BEGINNER': '#4ade80',
      'INTERMEDIATE': '#f59e0b',
      'ADVANCED': '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  }

  getStrengthColor(strength: string): string {
    return strength === 'STRONG' ? '#10b981' : strength === 'WEAK' ? '#ef4444' : '#f59e0b';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}

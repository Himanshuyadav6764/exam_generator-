import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdaptiveLearningService } from '../../../services/adaptive-learning.service';
import { AuthService } from '../../../services/auth.service';

interface PerformanceData {
  overallScore: number;
  totalTimeSpent: number;
  currentLevel: string;
  totalQuizzes: number;
  aiQuizAttempts: number;
  mcqAttempts: number;
  aiQuizAverage: number;
  mcqAverage: number;
  topicScores: { [key: string]: number };
  topicCompletion: { [key: string]: number };
  avgCompletion: number;
  strengthWeakness: { [key: string]: string };
  quizAttempts?: any[];
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
  
  // Performance tracking data
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
    this.http.get<any>(`${environment.apiUrl}/courses/${this.courseId}`, { headers })
      .subscribe({
        next: (data) => {
          this.courseDetails = data;
          console.log('✅ Course details loaded:', data);
        },
        error: (err) => {
          console.error('Error loading course details:', err);
          // Try alternate endpoint
          this.http.get<any>(`${environment.apiUrl}/courses/${this.courseId}/details`, { headers })
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
    console.log('🔍 Loading performance data for:', this.studentEmail, this.courseId);
    
    this.adaptiveService.getPerformance(this.studentEmail, this.courseId)
      .subscribe({
        next: (response: any) => {
          console.log('📊 Performance API Response:', response);
          
          const data = response.performance || response;
          console.log('📈 Raw Performance Data:', data);
          
          // Convert time from seconds to minutes
          const timeInMinutes = Math.round((data.totalTimeSpent || 0) / 60);
          
          this.performanceData = {
            overallScore: Math.round(data.overallScore || 0),
            totalTimeSpent: timeInMinutes,
            currentLevel: this.formatDifficultyLevel(data.currentDifficultyLevel || 'BEGINNER'),
            totalQuizzes: data.totalAttempts || 0,
            aiQuizAttempts: data.aiQuizAttempts || 0,
            mcqAttempts: data.mcqAttempts || 0,
            aiQuizAverage: Math.round(data.aiQuizAverage || 0),
            mcqAverage: Math.round(data.mcqAverage || 0),
            topicScores: data.topicScores || {},
            topicCompletion: data.completionPercentage || {},
            avgCompletion: Math.round(data.avgCompletion || 0),
            strengthWeakness: data.strengthWeakness || {},
            quizAttempts: data.quizAttempts || []
          };
          
          console.log('✅ Processed Performance Data:');
          console.log('  - Overall Score:', this.performanceData.overallScore + '%');
          console.log('  - Total Time:', this.performanceData.totalTimeSpent + ' minutes');
          console.log('  - Total Quizzes:', this.performanceData.totalQuizzes);
          console.log('  - AI Quizzes:', this.performanceData.aiQuizAttempts);
          console.log('  - MCQ Quizzes:', this.performanceData.mcqAttempts);
          console.log('  - AI Avg:', this.performanceData.aiQuizAverage + '%');
          console.log('  - MCQ Avg:', this.performanceData.mcqAverage + '%');
          
          this.processPerformanceData(this.performanceData);
          this.loadQuizHistory();
        },
        error: (err: any) => {
          console.error('❌ Error loading performance:', err);
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
      currentLevel: 'Beginner',
      totalQuizzes: 0,
      aiQuizAttempts: 0,
      mcqAttempts: 0,
      aiQuizAverage: 0,
      mcqAverage: 0,
      topicScores: {},
      topicCompletion: {},
      avgCompletion: 0,
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
    if (minutes === 0) {
      return '0m';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatDifficultyLevel(level: string): string {
    if (!level) return 'Beginner';
    const levelMap: { [key: string]: string } = {
      'BEGINNER': 'Beginner',
      'INTERMEDIATE': 'Intermediate',
      'ADVANCED': 'Advanced'
    };
    return levelMap[level.toUpperCase()] || level;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface StudentProgress {
  id?: string;
  studentEmail: string;
  courseId: string;
  courseName?: string;
  currentLevel: string;
  overallScore: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  totalTimeSpentMinutes: number;
  currentStreak: number;
  lastActivityDate?: Date;
  topicMastery?: { [key: string]: TopicMastery };
  overallPerformance?: OverallPerformance;
  lessonProgressList?: LessonProgress[];
  quizAttempts?: QuizAttempt[];
  recentActivities?: ActivityLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TopicMastery {
  totalAttempts: number;
  correctAnswers: number;
  averageScore: number;
  timeSpent: number;
  lastAttemptDate?: Date;
  difficulty: string;
  trend: string;
  weakAreas: string[];
}

export interface OverallPerformance {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  performanceLevel: string;
  lastActivityDate?: Date;
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  timeSpentMinutes: number;
  completedAt?: Date;
}

export interface QuizAttempt {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  attemptedAt?: Date;
  passed: boolean;
}

export interface ActivityLog {
  activityType: string;
  activityTitle: string;
  description: string;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StudentProgressService {
  private apiUrl = `${environment.apiUrl}/progress`;
  
  // Observable for real-time progress updates
  private progressSubject = new BehaviorSubject<StudentProgress | null>(null);
  public progress$ = this.progressSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get progress for a specific course
  getProgress(email: string, courseId: string): Observable<StudentProgress> {
    return this.http.get<StudentProgress>(
      `${this.apiUrl}/student/${email}/course/${courseId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(progress => {
        this.progressSubject.next(progress);
      })
    );
  }

  // Get all progress for a student
  getAllProgress(email: string): Observable<StudentProgress[]> {
    return this.http.get<StudentProgress[]>(
      `${this.apiUrl}/student/${email}`,
      { headers: this.getHeaders() }
    );
  }

  // Record video watch time
  recordVideoWatch(
    studentEmail: string,
    courseId: string,
    topicName: string,
    timeSpentSeconds: number,
    videoTitle: string
  ): Observable<StudentProgress> {
    const payload = {
      studentEmail,
      courseId,
      topicName,
      timeSpentSeconds,
      videoTitle
    };

    return this.http.post<StudentProgress>(
      `${this.apiUrl}/video-watch`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(progress => {
        this.progressSubject.next(progress);
      })
    );
  }

  // Record PDF view time
  recordPdfView(
    studentEmail: string,
    courseId: string,
    topicName: string,
    timeSpentSeconds: number,
    pdfTitle: string
  ): Observable<StudentProgress> {
    const payload = {
      studentEmail,
      courseId,
      topicName,
      timeSpentSeconds,
      pdfTitle
    };

    return this.http.post<StudentProgress>(
      `${this.apiUrl}/pdf-view`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(progress => {
        this.progressSubject.next(progress);
      })
    );
  }

  // Record quiz attempt
  recordQuizAttempt(
    studentEmail: string,
    courseId: string,
    topicName: string,
    score: number,
    totalQuestions: number,
    timeSpentSeconds: number,
    difficulty: string = 'MEDIUM'
  ): Observable<StudentProgress> {
    const payload = {
      studentEmail,
      courseId,
      topicName,
      score,
      totalQuestions,
      timeSpentSeconds,
      difficulty
    };

    return this.http.post<StudentProgress>(
      `${this.apiUrl}/quiz-attempt`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(progress => {
        this.progressSubject.next(progress);
      })
    );
  }

  // Mark lesson as complete
  markLessonComplete(
    studentEmail: string,
    courseId: string,
    lessonId: string,
    lessonTitle: string,
    timeSpentMinutes: number = 0
  ): Observable<StudentProgress> {
    const payload = {
      studentEmail,
      courseId,
      lessonId,
      lessonTitle,
      timeSpentMinutes
    };

    console.log('✓ Marking lesson complete:', lessonTitle);

    return this.http.post<StudentProgress>(
      `${this.apiUrl}/lesson-complete`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(progress => {
        this.progressSubject.next(progress);
      })
    );
  }

  // Format time spent for display
  formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  // Get level color
  getLevelColor(level: string): string {
    switch (level.toUpperCase()) {
      case 'MASTERY':
        return '#9333ea'; // Purple
      case 'ADVANCED':
        return '#3b82f6'; // Blue
      case 'INTERMEDIATE':
        return '#10b981'; // Green
      case 'BEGINNER':
      default:
        return '#6b7280'; // Gray
    }
  }

  // Get performance color
  getPerformanceColor(performanceLevel: string): string {
    switch (performanceLevel) {
      case 'EXCELLENT':
        return '#10b981'; // Green
      case 'GOOD':
        return '#3b82f6'; // Blue
      case 'AVERAGE':
        return '#f59e0b'; // Yellow
      case 'NEEDS_IMPROVEMENT':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuizAttemptRequest {
  studentEmail: string;
  courseId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  timeSpent: number;
  quizId?: string; // Optional: "AI_QUIZ" for AI-generated quizzes
}

export interface CompletionUpdateRequest {
  studentEmail: string;
  courseId: string;
  topicName: string;
  percentage: number;
}

export interface StudentPerformance {
  id: string;
  studentEmail: string;
  courseId: string;
  topicName: string;
  quizAttempts: QuizAttempt[];
  topicScores: { [key: string]: number };
  topicDifficultyLevels: { [key: string]: string };
  timeSpentPerTopic: { [key: string]: number };
  completionPercentage: { [key: string]: number };
  currentDifficultyLevel: string;
  consecutiveHighScores: number;
  consecutiveLowScores: number;
  recommendedTopic: string;
  recommendedDifficulty: string;
  recommendationReason: string;
  createdAt: string;
  updatedAt: string;
  lastQuizDate: string;
}

export interface QuizAttempt {
  quizId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  difficultyLevel: string;
  timeSpent: number;
  attemptDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdaptiveLearningService {
  
  private apiUrl = `${environment.apiUrl}/adaptive`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Record a quiz attempt and get adaptive feedback
   */
  recordQuizAttempt(request: QuizAttemptRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/quiz-attempt`, request, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Update completion percentage for a topic
   */
  updateCompletion(request: CompletionUpdateRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/completion`, request, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Get student performance for a specific course
   */
  getPerformance(studentEmail: string, courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance`, { 
      params: { studentEmail, courseId },
      headers: this.getHeaders() 
    });
  }

  /**
   * Get all performance records for a student
   */
  getStudentPerformance(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/student/${email}`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Get overall progress and analytics
   */
  getOverallProgress(studentEmail: string, courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/progress`, { 
      params: { studentEmail, courseId },
      headers: this.getHeaders() 
    });
  }

  /**
   * Get all courses progress for student (all published courses)
   */
  getAllCoursesProgress(studentEmail: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/overall-progress`, { 
      params: { studentEmail },
      headers: this.getHeaders() 
    });
  }

  /**
   * Reset performance (for testing)
   */
  resetPerformance(studentEmail: string, courseId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reset`, { 
      params: { studentEmail, courseId },
      headers: this.getHeaders() 
    });
  }
}

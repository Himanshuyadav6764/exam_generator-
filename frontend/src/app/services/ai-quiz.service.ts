import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctOption?: number;
  correctAnswer?: boolean;
  shortAnswer?: string;
  keywords?: string[];
  explanation?: string;
  marks: number;
}

export interface AIQuiz {
  id?: string;
  courseId: string;
  topicName: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  totalQuestions?: number;
  duration?: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  published?: boolean;
}

export interface GeneratedQuiz {
  topic: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}

@Injectable({
  providedIn: 'root'
})
export class AiQuizService {
  // Use the main Spring Boot API (port 8081) with the correct ai-quiz path
  private apiUrl = 'http://localhost:8081/api/ai-quiz';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Generate quiz using AI
   */
  generateQuiz(topic: string, numberOfQuestions: number, apiKey?: string): Observable<any> {
    const payload: any = {
      topic,
      numberOfQuestions
    };

    if (apiKey) {
      payload.apiKey = apiKey;
    }

    return this.http.post(`${this.apiUrl}/generate`, payload, {
      headers: this.getHeaders()
    });
  }

  /**
   * Save quiz to database
   */
  saveQuiz(quiz: AIQuiz): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, quiz, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get quizzes for a course
   */
  getQuizzesByCourse(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/course/${courseId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get quiz by ID
   */
  getQuizById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update quiz
   */
  updateQuiz(id: string, quiz: AIQuiz): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, quiz, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete quiz
   */
  deleteQuiz(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get instructor's quizzes
   */
  getMyQuizzes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-quizzes`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get AI quizzes for a topic (from new ai-quiz-service backend on port 4000)
   */
  getAIQuizzesForTopic(topicId: string): Observable<{ ok: boolean; count: number; quizzes: any[] }> {
    return this.http.get<any>(`http://localhost:4000/api/student/aiquiz/${topicId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get AI quiz tests for a course (returns all saved AI quizzes for the course)
   */
  getAIQuizzesForCourse(courseId: string): Observable<{ success: boolean; count: number; quizzes: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/course/${courseId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Submit quiz and save performance
   */
  submitQuiz(topicId: string, submission: { studentId: string; answers: any[]; timeTakenSeconds: number }): Observable<any> {
    return this.http.post<any>(`http://localhost:4000/api/student/aiquiz/${topicId}/submit`, submission, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get topic performance for student
   */
  getTopicPerformance(studentId: string, topicId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:4000/api/student/performance/${studentId}/topic/${topicId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Save AI quiz performance
   */
  savePerformance(performanceData: any): Observable<any> {
    return this.http.post<any>(`http://localhost:4000/api/student/performance/ai-quiz`, performanceData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get student performance for a course (both AI and normal quizzes)
   */
  getCoursePerformance(studentId: string, courseId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:4000/api/student/performance/${studentId}/course/${courseId}`, {
      headers: this.getHeaders()
    });
  }
}


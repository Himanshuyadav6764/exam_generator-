import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MCQ {
  id?: string;
  courseId?: string;
  topicId: string;
  subjectId?: string;
  topicName?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  points?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkMCQRequest {
  topicId: string;
  mcqs: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
    points?: number;
  }[];
}

export interface MCQStats {
  totalMCQs: number;
}

export interface MCQValidationResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  points: number;
  explanation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MCQService {
  private apiUrl = `${environment.apiUrl}/mcqs`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * POST /api/mcqs/create
   * Create a new MCQ
   */
  createMCQ(mcq: MCQ): Observable<MCQ> {
    return this.http.post<MCQ>(`${this.apiUrl}/create`, mcq, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/mcqs/bulk-create
   * Create multiple MCQs at once
   */
  bulkCreateMCQs(request: BulkMCQRequest): Observable<MCQ[]> {
    return this.http.post<MCQ[]>(`${this.apiUrl}/bulk-create`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/mcqs/all
   * Get all MCQs
   */
  getAllMCQs(): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/all`, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/mcqs/{id}
   * Get MCQ by ID
   */
  getMCQById(id: string): Observable<MCQ> {
    return this.http.get<MCQ>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/mcqs/course/{courseId}
   * Get all MCQs for a course
   */
  getMCQsByCourse(courseId: string): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/course/${courseId}`, { headers: this.getHeaders() });
  }

  /**
   * GET /api/mcqs/topic/{topicId}
   * Get all MCQs for a topic
   */
  getMCQsByTopic(topicId: string): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/topic/${topicId}`);
  }

  /**
   * GET /api/mcqs/topic/{topicId}/difficulty/{level}
   * Get MCQs by topic and difficulty
   */
  getMCQsByTopicAndDifficulty(
    topicId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/topic/${topicId}/difficulty/${level}`);
  }

  /**
   * GET /api/mcqs/subject/{subjectId}
   * Get all MCQs for a subject
   */
  getMCQsBySubject(subjectId: string): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * GET /api/mcqs/subject/{subjectId}/difficulty/{level}
   * Get MCQs by subject and difficulty
   */
  getMCQsBySubjectAndDifficulty(
    subjectId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/subject/${subjectId}/difficulty/${level}`);
  }

  /**
   * GET /api/mcqs/difficulty/{level}
   * Get MCQs by difficulty level
   */
  getMCQsByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<MCQ[]> {
    return this.http.get<MCQ[]>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * PUT /api/mcqs/{id}
   * Update MCQ
   */
  updateMCQ(id: string, mcq: MCQ): Observable<MCQ> {
    return this.http.put<MCQ>(`${this.apiUrl}/${id}`, mcq, {
      headers: this.getHeaders()
    });
  }

  /**
   * DELETE /api/mcqs/{id}
   * Delete MCQ
   */
  deleteMCQ(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    });
  }

  /**
   * GET /api/mcqs/topic/{topicId}/stats
   * Get MCQ statistics for a topic
   */
  getTopicMCQStats(topicId: string): Observable<MCQStats> {
    return this.http.get<MCQStats>(`${this.apiUrl}/topic/${topicId}/stats`);
  }

  /**
   * POST /api/mcqs/{id}/validate-answer
   * Validate student's answer
   */
  validateAnswer(id: string, selectedIndex: number): Observable<MCQValidationResult> {
    return this.http.post<MCQValidationResult>(
      `${this.apiUrl}/${id}/validate-answer?selectedIndex=${selectedIndex}`,
      null
    );
  }
}

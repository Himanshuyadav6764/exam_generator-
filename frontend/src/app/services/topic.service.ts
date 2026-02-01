import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Topic {
  id?: string;
  subjectId: string;
  name: string;
  description?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  orderIndex?: number;
  estimatedHours?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkTopicRequest {
  subjectId: string;
  topicNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private apiUrl = `${environment.apiUrl}/topics`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * POST /api/topics/create
   * Create a new topic
   */
  createTopic(topic: Topic): Observable<Topic> {
    return this.http.post<Topic>(`${this.apiUrl}/create`, topic, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/topics/bulk-create
   * Create multiple topics at once
   */
  bulkCreateTopics(request: BulkTopicRequest): Observable<Topic[]> {
    return this.http.post<Topic[]>(`${this.apiUrl}/bulk-create`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/topics/all
   * Get all topics
   */
  getAllTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/all`);
  }

  /**
   * GET /api/topics/{id}
   * Get topic by ID
   */
  getTopicById(id: string): Observable<Topic> {
    return this.http.get<Topic>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/topics/subject/{subjectId}
   * Get all topics for a subject (ordered)
   */
  getTopicsBySubject(subjectId: string): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * GET /api/topics/subject/{subjectId}/difficulty/{level}
   * Get topics by subject and difficulty
   */
  getTopicsBySubjectAndDifficulty(
    subjectId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/subject/${subjectId}/difficulty/${level}`);
  }

  /**
   * GET /api/topics/difficulty/{level}
   * Get all topics by difficulty level
   */
  getTopicsByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * PUT /api/topics/{id}
   * Update topic
   */
  updateTopic(id: string, topic: Topic): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/${id}`, topic, {
      headers: this.getHeaders()
    });
  }

  /**
   * PATCH /api/topics/{id}/reorder
   * Update topic order index
   */
  reorderTopic(id: string, newOrderIndex: number): Observable<Topic> {
    return this.http.patch<Topic>(
      `${this.apiUrl}/${id}/reorder?newOrderIndex=${newOrderIndex}`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/topics/{id}
   * Delete topic
   */
  deleteTopic(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    });
  }
}

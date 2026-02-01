import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContentRecommendation {
  topicId: string;
  topicName: string;
  averageScore: number;
  attempts: number;
  priority: string;
  suggestion: string;
  videosAvailable: number;
  pdfsAvailable: number;
  mcqsAvailable: number;
  recommendedAction: string;
  recommendedContentType: string;
}

export interface RecommendationResponse {
  overallScore: number;
  totalAttempts: number;
  recommendations: ContentRecommendation[];
  weakTopics: Array<{name: string; score: number; attempts: number}>;
  strongTopics: Array<{name: string; score: number; attempts: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = `${environment.apiUrl}/recommendations`;
  private studentApiUrl = `${environment.apiUrl}/student`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRecommendations(email: string): Observable<RecommendationResponse> {
    return this.http.get<RecommendationResponse>(
      `${this.apiUrl}/student/${email}`,
      { headers: this.getHeaders() }
    );
  }

  // Add course to recommendations
  addCourseToRecommendations(email: string, courseId: string): Observable<any> {
    return this.http.post(
      `${this.studentApiUrl}/${email}/recommendations/add`,
      { courseId },
      { headers: this.getHeaders() }
    );
  }

  // Get recommended courses for student
  getRecommendedCourses(email: string): Observable<any> {
    return this.http.get(
      `${this.studentApiUrl}/${email}/recommendations`,
      { headers: this.getHeaders() }
    );
  }

  // Remove course from recommendations
  removeRecommendation(email: string, courseId: string): Observable<any> {
    return this.http.delete(
      `${this.studentApiUrl}/${email}/recommendations/${courseId}`,
      { headers: this.getHeaders() }
    );
  }
}

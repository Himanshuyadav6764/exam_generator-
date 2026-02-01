import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subject {
  id?: string;
  title: string;
  description?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructorEmail?: string;
  instructorName?: string;
  thumbnail?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectStats {
  totalTopics: number;
  totalVideos: number;
  totalPDFs: number;
  totalMCQs: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = `${environment.apiUrl}/subjects`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * POST /api/subjects/create
   * Create a new subject
   */
  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/create`, subject, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/subjects/create-with-thumbnail
   * Create subject with thumbnail upload
   */
  createSubjectWithThumbnail(subjectData: FormData): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/create-with-thumbnail`, subjectData, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/subjects/all
   * Get all subjects
   */
  getAllSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/all`);
  }

  /**
   * GET /api/subjects/{id}
   * Get subject by ID
   */
  getSubjectById(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/subjects/difficulty/{level}
   * Get subjects by difficulty level
   */
  getSubjectsByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * GET /api/subjects/instructor/{email}
   * Get subjects by instructor email
   */
  getSubjectsByInstructor(email: string): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/instructor/${email}`);
  }

  /**
   * GET /api/subjects/status/{status}
   * Get subjects by status (DRAFT or PUBLISHED)
   */
  getSubjectsByStatus(status: 'DRAFT' | 'PUBLISHED'): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * PUT /api/subjects/{id}
   * Update subject
   */
  updateSubject(id: string, subject: Subject): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${id}`, subject, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/subjects/{id}/upload-thumbnail
   * Upload thumbnail for existing subject
   */
  uploadThumbnail(id: string, file: File): Observable<Subject> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<Subject>(`${this.apiUrl}/${id}/upload-thumbnail`, formData, {
      headers: this.getHeaders()
    });
  }

  /**
   * PATCH /api/subjects/{id}/publish
   * Publish or unpublish subject
   */
  publishSubject(id: string, publish: boolean): Observable<Subject> {
    return this.http.patch<Subject>(
      `${this.apiUrl}/${id}/publish?publish=${publish}`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/subjects/{id}
   * Delete subject (cascade deletes topics)
   */
  deleteSubject(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    });
  }

  /**
   * GET /api/subjects/{id}/stats
   * Get statistics for a subject
   */
  getSubjectStats(id: string): Observable<SubjectStats> {
    return this.http.get<SubjectStats>(`${this.apiUrl}/${id}/stats`);
  }

  /**
   * GET /api/subjects/instructor/{email}/count
   * Get count of subjects by instructor
   */
  getInstructorSubjectCount(email: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/instructor/${email}/count`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = `${environment.apiUrl}/enrollment`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  enrollStudent(enrollment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enroll`, enrollment, { headers: this.getHeaders() });
  }

  getUserEnrollments(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, { headers: this.getHeaders() });
  }

  getCourseEnrollments(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/course/${courseId}`, { headers: this.getHeaders() });
  }

  updateProgress(id: string, progressData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/progress`, progressData, { headers: this.getHeaders() });
  }

  unenroll(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/unenroll/${id}`, { headers: this.getHeaders() });
  }
}

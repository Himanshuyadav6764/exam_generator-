import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:8081/api/courses';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  private getHeadersForMultipart(): HttpHeaders {
    const token = localStorage.getItem('token');
    // Don't set Content-Type for multipart/form-data - browser will set it with boundary
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  createCourse(course: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, course, { headers: this.getHeaders() });
  }
  
  createCourseWithFiles(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-with-files`, formData, { 
      headers: this.getHeadersForMultipart(),
      reportProgress: true
    });
  }
  
  /**
   * 🚀 NEW: Atomic course creation with synchronous uploads
   * Use this instead of createCourseWithFiles for guaranteed data persistence
   */
  createCourseAtomic(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-atomic`, formData, { 
      headers: this.getHeadersForMultipart(),
      reportProgress: true,
      observe: 'events'  // Get progress events for loading indicator
    });
  }

  updateCourseWithFiles(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-with-files/${id}`, formData, { 
      headers: this.getHeadersForMultipart(),
      reportProgress: true
    });
  }

  getAllCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`, { headers: this.getHeaders() });
  }

  getPublishedCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/published`, { headers: this.getHeaders() });
  }

  getCourseById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getCoursesByInstructor(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructor/${email}`, { headers: this.getHeaders() });
  }

  updateCourse(id: string, course: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, course, { headers: this.getHeaders() });
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  publishCourse(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/publish`, {}, { headers: this.getHeaders() });
  }

  searchCourses(subject: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?subject=${subject}`);
  }

  getMcqByCourseTopic(courseId: string, topicName: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8081/api/mcq/course/${courseId}/topic/${topicName}`, { 
      headers: this.getHeaders() 
    });
  }

  // Progress tracking methods
  trackVideoWatch(payload: any): Observable<any> {
    return this.http.post('http://localhost:8081/api/progress/video-watch', payload, { 
      headers: this.getHeaders() 
    });
  }

  trackPdfView(payload: any): Observable<any> {
    return this.http.post('http://localhost:8081/api/progress/pdf-view', payload, { 
      headers: this.getHeaders() 
    });
  }

  saveSubtopicProgress(payload: any): Observable<any> {
    return this.http.post('http://localhost:8081/api/progress/subcontent-complete', payload, { 
      headers: this.getHeaders() 
    });
  }

  trackQuizAttempt(payload: any): Observable<any> {
    return this.http.post('http://localhost:8081/api/progress/quiz-attempt', payload, { 
      headers: this.getHeaders() 
    });
  }

  getStudentProgress(email: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8081/api/progress/student/${email}`, { 
      headers: this.getHeaders() 
    });
  }
}

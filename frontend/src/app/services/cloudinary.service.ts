import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Generic upload method
  uploadFile(file: File, folder: string = 'uploads'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // Determine endpoint based on file type
    let endpoint = 'files/upload/file';
    if (file.type.startsWith('video/')) {
      endpoint = 'files/upload/video';
    } else if (file.type === 'application/pdf') {
      endpoint = 'files/upload/pdf';
    } else if (file.type.startsWith('image/')) {
      endpoint = 'files/upload/thumbnail';
    }
    
    return this.http.post(`${this.baseUrl}/${endpoint}`, formData, {
      headers: this.getHeaders()
    });
  }

  uploadVideo(file: File, folder: string = 'videos'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post(`${this.baseUrl}/files/upload/video`, formData, {
      headers: this.getHeaders()
    });
  }

  uploadPdf(file: File, folder: string = 'pdfs'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post(`${this.baseUrl}/files/upload/pdf`, formData, {
      headers: this.getHeaders()
    });
  }

  uploadImage(file: File, folder: string = 'thumbnails'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post(`${this.baseUrl}/files/upload/thumbnail`, formData, {
      headers: this.getHeaders()
    });
  }
}

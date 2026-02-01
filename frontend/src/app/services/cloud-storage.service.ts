import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FileUploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
}

export interface MultipleFileUploadResponse {
  success: boolean;
  uploadedFiles: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    contentType: string;
  }>;
  uploadedCount: number;
  failedCount: number;
  errors?: string[];
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudStorageService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) { }

  /**
   * Upload thumbnail image with progress tracking
   * @param file Image file
   * @returns Observable with upload progress and response
   */
  uploadThumbnail(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/upload/thumbnail`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getEventMessage(event))
    );
  }

  /**
   * Upload single video with progress tracking
   * @param file Video file
   * @returns Observable with upload progress and response
   */
  uploadVideo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/upload/video`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getEventMessage(event))
    );
  }

  /**
   * Upload multiple videos with progress tracking
   * @param files Array of video files
   * @returns Observable with upload progress and response
   */
  uploadMultipleVideos(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const req = new HttpRequest('POST', `${this.apiUrl}/upload/videos`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getEventMessage(event))
    );
  }

  /**
   * Upload PDF document with progress tracking
   * @param file PDF file
   * @returns Observable with upload progress and response
   */
  uploadPdf(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/upload/pdf`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getEventMessage(event))
    );
  }

  /**
   * Delete file from cloud storage
   * @param fileUrl URL of the file to delete
   * @returns Observable with delete response
   */
  deleteFile(fileUrl: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete`, {
      params: { url: fileUrl }
    });
  }

  /**
   * Convert HTTP event to upload progress object
   * @param event HTTP event
   * @returns Upload progress information
   */
  private getEventMessage(event: HttpEvent<any>): UploadProgress {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
        return {
          progress: progress,
          status: 'uploading',
          message: `Uploading... ${progress}%`
        };

      case HttpEventType.Response:
        return {
          progress: 100,
          status: 'completed',
          message: 'Upload completed',
          ...event.body
        };

      default:
        return {
          progress: 0,
          status: 'uploading',
          message: 'Preparing upload...'
        };
    }
  }

  /**
   * Validate file type for thumbnails
   * @param file File to validate
   * @returns True if valid image file
   */
  isValidThumbnail(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
  }

  /**
   * Validate file type for videos
   * @param file File to validate
   * @returns True if valid video file
   */
  isValidVideo(file: File): boolean {
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    return validTypes.includes(file.type);
  }

  /**
   * Validate file type for PDFs
   * @param file File to validate
   * @returns True if valid PDF file
   */
  isValidPdf(file: File): boolean {
    return file.type === 'application/pdf';
  }

  /**
   * Format file size for display
   * @param bytes File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

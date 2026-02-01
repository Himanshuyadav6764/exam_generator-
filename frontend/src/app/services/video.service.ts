import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Video {
  id?: string;
  topicId: string;
  subjectId?: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  isPreview?: boolean;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoStats {
  totalVideos: number;
  previewVideos: number;
  lockedVideos: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = `${environment.apiUrl}/videos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * POST /api/videos/create
   * Create video without file upload (URL provided)
   */
  createVideo(video: Video): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/create`, video, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/videos/upload
   * Upload video file to Cloudinary and create video record
   */
  uploadVideo(
    file: File,
    topicId: string,
    title: string,
    description?: string,
    duration?: number,
    isPreview: boolean = false
  ): Observable<Video> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (duration) formData.append('duration', duration.toString());
    formData.append('isPreview', isPreview.toString());

    return this.http.post<Video>(`${this.apiUrl}/upload`, formData, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/videos/{id}/upload-thumbnail
   * Upload thumbnail for existing video
   */
  uploadThumbnail(id: string, file: File): Observable<Video> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Video>(`${this.apiUrl}/${id}/upload-thumbnail`, formData, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/videos/all
   * Get all videos
   */
  getAllVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/all`);
  }

  /**
   * GET /api/videos/{id}
   * Get video by ID
   */
  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/videos/topic/{topicId}
   * Get all videos for a topic (ordered)
   */
  getVideosByTopic(topicId: string): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/topic/${topicId}`);
  }

  /**
   * GET /api/videos/topic/{topicId}/difficulty/{level}
   * Get videos by topic and difficulty
   */
  getVideosByTopicAndDifficulty(
    topicId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/topic/${topicId}/difficulty/${level}`);
  }

  /**
   * GET /api/videos/subject/{subjectId}
   * Get all videos for a subject
   */
  getVideosBySubject(subjectId: string): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * GET /api/videos/subject/{subjectId}/difficulty/{level}
   * Get videos by subject and difficulty
   */
  getVideosBySubjectAndDifficulty(
    subjectId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/subject/${subjectId}/difficulty/${level}`);
  }

  /**
   * GET /api/videos/preview
   * Get all preview videos (free access)
   */
  getPreviewVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/preview`);
  }

  /**
   * GET /api/videos/difficulty/{level}
   * Get videos by difficulty level
   */
  getVideosByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * PUT /api/videos/{id}
   * Update video
   */
  updateVideo(id: string, video: Video): Observable<Video> {
    return this.http.put<Video>(`${this.apiUrl}/${id}`, video, {
      headers: this.getHeaders()
    });
  }

  /**
   * PATCH /api/videos/{id}/preview
   * Toggle preview status
   */
  togglePreview(id: string, isPreview: boolean): Observable<Video> {
    return this.http.patch<Video>(
      `${this.apiUrl}/${id}/preview?isPreview=${isPreview}`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/videos/{id}
   * Delete video
   */
  deleteVideo(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    });
  }

  /**
   * GET /api/videos/topic/{topicId}/stats
   * Get video statistics for a topic
   */
  getTopicVideoStats(topicId: string): Observable<VideoStats> {
    return this.http.get<VideoStats>(`${this.apiUrl}/topic/${topicId}/stats`);
  }
}

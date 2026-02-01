import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PDF {
  id?: string;
  topicId: string;
  subjectId?: string;
  title: string;
  description?: string;
  url: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  fileSize?: number;
  pages?: number;
  isDownloadable?: boolean;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PDFStats {
  totalPDFs: number;
  downloadablePDFs: number;
  lockedPDFs: number;
}

@Injectable({
  providedIn: 'root'
})
export class PDFService {
  private apiUrl = `${environment.apiUrl}/pdfs`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * POST /api/pdfs/create
   * Create PDF without file upload (URL provided)
   */
  createPDF(pdf: PDF): Observable<PDF> {
    return this.http.post<PDF>(`${this.apiUrl}/create`, pdf, {
      headers: this.getHeaders()
    });
  }

  /**
   * POST /api/pdfs/upload
   * Upload PDF file to Cloudinary and create PDF record
   */
  uploadPDF(
    file: File,
    topicId: string,
    title: string,
    description?: string,
    pages?: number,
    isDownloadable: boolean = false
  ): Observable<PDF> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (pages) formData.append('pages', pages.toString());
    formData.append('isDownloadable', isDownloadable.toString());

    return this.http.post<PDF>(`${this.apiUrl}/upload`, formData, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/pdfs/all
   * Get all PDFs
   */
  getAllPDFs(): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/all`);
  }

  /**
   * GET /api/pdfs/{id}
   * Get PDF by ID
   */
  getPDFById(id: string): Observable<PDF> {
    return this.http.get<PDF>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/pdfs/topic/{topicId}
   * Get all PDFs for a topic (ordered)
   */
  getPDFsByTopic(topicId: string): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/topic/${topicId}`);
  }

  /**
   * GET /api/pdfs/topic/{topicId}/difficulty/{level}
   * Get PDFs by topic and difficulty
   */
  getPDFsByTopicAndDifficulty(
    topicId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/topic/${topicId}/difficulty/${level}`);
  }

  /**
   * GET /api/pdfs/subject/{subjectId}
   * Get all PDFs for a subject
   */
  getPDFsBySubject(subjectId: string): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * GET /api/pdfs/subject/{subjectId}/difficulty/{level}
   * Get PDFs by subject and difficulty
   */
  getPDFsBySubjectAndDifficulty(
    subjectId: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  ): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/subject/${subjectId}/difficulty/${level}`);
  }

  /**
   * GET /api/pdfs/downloadable
   * Get all downloadable PDFs (free access)
   */
  getDownloadablePDFs(): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/downloadable`);
  }

  /**
   * GET /api/pdfs/difficulty/{level}
   * Get PDFs by difficulty level
   */
  getPDFsByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<PDF[]> {
    return this.http.get<PDF[]>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * PUT /api/pdfs/{id}
   * Update PDF
   */
  updatePDF(id: string, pdf: PDF): Observable<PDF> {
    return this.http.put<PDF>(`${this.apiUrl}/${id}`, pdf, {
      headers: this.getHeaders()
    });
  }

  /**
   * PATCH /api/pdfs/{id}/downloadable
   * Toggle downloadable status
   */
  toggleDownloadable(id: string, isDownloadable: boolean): Observable<PDF> {
    return this.http.patch<PDF>(
      `${this.apiUrl}/${id}/downloadable?isDownloadable=${isDownloadable}`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/pdfs/{id}
   * Delete PDF
   */
  deletePDF(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    });
  }

  /**
   * GET /api/pdfs/topic/{topicId}/stats
   * Get PDF statistics for a topic
   */
  getTopicPDFStats(topicId: string): Observable<PDFStats> {
    return this.http.get<PDFStats>(`${this.apiUrl}/topic/${topicId}/stats`);
  }
}

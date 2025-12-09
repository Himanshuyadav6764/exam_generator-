import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject } from './subject.service';
import { Topic } from './topic.service';
import { Video } from './video.service';
import { PDF } from './pdf.service';
import { MCQ } from './mcq.service';

export interface CompleteSubjectContent {
  subject: Subject;
  topics: TopicWithContent[];
  topicCount: number;
  totalVideos: number;
  totalPDFs: number;
  totalMCQs: number;
}

export interface TopicWithContent {
  topic: Topic;
  videos: Video[];
  pdfs: PDF[];
  mcqs: MCQ[];
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface SubjectSummary {
  subject: Subject;
  topics: Topic[];
  topicCount: number;
  totalVideos: number;
  totalPDFs: number;
  totalMCQs: number;
}

export interface CompleteTopicContent {
  topic: Topic;
  videos: Video[];
  pdfs: PDF[];
  mcqs: MCQ[];
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface ContentByDifficulty {
  difficulty: string;
  subjects: Subject[];
  topics: Topic[];
  videos: Video[];
  pdfs: PDF[];
  mcqs: MCQ[];
  subjectCount: number;
  topicCount: number;
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface PreviewContent {
  subjects: Subject[];
  previewVideos: Video[];
  freePDFs: PDF[];
  subjectCount: number;
  previewVideoCount: number;
  freePDFCount: number;
}

export interface InstructorContent {
  instructorEmail: string;
  subjects: Subject[];
  subjectsWithStats: SubjectWithStats[];
  totalSubjects: number;
  totalTopics: number;
  totalVideos: number;
  totalPDFs: number;
  totalMCQs: number;
}

export interface SubjectWithStats {
  subject: Subject;
  topicCount: number;
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface SearchResults {
  query: string;
  subjects: Subject[];
  topics: Topic[];
  videos: Video[];
  pdfs: PDF[];
  mcqs: MCQ[];
  subjectCount: number;
  topicCount: number;
  videoCount: number;
  pdfCount: number;
  mcqCount: number;
}

export interface GlobalStats {
  totalSubjects: number;
  totalTopics: number;
  totalVideos: number;
  totalPDFs: number;
  totalMCQs: number;
  byDifficulty: {
    BEGINNER: DifficultyStats;
    INTERMEDIATE: DifficultyStats;
    ADVANCED: DifficultyStats;
  };
  subjectsByStatus: {
    DRAFT: number;
    PUBLISHED: number;
  };
}

export interface DifficultyStats {
  subjects: number;
  topics: number;
  videos: number;
  pdfs: number;
  mcqs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = 'http://localhost:8081/api/content';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * GET /api/content/subject/{id}/complete
   * Get complete hierarchical structure for a subject
   * Returns Subject with nested Topics, each containing Videos, PDFs, and MCQs
   */
  getCompleteSubjectContent(id: string): Observable<CompleteSubjectContent> {
    return this.http.get<CompleteSubjectContent>(`${this.apiUrl}/subject/${id}/complete`);
  }

  /**
   * GET /api/content/subject/{id}/summary
   * Get subject summary with topic list (without full content)
   */
  getSubjectSummary(id: string): Observable<SubjectSummary> {
    return this.http.get<SubjectSummary>(`${this.apiUrl}/subject/${id}/summary`);
  }

  /**
   * GET /api/content/topic/{id}/complete
   * Get complete content for a single topic
   */
  getCompleteTopicContent(id: string): Observable<CompleteTopicContent> {
    return this.http.get<CompleteTopicContent>(`${this.apiUrl}/topic/${id}/complete`);
  }

  /**
   * GET /api/content/difficulty/{level}
   * Get all content by difficulty level
   */
  getContentByDifficulty(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Observable<ContentByDifficulty> {
    return this.http.get<ContentByDifficulty>(`${this.apiUrl}/difficulty/${level}`);
  }

  /**
   * GET /api/content/preview
   * Get all preview/free content
   */
  getPreviewContent(): Observable<PreviewContent> {
    return this.http.get<PreviewContent>(`${this.apiUrl}/preview`);
  }

  /**
   * GET /api/content/instructor/{email}
   * Get all content by instructor
   */
  getContentByInstructor(email: string): Observable<InstructorContent> {
    return this.http.get<InstructorContent>(`${this.apiUrl}/instructor/${email}`);
  }

  /**
   * GET /api/content/search
   * Search across all content types
   */
  searchContent(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this.apiUrl}/search`, {
      params: { query },
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/content/stats
   * Get global content statistics
   */
  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.apiUrl}/stats`);
  }

  /**
   * GET /api/content/course/{courseId}
   * Get all content for a specific course
   */
  getContentByCourse(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/course/${courseId}`);
  }

  /**
   * POST /api/content
   * Create new content
   */
  createContent(content: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, content);
  }

  /**
   * PUT /api/content/{id}
   * Update existing content
   */
  updateContent(id: string, content: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, content);
  }

  /**
   * DELETE /api/content/{id}
   * Delete content by ID
   */
  deleteContent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

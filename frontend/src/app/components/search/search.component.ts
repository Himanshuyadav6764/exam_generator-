import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RecommendationSyncService } from '../../services/recommendation-sync.service';
import { environment } from '../../../environments/environment';

interface SearchResults {
  courses: any[];
  topics: any[];
  totalResults: number;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchQuery: string = '';
  searchResults: SearchResults = {
    courses: [],
    topics: [],
    totalResults: 0
  };
  loading: boolean = false;
  error: string = '';
  hasSearched: boolean = false;
  
  private searchSubject = new Subject<string>();
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private recommendationSync: RecommendationSyncService
  ) {}

  ngOnInit(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.hasSearched = false;
          this.searchResults = { courses: [], topics: [], totalResults: 0 };
          return [];
        }
        this.loading = true;
        this.hasSearched = true;
        this.error = '';
        
        const token = localStorage.getItem('token');
        console.log('Sending search request for:', query);
        console.log('Token exists:', !!token);
        
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        
        return this.http.get<SearchResults>(`${this.apiUrl}/search`, { 
          headers, 
          params: { query: query.trim() } 
        });
      })
    ).subscribe({
      next: (results: any) => {
        console.log('Search API response:', results);
        this.searchResults = results || { courses: [], topics: [], totalResults: 0 };
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('🔥 FULL ERROR OBJECT:', err);
        console.error('🔥 Status:', err.status);
        console.error('🔥 Status Text:', err.statusText);
        console.error('🔥 Error Body:', err.error);
        console.error('🔥 URL:', err.url);
        console.error('🔥 Message:', err.message);
        
        if (err.status === 401 || err.status === 403) {
          this.error = 'Please login to search courses.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Backend is not running on port 8081.';
        } else if (err.status === 404) {
          this.error = 'Search endpoint not found. Please check backend configuration.';
        } else {
          this.error = `Error ${err.status}: ${err.statusText || 'Failed to perform search'}`;
        }
        this.loading = false;
        this.searchResults = { courses: [], topics: [], totalResults: 0 };
      }
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(target.value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = {
      courses: [],
      topics: [],
      totalResults: 0
    };
    this.hasSearched = false;
    this.error = '';
  }

  getTotalResults(): number {
    return this.searchResults.totalResults || 0;
  }

  // Navigation methods
  viewCourse(courseId: string): void {
    // Save to recommendations before navigating
    this.saveToRecommendations(courseId);
    this.router.navigate(['/course-enrolled', courseId]);
  }

  viewTopic(item: any): void {
    // Save course to recommendations when viewing topic/subcontent
    if (item.courseId) {
      this.saveToRecommendations(item.courseId);
    }
    
    if (item.type === 'subcontent') {
      this.router.navigate(['/learning-workspace', item.courseId, item.topicName, item.name]);
    } else if (item.type === 'topic') {
      this.router.navigate(['/course-enrolled', item.courseId]);
    }
  }

  // View course details modal
  viewCourseDetails(courseId: string): void {
    // Find the course from search results
    const course = this.searchResults.courses.find(c => c.id === courseId);
    if (course) {
      alert(`📚 Course Details\n\nTitle: ${course.title}\n\nDescription: ${course.description}\n\nInstructor: ${course.instructorName}\n\nDifficulty: ${course.difficulty}\n\nSubjects: ${course.subjects?.join(', ') || 'N/A'}`);
    }
  }

  // Add course to recommendations with user feedback
  addToRecommendations(courseId: string, courseTitle: string): void {
    const userEmail = localStorage.getItem('email');
    if (!userEmail) {
      this.showToast('⚠️ Please login to add recommendations', 'warning');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(
      `${environment.apiUrl}/student/${userEmail}/recommendations/add`,
      { courseId },
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Course added to recommendations:', response.courseTitle);
        this.showToast(`⭐ "${courseTitle}" added to your recommendations!`, 'success');
        // Notify other components about the update
        this.recommendationSync.notifyRecommendationAdded();
      },
      error: (err) => {
        console.error('Failed to save recommendation:', err);
        this.showToast('❌ Failed to add recommendation', 'error');
      }
    });
  }

  // Save course to student recommendations (silent background save)
  private saveToRecommendations(courseId: string): void {
    const userEmail = localStorage.getItem('email');
    if (!userEmail) {
      console.warn('User email not found, skipping recommendation save');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(
      `${environment.apiUrl}/student/${userEmail}/recommendations/add`,
      { courseId },
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Course added to recommendations:', response.courseTitle);
      },
      error: (err) => {
        console.error('Failed to save recommendation:', err);
      }
    });
  }

  // Show toast notification
  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helper methods for display
  getDifficultyClass(difficulty: string): string {
    return `difficulty-${difficulty?.toLowerCase() || 'beginner'}`;
  }

  formatDuration(duration: number): string {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RecommendationService, RecommendationResponse } from '../../services/recommendation.service';
import { CourseService } from '../../services/course.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RecommendationSyncService } from '../../services/recommendation-sync.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  fullName: string = '';
  email: string = '';
  recommendations: RecommendationResponse | null = null;
  loading = false;
  error: string | null = null;
  
  // Courses
  availableCourses: any[] = [];
  allCourses: any[] = [];
  loadingCourses = false;
  showMyCourses = false;
  selectedCategory: string = '';
  
  // Course Recommendations (from search)
  recommendedCourses: any[] = [];
  loadingRecommendations = false;
  
  // Course Details Modal
  showDetailsModal = false;
  selectedCourseId: string = '';

  constructor(
    private authService: AuthService,
    private recommendationService: RecommendationService,
    private courseService: CourseService,
    private http: HttpClient,
    private router: Router,
    private recommendationSync: RecommendationSyncService
  ) {}

  ngOnInit(): void {
    this.fullName = this.authService.getFullName() || '';
    this.email = this.authService.getEmail() || '';
    
    if (this.email) {
      this.loadRecommendations();
      this.loadCourses();
      this.loadCourseRecommendations();
    }
  }

  loadCourses(): void {
    this.loadingCourses = true;
    this.courseService.getPublishedCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.availableCourses = courses;
        this.loadingCourses = false;
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.loadingCourses = false;
      }
    });
  }
  
  toggleMyCourses(): void {
    this.showMyCourses = !this.showMyCourses;
  }

  viewCourseDetails(courseId: string): void {
    this.selectedCourseId = courseId;
    this.showDetailsModal = true;
    console.log('Viewing course details:', courseId);
  }
  
  enrollInCourse(courseId: string): void {
    // Navigate to enrolled course page
    this.router.navigate(['/course-enrolled', courseId]);
  }
  
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCourseId = '';
  }

  loadRecommendations(): void {
    this.loading = true;
    this.recommendationService.getRecommendations(this.email).subscribe({
      next: (data) => {
        this.recommendations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recommendations:', err);
        this.error = 'Failed to load recommendations';
        this.loading = false;
      }
    });
  }
  
  loadCourseRecommendations(): void {
    this.loadingRecommendations = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(
      `http://localhost:8081/api/student/${this.email}/recommendations`,
      { headers }
    ).subscribe({
      next: (response) => {
        this.recommendedCourses = response.recommendations || [];
        this.loadingRecommendations = false;
        console.log('✅ Loaded recommended courses:', this.recommendedCourses.length);
      },
      error: (err) => {
        console.error('Error loading course recommendations:', err);
        this.loadingRecommendations = false;
      }
    });
  }
  
  viewRecommendedCourse(courseId: string): void {
    // Navigate directly to course-enrolled page (chapters/content)
    this.router.navigate(['/course-enrolled', courseId]);
  }

  getPriorityClass(priority: string): string {
    switch(priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  }

  getContentIcon(type: string): string {
    switch(type) {
      case 'VIDEO': return '🎥';
      case 'PDF': return '📄';
      case 'MCQ': return '📝';
      default: return '📚';
    }
  }

  // Add course to recommendations with feedback
  addToRecommendations(courseId: string, courseTitle: string): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(
      `http://localhost:8081/api/student/${this.email}/recommendations/add`,
      { courseId },
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Course added to recommendations:', response.courseTitle);
        this.showToast(`⭐ "${courseTitle}" added to your recommendations!`, 'success');
        // Reload recommendations to show updated list
        this.loadCourseRecommendations();
        // Notify other components about the update
        this.recommendationSync.notifyRecommendationAdded();
      },
      error: (err) => {
        console.error('Failed to save recommendation:', err);
        this.showToast('❌ Failed to add recommendation', 'error');
      }
    });
  }

  // Show toast notification
  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
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
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Helper methods for course cards
  getCourseGradient(subjects: string[]): string {
    if (!subjects || subjects.length === 0) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    const subject = subjects[0].toLowerCase();
    if (subject.includes('web') || subject.includes('html') || subject.includes('css')) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (subject.includes('data structure') || subject.includes('dsa') || subject.includes('algorithm')) {
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else if (subject.includes('python')) {
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else if (subject.includes('java')) {
      return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (subject.includes('machine learning') || subject.includes('ai') || subject.includes('ml')) {
      return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    } else if (subject.includes('system design')) {
      return 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
    } else if (subject.includes('devops')) {
      return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  getCourseEmoji(subjects: string[]): string {
    if (!subjects || subjects.length === 0) return '📚';
    
    const subject = subjects[0].toLowerCase();
    if (subject.includes('web') || subject.includes('html') || subject.includes('css')) {
      return '🌐';
    } else if (subject.includes('data structure') || subject.includes('dsa') || subject.includes('algorithm')) {
      return '🔢';
    } else if (subject.includes('python')) {
      return '🐍';
    } else if (subject.includes('java')) {
      return '☕';
    } else if (subject.includes('machine learning') || subject.includes('ai') || subject.includes('ml')) {
      return '🤖';
    } else if (subject.includes('system design')) {
      return '🏗️';
    } else if (subject.includes('devops')) {
      return '⚙️';
    }
    return '📚';
  }

  getCourseLabel(subjects: string[]): string {
    if (!subjects || subjects.length === 0) return 'Beginner to Advanced';
    
    const subject = subjects[0].toLowerCase();
    if (subject.includes('web')) {
      return 'Full Stack Web Development';
    } else if (subject.includes('data structure') || subject.includes('dsa')) {
      return 'DSA Mastery Course';
    } else if (subject.includes('python')) {
      return 'Python Programming';
    } else if (subject.includes('java')) {
      return 'Java Development';
    } else if (subject.includes('machine learning') || subject.includes('ai')) {
      return 'AI & Machine Learning';
    } else if (subject.includes('system design')) {
      return 'System Design Fundamentals';
    } else if (subject.includes('devops')) {
      return 'DevOps Engineering';
    }
    return 'Beginner to Advanced';
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    
    if (!category) {
      this.availableCourses = this.allCourses;
      return;
    }

    this.availableCourses = this.allCourses.filter(course => {
      if (!course.subjects || course.subjects.length === 0) return false;
      
      const courseSubjects = course.subjects.map((s: string) => s.toLowerCase());
      const categoryLower = category.toLowerCase();

      // DSA category matching
      if (categoryLower.includes('data structure') || categoryLower.includes('algorithm')) {
        return courseSubjects.some((s: string) => 
          s.includes('data structure') || 
          s.includes('dsa') || 
          s.includes('algorithm') ||
          s.includes('algorithms')
        );
      }

      // Web Development matching
      if (categoryLower.includes('web development')) {
        return courseSubjects.some((s: string) => 
          s.includes('web') || 
          s.includes('html') || 
          s.includes('css') ||
          s.includes('javascript') ||
          s.includes('react') ||
          s.includes('angular') ||
          s.includes('frontend') ||
          s.includes('backend') ||
          s.includes('full stack')
        );
      }

      // AI/ML/Data Science matching
      if (categoryLower.includes('ai') || categoryLower.includes('data science')) {
        return courseSubjects.some((s: string) => 
          s.includes('ai') || 
          s.includes('artificial intelligence') ||
          s.includes('data science') ||
          s.includes('deep learning') ||
          s.includes('neural network')
        );
      }

      // Machine Learning matching
      if (categoryLower.includes('machine learning')) {
        return courseSubjects.some((s: string) => 
          s.includes('machine learning') || 
          s.includes('ml') ||
          s.includes('deep learning') ||
          s.includes('tensorflow') ||
          s.includes('pytorch')
        );
      }

      // Python matching
      if (categoryLower.includes('python')) {
        return courseSubjects.some((s: string) => 
          s.includes('python')
        );
      }

      // Java matching
      if (categoryLower.includes('java')) {
        return courseSubjects.some((s: string) => 
          s.includes('java') && !s.includes('javascript')
        );
      }

      // System Design matching
      if (categoryLower.includes('system design')) {
        return courseSubjects.some((s: string) => 
          s.includes('system design') || 
          s.includes('architecture') ||
          s.includes('scalability') ||
          s.includes('distributed')
        );
      }

      // DevOps matching
      if (categoryLower.includes('devops')) {
        return courseSubjects.some((s: string) => 
          s.includes('devops') || 
          s.includes('docker') ||
          s.includes('kubernetes') ||
          s.includes('ci/cd') ||
          s.includes('jenkins') ||
          s.includes('aws') ||
          s.includes('cloud')
        );
      }

      return false;
    });

    console.log(`Filtered ${this.availableCourses.length} courses for category: ${category}`);
  }

  clearFilter(): void {
    this.selectedCategory = '';
    this.availableCourses = this.allCourses;
  }
}

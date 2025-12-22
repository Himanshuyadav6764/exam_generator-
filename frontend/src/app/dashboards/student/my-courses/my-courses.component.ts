import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { EnrollmentService } from '../../../services/enrollment.service';
import { AuthService } from '../../../services/auth.service';
import { RecommendationService } from '../../../services/recommendation.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.css']
})
export class MyCoursesComponent implements OnInit {
  
  publishedCourses: any[] = [];
  filteredCourses: any[] = [];
  enrolledCourseIds: Set<string> = new Set();
  enrollments: any[] = [];
  loading: boolean = true;
  error: string = '';
  studentEmail: string = '';
  studentId: string = '';
  fullName: string = '';
  userInitials: string = 'ST';
  searchQuery: string = '';
  showDetailsModal: boolean = false;
  selectedCourse: any = null;
  courseDetails: any = null;
  loadingDetails: boolean = false;

  constructor(
    private router: Router,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private authService: AuthService,
    private recommendationService: RecommendationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentEmail = user.email;
      this.studentId = (user as any).id || user.email;
      this.fullName = user.fullName || user.email.split('@')[0];
      this.userInitials = this.getInitials(this.fullName);
    }
    
    this.loadCoursesAndEnrollments();
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadCoursesAndEnrollments(): void {
    this.loading = true;
    
    // First load courses, then try to load enrollments
    this.courseService.getPublishedCourses().subscribe({
      next: (courses) => {
        this.publishedCourses = courses;
        this.filteredCourses = courses;
        console.log('Loaded courses:', courses.length);
        
        // Try to load enrollments (optional, won't fail if endpoint doesn't work)
        this.enrollmentService.getUserEnrollments(this.studentId).subscribe({
          next: (enrollments) => {
            this.enrollments = enrollments;
            this.enrolledCourseIds = new Set(
              enrollments.map((e: any) => e.courseId)
            );
            console.log('Loaded enrollments:', enrollments.length);
            console.log('Enrolled course IDs:', Array.from(this.enrolledCourseIds));
            this.loading = false;
          },
          error: (err) => {
            console.warn('Could not load enrollments:', err);
            // Continue without enrollments
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.error = 'Failed to load courses';
        this.loading = false;
      }
    });
  }

  loadPublishedCourses(): void {
    this.loading = true;
    this.courseService.getPublishedCourses().subscribe({
      next: (courses) => {
        this.publishedCourses = courses;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.error = 'Failed to load courses';
        this.loading = false;
      }
    });
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourseIds.has(courseId);
  }

  enrollCourse(course: any): void {
    const enrollment = {
      userId: this.studentId,
      userEmail: this.studentEmail,
      courseId: course.id,
      courseTitle: course.title,
      enrollmentDate: new Date().toISOString(),
      status: 'ACTIVE',
      progress: 0
    };

    this.enrollmentService.enrollStudent(enrollment).subscribe({
      next: (response) => {
        console.log('✅ Enrolled successfully:', response);
        
        // Update local state immediately
        this.enrolledCourseIds.add(course.id);
        this.enrollments.push(response);
        
        console.log('Updated enrolled IDs:', Array.from(this.enrolledCourseIds));
        
        // Force Angular to detect changes
        setTimeout(() => {
          console.log('Is enrolled check:', this.isEnrolled(course.id));
        }, 100);
      },
      error: (err) => {
        console.error('❌ Error enrolling:', err);
        alert('Failed to enroll in course. Please try again.');
      }
    });
  }

  startCourse(course: any): void {
    // Check if enrolled first
    if (!this.isEnrolled(course.id)) {
      alert('Please enroll in this course first before starting.');
      return;
    }
    
    // Navigate directly to learning content
    this.router.navigate(['/learning-content'], {
      queryParams: {
        courseId: course.id,
        courseName: course.title
      }
    });
  }

  viewCourseDetails(course: any): void {
    this.selectedCourse = course;
    this.showDetailsModal = true;
    this.loadingDetails = true;
    
    // Fetch detailed course information
    this.courseService.getCourseDetails(course.id).subscribe({
      next: (details) => {
        this.courseDetails = details;
        this.loadingDetails = false;
        console.log('Course details:', details);
      },
      error: (err) => {
        console.error('Error loading course details:', err);
        this.loadingDetails = false;
        // Set basic details from course object
        this.courseDetails = {
          topics: course.topics || [],
          totalTopics: course.topics?.length || 0,
          totalSubtopics: 0,
          totalVideos: 0,
          totalPdfs: 0,
          totalMcqs: 0,
          totalAiQuizzes: 1
        };
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCourse = null;
    this.courseDetails = null;
  }

  getTopicIcon(index: number): string {
    const icons = ['📚', '📖', '📝', '🎯', '💡', '🔬', '🎓', '📊', '🔍', '⚡'];
    return icons[index % icons.length];
  }

  goToDashboard(): void {
    this.router.navigate(['/adaptive-panel']);
  }

  getDifficultyColor(difficulty: string): string {
    switch(difficulty?.toUpperCase()) {
      case 'BEGINNER': return '#4ade80';
      case 'INTERMEDIATE': return '#f59e0b';
      case 'ADVANCED': return '#ef4444';
      default: return '#4ade80';
    }
  }

  getDifficultyIcon(difficulty: string): string {
    switch(difficulty?.toUpperCase()) {
      case 'BEGINNER': return 'fa-signal';
      case 'INTERMEDIATE': return 'fa-signal';
      case 'ADVANCED': return 'fa-signal';
      default: return 'fa-signal';
    }
  }
  addToRecommendations(course: any, event: Event): void {
    event.stopPropagation(); // Prevent triggering other click events
    
    this.recommendationService.addCourseToRecommendations(this.studentEmail, course.id).subscribe({
      next: (response) => {
        console.log('✅ Added to recommendations:', response);
        alert(`⭐ "${course.title}" has been added to your recommendations!`);
      },
      error: (err) => {
        console.error('❌ Error adding to recommendations:', err);
        alert('Failed to add recommendation. Please try again.');
      }
    });
  }

  searchCourses(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCourses = this.publishedCourses;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCourses = this.publishedCourses.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.instructorName?.toLowerCase().includes(query) ||
      course.instructorEmail?.toLowerCase().includes(query) ||
      course.difficulty?.toLowerCase().includes(query) ||
      course.subjects?.some((subject: string) => subject.toLowerCase().includes(query))
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredCourses = this.publishedCourses;
  }
}

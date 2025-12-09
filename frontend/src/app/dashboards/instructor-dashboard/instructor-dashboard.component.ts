import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit {
  fullName: string = '';
  email: string = '';
  showCreateCourse: boolean = false;
  course = {
    title: '',
    description: '',
    difficulty: '',
    topics: [] as string[],
    instructorEmail: ''
  };
  newTopic: string = '';
  submitting: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.fullName = this.authService.getFullName() || '';
    this.email = this.authService.getEmail() || '';
  }

  showCreateCourseModal(): void {
    // Navigate to the full create course page with all features
    this.router.navigate(['/create-course']);
  }

  closeCreateCourse(): void {
    this.showCreateCourse = false;
    this.resetForm();
  }

  manageCourses(): void {
    // Navigate to the course management page with full table view
    this.router.navigate(['/course-management']);
  }

  uploadContent(): void {
    // Navigate to content management to upload videos/PDFs per topic
    this.router.navigate(['/content-management']);
  }

  manageTopics(): void {
    // Navigate to topic management page
    this.router.navigate(['/topic-management']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  addTopic(): void {
    if (this.newTopic.trim()) {
      this.course.topics.push(this.newTopic.trim());
      this.newTopic = '';
    }
  }

  removeTopic(index: number): void {
    this.course.topics.splice(index, 1);
  }

  createCourse(): void {
    if (!this.course.title || !this.course.description || !this.course.difficulty) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }
    if (this.course.topics.length === 0) {
      this.errorMessage = 'Please add at least one topic';
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.course.instructorEmail = this.email;
    this.courseService.createCourse(this.course).subscribe({
      next: (response) => {
        this.successMessage = 'Course created successfully!';
        this.submitting = false;
        setTimeout(() => {
          this.closeCreateCourse();
          this.router.navigate(['/topic-management']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating course:', error);
        this.errorMessage = error.error?.message || 'Failed to create course';
        this.submitting = false;
      }
    });
  }

  private resetForm(): void {
    this.course = { title: '', description: '', difficulty: '', topics: [], instructorEmail: '' };
    this.newTopic = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.submitting = false;
  }
}

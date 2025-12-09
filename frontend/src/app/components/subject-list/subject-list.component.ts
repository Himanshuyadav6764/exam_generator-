import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubjectService, Subject } from '../../services/subject.service';

@Component({
  selector: 'app-subject-list',
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css']
})
export class SubjectListComponent implements OnInit {
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  selectedDifficulty: string = 'ALL';
  selectedStatus: string = 'ALL';
  isLoading: boolean = false;
  errorMessage: string = '';
  userRole: string = '';
  userEmail: string = '';

  constructor(
    private subjectService: SubjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.userEmail = localStorage.getItem('email') || '';
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.userRole === 'INSTRUCTOR') {
      // Instructors see only their subjects
      this.subjectService.getSubjectsByInstructor(this.userEmail).subscribe({
        next: (data) => {
          this.subjects = data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load subjects';
          console.error(error);
          this.isLoading = false;
        }
      });
    } else {
      // Students and admins see all published subjects
      this.subjectService.getAllSubjects().subscribe({
        next: (data) => {
          this.subjects = data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load subjects';
          console.error(error);
          this.isLoading = false;
        }
      });
    }
  }

  applyFilters(): void {
    this.filteredSubjects = this.subjects.filter(subject => {
      const difficultyMatch = this.selectedDifficulty === 'ALL' || 
                              subject.difficulty === this.selectedDifficulty;
      const statusMatch = this.selectedStatus === 'ALL' || 
                         subject.status === this.selectedStatus;
      return difficultyMatch && statusMatch;
    });
  }

  onDifficultyChange(difficulty: string): void {
    this.selectedDifficulty = difficulty;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  viewSubjectDetails(subjectId: string): void {
    this.router.navigate(['/subjects', subjectId]);
  }

  createNewSubject(): void {
    this.router.navigate(['/subjects/create']);
  }

  editSubject(subjectId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/subjects/edit', subjectId]);
  }

  deleteSubject(subjectId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this subject? All topics and content will be removed.')) {
      this.subjectService.deleteSubject(subjectId).subscribe({
        next: () => {
          this.loadSubjects();
        },
        error: (error) => {
          alert('Failed to delete subject');
          console.error(error);
        }
      });
    }
  }

  togglePublish(subject: Subject, event: Event): void {
    event.stopPropagation();
    
    const newStatus = subject.status === 'PUBLISHED';
    this.subjectService.publishSubject(subject.id!, !newStatus).subscribe({
      next: (updated) => {
        subject.status = updated.status;
      },
      error: (error) => {
        alert('Failed to update status');
        console.error(error);
      }
    });
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER': return 'difficulty-beginner';
      case 'INTERMEDIATE': return 'difficulty-intermediate';
      case 'ADVANCED': return 'difficulty-advanced';
      default: return '';
    }
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER': return '🌱';
      case 'INTERMEDIATE': return '🔥';
      case 'ADVANCED': return '⚡';
      default: return '';
    }
  }

  canEdit(subject: Subject): boolean {
    return this.userRole === 'INSTRUCTOR' && subject.instructorEmail === this.userEmail ||
           this.userRole === 'ADMIN';
  }

  canDelete(subject: Subject): boolean {
    return this.userRole === 'ADMIN' || 
           (this.userRole === 'INSTRUCTOR' && subject.instructorEmail === this.userEmail);
  }
}

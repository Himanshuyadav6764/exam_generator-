import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubjectService } from '../../services/subject.service';
import { Subject } from '../../services/subject.service';

@Component({
  selector: 'app-subject-form',
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.css']
})
export class SubjectFormComponent implements OnInit {
  subjectForm: FormGroup;
  isEditMode = false;
  subjectId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  uploadProgress = 0;

  difficultyLevels = [
    { value: 'BEGINNER', label: 'Beginner', icon: '🌱', color: '#4caf50' },
    { value: 'INTERMEDIATE', label: 'Intermediate', icon: '🔥', color: '#ff9800' },
    { value: 'ADVANCED', label: 'Advanced', icon: '⚡', color: '#f44336' }
  ];

  currentUserRole: string | null = null;

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.subjectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      difficulty: ['BEGINNER', Validators.required],
      instructorEmail: ['', [Validators.required, Validators.email]],
      status: ['DRAFT']
    });
  }

  ngOnInit(): void {
    this.currentUserRole = localStorage.getItem('userRole');
    
    // Check if in edit mode
    this.subjectId = this.route.snapshot.paramMap.get('id');
    if (this.subjectId) {
      this.isEditMode = true;
      this.loadSubject();
    } else {
      // Auto-fill instructorEmail if current user is instructor
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail && this.currentUserRole === 'INSTRUCTOR') {
        this.subjectForm.patchValue({ instructorEmail: userEmail });
      }
    }
  }

  loadSubject(): void {
    if (!this.subjectId) return;

    this.loading = true;
    this.error = null;

    this.subjectService.getSubjectById(this.subjectId).subscribe({
      next: (subject) => {
        this.subjectForm.patchValue({
          title: subject.title,
          description: subject.description,
          difficulty: subject.difficulty,
          instructorEmail: subject.instructorEmail,
          status: subject.status
        });
        
        if (subject.thumbnail) {
          this.thumbnailPreview = subject.thumbnail;
        }
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load subject details. Please try again.';
        this.loading = false;
        console.error('Error loading subject:', err);
      }
    });
  }

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Image size should be less than 5MB';
        return;
      }

      this.thumbnailFile = file;
      this.error = null;

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail(): void {
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      Object.keys(this.subjectForm.controls).forEach(key => {
        const control = this.subjectForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.isEditMode && this.subjectId) {
      this.updateSubject();
    } else {
      this.createSubject();
    }
  }

  createSubject(): void {
    const formData = this.subjectForm.value;

    this.subjectService.createSubject(formData).subscribe({
      next: (subject) => {
        if (this.thumbnailFile && subject.id) {
          this.uploadThumbnail(subject.id);
        } else {
          this.handleSuccess('Subject created successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to create subject. Please try again.';
        this.loading = false;
        console.error('Error creating subject:', err);
      }
    });
  }

  updateSubject(): void {
    if (!this.subjectId) return;

    const formData = this.subjectForm.value;

    this.subjectService.updateSubject(this.subjectId, formData).subscribe({
      next: (subject) => {
        if (this.thumbnailFile && subject.id) {
          this.uploadThumbnail(subject.id);
        } else {
          this.handleSuccess('Subject updated successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to update subject. Please try again.';
        this.loading = false;
        console.error('Error updating subject:', err);
      }
    });
  }

  uploadThumbnail(subjectId: string): void {
    if (!this.thumbnailFile) return;

    this.subjectService.uploadThumbnail(subjectId, this.thumbnailFile).subscribe({
      next: () => {
        this.handleSuccess(
          this.isEditMode ? 'Subject updated with new thumbnail!' : 'Subject created with thumbnail!'
        );
      },
      error: (err) => {
        this.error = 'Subject saved, but thumbnail upload failed.';
        this.loading = false;
        console.error('Error uploading thumbnail:', err);
      }
    });
  }

  handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;
    
    // Navigate after 1.5 seconds
    setTimeout(() => {
      this.router.navigate(['/subjects']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/subjects']);
  }

  getDifficultyColor(difficulty: string): string {
    const level = this.difficultyLevels.find(d => d.value === difficulty);
    return level?.color || '#666';
  }

  // Getters for form validation
  get title() { return this.subjectForm.get('title'); }
  get description() { return this.subjectForm.get('description'); }
  get difficulty() { return this.subjectForm.get('difficulty'); }
  get instructorEmail() { return this.subjectForm.get('instructorEmail'); }
}

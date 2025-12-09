import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PDFService, PDF } from '../../services/pdf.service';
import { TopicService, Topic } from '../../services/topic.service';
import { SubjectService, Subject } from '../../services/subject.service';

@Component({
  selector: 'app-pdf-upload',
  templateUrl: './pdf-upload.component.html',
  styleUrls: ['./pdf-upload.component.css']
})
export class PDFUploadComponent implements OnInit {
  pdfForm: FormGroup;
  isEditMode = false;
  pdfId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  pdfFile: File | null = null;
  uploadProgress = 0;

  subjects: Subject[] = [];
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];

  currentUserRole: string | null = null;
  userEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private pdfService: PDFService,
    private topicService: TopicService,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.pdfForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      subjectId: ['', Validators.required],
      topicId: ['', Validators.required],
      pages: ['', [Validators.required, Validators.min(1)]],
      isDownloadable: [true],
      orderIndex: [0]
    });
  }

  ngOnInit(): void {
    this.currentUserRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');

    this.loadSubjects();

    this.pdfId = this.route.snapshot.paramMap.get('id');
    if (this.pdfId) {
      this.isEditMode = true;
      this.loadPDF();
    }

    this.pdfForm.get('subjectId')?.valueChanges.subscribe(subjectId => {
      this.onSubjectChange(subjectId);
    });
  }

  loadSubjects(): void {
    this.subjectService.getAllSubjects().subscribe({
      next: (subjects) => {
        if (this.currentUserRole === 'INSTRUCTOR') {
          this.subjects = subjects.filter(s => s.instructorEmail === this.userEmail);
        } else {
          this.subjects = subjects;
        }
      },
      error: (err) => {
        this.error = 'Failed to load subjects';
        console.error('Error loading subjects:', err);
      }
    });
  }

  onSubjectChange(subjectId: string): void {
    if (!subjectId) {
      this.filteredTopics = [];
      this.pdfForm.patchValue({ topicId: '' });
      return;
    }

    this.topicService.getTopicsBySubject(subjectId).subscribe({
      next: (topics) => {
        this.filteredTopics = topics;
        const currentTopicId = this.pdfForm.get('topicId')?.value;
        if (currentTopicId && !topics.find(t => t.id === currentTopicId)) {
          this.pdfForm.patchValue({ topicId: '' });
        }
      },
      error: (err) => {
        this.error = 'Failed to load topics';
        console.error('Error loading topics:', err);
      }
    });
  }

  loadPDF(): void {
    if (!this.pdfId) return;

    this.loading = true;
    this.error = null;

    this.pdfService.getPDFById(this.pdfId).subscribe({
      next: (pdf) => {
        this.pdfForm.patchValue({
          title: pdf.title,
          description: pdf.description,
          subjectId: pdf.subjectId,
          topicId: pdf.topicId,
          pages: pdf.pages,
          isDownloadable: pdf.isDownloadable,
          orderIndex: pdf.orderIndex
        });

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load PDF details';
        this.loading = false;
        console.error('Error loading PDF:', err);
      }
    });
  }

  onPDFSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== 'application/pdf') {
        this.error = 'Please select a valid PDF file';
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        this.error = 'PDF size should be less than 50MB';
        return;
      }

      this.pdfFile = file;
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.pdfForm.invalid) {
      Object.keys(this.pdfForm.controls).forEach(key => {
        const control = this.pdfForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.isEditMode && !this.pdfFile) {
      this.error = 'Please select a PDF file to upload';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.uploadProgress = 0;

    if (this.isEditMode && this.pdfId) {
      this.updatePDF();
    } else {
      this.uploadPDF();
    }
  }

  uploadPDF(): void {
    if (!this.pdfFile) return;

    const formData = this.pdfForm.value;

    this.pdfService.uploadPDF(
      this.pdfFile,
      formData.topicId,
      formData.title,
      formData.description,
      formData.pages,
      formData.isDownloadable
    ).subscribe({
      next: () => {
        this.handleSuccess('PDF uploaded successfully!');
      },
      error: (err) => {
        this.error = 'Failed to upload PDF. Please try again.';
        this.loading = false;
        console.error('Error uploading PDF:', err);
      }
    });
  }

  updatePDF(): void {
    if (!this.pdfId) return;

    const formData = this.pdfForm.value;
    const updatedPDF: PDF = {
      title: formData.title,
      description: formData.description,
      url: '', // Will be updated if PDF is re-uploaded
      subjectId: formData.subjectId,
      topicId: formData.topicId,
      pages: formData.pages,
      isDownloadable: formData.isDownloadable,
      orderIndex: formData.orderIndex
    };

    this.pdfService.updatePDF(this.pdfId, updatedPDF).subscribe({
      next: () => {
        if (this.pdfFile && this.pdfId) {
          this.reuploadPDF(this.pdfId);
        } else {
          this.handleSuccess('PDF updated successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to update PDF. Please try again.';
        this.loading = false;
        console.error('Error updating PDF:', err);
      }
    });
  }

  reuploadPDF(pdfId: string): void {
    if (!this.pdfFile) return;

    const formData = this.pdfForm.value;

    this.pdfService.uploadPDF(
      this.pdfFile,
      formData.topicId,
      formData.title,
      formData.description,
      formData.pages,
      formData.isDownloadable
    ).subscribe({
      next: () => {
        this.handleSuccess('PDF re-uploaded successfully!');
      },
      error: (err) => {
        this.error = 'Failed to re-upload PDF';
        this.loading = false;
        console.error('Error re-uploading PDF:', err);
      }
    });
  }

  handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;

    setTimeout(() => {
      this.router.navigate(['/pdfs']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/pdfs']);
  }

  getFileSize(): string {
    if (!this.pdfFile) return '';
    const sizeInMB = (this.pdfFile.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  }

  // Form getters
  get title() { return this.pdfForm.get('title'); }
  get description() { return this.pdfForm.get('description'); }
  get subjectId() { return this.pdfForm.get('subjectId'); }
  get topicId() { return this.pdfForm.get('topicId'); }
  get pages() { return this.pdfForm.get('pages'); }
}

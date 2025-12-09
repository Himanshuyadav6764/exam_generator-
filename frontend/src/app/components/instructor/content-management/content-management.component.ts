import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { CourseService } from '../../../services/course.service';
import { CloudinaryService } from '../../../services/cloudinary.service';

@Component({
  selector: 'app-content-management',
  templateUrl: './content-management.component.html',
  styleUrls: ['./content-management.component.css']
})
export class ContentManagementComponent implements OnInit {
  courseId: string = '';
  course: any = null;
  contents: any[] = [];
  showForm = false;
  editingContent: any = null;
  uploading = false;
  uploadProgress = 0;

  // File upload properties
  selectedVideoFile: File | null = null;
  selectedPdfFile: File | null = null;
  selectedThumbnailFile: File | null = null;

  subContent = {
    courseId: '',
    title: '',
    description: '',
    contentType: 'VIDEO',
    url: '',
    thumbnailUrl: '',
    topic: '',
    difficulty: 'BEGINNER',
    score: 10,
    duration: 0,
    orderIndex: 0,
    isPreview: false
  };

  message = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private courseService: CourseService,
    private cloudinaryService: CloudinaryService
  ) { }

  ngOnInit(): void {
    this.courseId = this.route.snapshot.params['id'];
    this.subContent.courseId = this.courseId;
    this.loadCourse();
    this.loadContents();
  }

  loadCourse(): void {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (data) => {
        this.course = data;
      },
      error: (error) => {
        console.error('Error loading course', error);
      }
    });
  }

  loadContents(): void {
    this.contentService.getContentByCourse(this.courseId).subscribe({
      next: (data) => {
        this.contents = data;
      },
      error: (error) => {
        console.error('Error loading contents', error);
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingContent = null;
    this.selectedVideoFile = null;
    this.selectedPdfFile = null;
    this.selectedThumbnailFile = null;
    this.subContent = {
      courseId: this.courseId,
      title: '',
      description: '',
      contentType: 'VIDEO',
      url: '',
      thumbnailUrl: '',
      topic: '',
      difficulty: 'BEGINNER',
      score: 10,
      duration: 0,
      orderIndex: this.contents.length,
      isPreview: false
    };
  }

  editContent(content: any): void {
    this.editingContent = content;
    this.subContent = { ...content };
    this.showForm = true;
  }

  deleteContent(id: string): void {
    if (confirm('Are you sure you want to delete this content?')) {
      this.contentService.deleteContent(id).subscribe({
        next: () => {
          this.message = 'Content deleted successfully';
          this.loadContents();
        },
        error: (error) => {
          this.errorMessage = 'Error deleting content: ' + error.error;
        }
      });
    }
  }

  // File selection methods
  onVideoFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      this.selectedVideoFile = file;
      this.subContent.contentType = 'VIDEO';
    } else {
      this.errorMessage = 'Please select a valid video file';
    }
  }

  onPdfFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdfFile = file;
      this.subContent.contentType = 'PDF';
    } else {
      this.errorMessage = 'Please select a valid PDF file';
    }
  }

  onThumbnailFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedThumbnailFile = file;
    } else {
      this.errorMessage = 'Please select a valid image file';
    }
  }

  // Upload files to Cloudinary
  async uploadFiles(): Promise<boolean> {
    this.uploading = true;
    this.uploadProgress = 0;

    try {
      // Upload video if selected
      if (this.selectedVideoFile) {
        const videoResult: any = await this.cloudinaryService.uploadVideo(
          this.selectedVideoFile,
          `courses/${this.courseId}/videos`
        ).toPromise();
        this.subContent.url = videoResult.url;
        this.uploadProgress = 33;
      }

      // Upload PDF if selected
      if (this.selectedPdfFile) {
        const pdfResult: any = await this.cloudinaryService.uploadPdf(
          this.selectedPdfFile,
          `courses/${this.courseId}/pdfs`
        ).toPromise();
        this.subContent.url = pdfResult.url;
        this.uploadProgress = 66;
      }

      // Upload thumbnail if selected
      if (this.selectedThumbnailFile) {
        const thumbnailResult: any = await this.cloudinaryService.uploadImage(
          this.selectedThumbnailFile,
          `courses/${this.courseId}/thumbnails`
        ).toPromise();
        this.subContent.thumbnailUrl = thumbnailResult.url;
        this.uploadProgress = 100;
      }

      this.uploading = false;
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      this.errorMessage = 'Error uploading files. Please try again.';
      this.uploading = false;
      return false;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.subContent.title || !this.subContent.topic) {
      this.errorMessage = 'Please fill in title and select a topic';
      return;
    }

    // Upload files if any are selected
    if (this.selectedVideoFile || this.selectedPdfFile || this.selectedThumbnailFile) {
      const uploadSuccess = await this.uploadFiles();
      if (!uploadSuccess) {
        return;
      }
    }

    // Check if we have a URL (either from upload or manual entry)
    if (!this.subContent.url) {
      this.errorMessage = 'Please upload a file or provide a URL';
      return;
    }

    if (this.editingContent) {
      this.contentService.updateContent(this.editingContent.id, this.subContent).subscribe({
        next: () => {
          this.message = 'Content updated successfully!';
          this.loadContents();
          this.toggleForm();
        },
        error: (error) => {
          this.errorMessage = 'Error updating content: ' + error.error;
        }
      });
    } else {
      this.contentService.createContent(this.subContent).subscribe({
        next: () => {
          this.message = 'Content added successfully!';
          this.loadContents();
          this.toggleForm();
        },
        error: (error) => {
          this.errorMessage = 'Error creating content: ' + error.error;
        }
      });
    }
  }

  getYouTubeEmbedUrl(url: string): string {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }

  getDrivePreviewUrl(url: string): string {
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/[-\w]{25,}/);
      return fileId ? `https://drive.google.com/file/d/${fileId[0]}/preview` : url;
    }
    return url;
  }
}

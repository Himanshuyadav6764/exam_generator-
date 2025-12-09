import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { CourseService } from '../../../services/course.service';
import { CloudinaryService } from '../../../services/cloudinary.service';

interface TopicContent {
  topic: string;
  difficulty: string;
  videoFile: File | null;
  pdfFile: File | null;
  thumbnailFile: File | null;
  title: string;
  description: string;
  duration: string;
  uploading: boolean;
  uploadProgress: number;
  uploaded: boolean;
  error: string;
}

@Component({
  selector: 'app-bulk-content-upload',
  templateUrl: './bulk-content-upload.component.html',
  styleUrls: ['./bulk-content-upload.component.css']
})
export class BulkContentUploadComponent implements OnInit {
  courseId: string = '';
  course: any = null;
  
  // Selected topics for bulk upload
  selectedTopics: string[] = [];
  
  // Content items for each selected topic
  topicContents: TopicContent[] = [];
  
  // Overall upload status
  overallUploading = false;
  completedUploads = 0;
  totalUploads = 0;
  
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
    this.loadCourse();
  }

  loadCourse(): void {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (data) => {
        this.course = data;
      },
      error: (error) => {
        console.error('Error loading course', error);
        this.errorMessage = 'Failed to load course details';
      }
    });
  }

  // Toggle topic selection
  toggleTopicSelection(topic: string): void {
    const index = this.selectedTopics.indexOf(topic);
    if (index > -1) {
      // Remove topic
      this.selectedTopics.splice(index, 1);
      this.topicContents = this.topicContents.filter(tc => tc.topic !== topic);
    } else {
      // Add topic
      this.selectedTopics.push(topic);
      this.topicContents.push({
        topic: topic,
        difficulty: 'BEGINNER',
        videoFile: null,
        pdfFile: null,
        thumbnailFile: null,
        title: '',
        description: '',
        duration: '',
        uploading: false,
        uploadProgress: 0,
        uploaded: false,
        error: ''
      });
    }
  }

  isTopicSelected(topic: string): boolean {
    return this.selectedTopics.includes(topic);
  }

  getTopicContent(topic: string): TopicContent | undefined {
    return this.topicContents.find(tc => tc.topic === topic);
  }

  // File selection for specific topic
  onVideoSelected(event: any, topic: string): void {
    const file = event.target.files[0];
    const topicContent = this.getTopicContent(topic);
    if (topicContent && file && file.type.startsWith('video/')) {
      topicContent.videoFile = file;
      if (!topicContent.title) {
        topicContent.title = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      }
    }
  }

  onPdfSelected(event: any, topic: string): void {
    const file = event.target.files[0];
    const topicContent = this.getTopicContent(topic);
    if (topicContent && file && file.type === 'application/pdf') {
      topicContent.pdfFile = file;
    }
  }

  onThumbnailSelected(event: any, topic: string): void {
    const file = event.target.files[0];
    const topicContent = this.getTopicContent(topic);
    if (topicContent && file && file.type.startsWith('image/')) {
      topicContent.thumbnailFile = file;
    }
  }

  // Upload files for a specific topic
  async uploadTopicContent(topicContent: TopicContent): Promise<boolean> {
    try {
      topicContent.uploading = true;
      topicContent.uploadProgress = 0;
      topicContent.error = '';

      let videoUrl = '';
      let pdfUrl = '';
      let thumbnailUrl = '';

      // Upload video
      if (topicContent.videoFile) {
        const videoResponse = await this.cloudinaryService
          .uploadVideo(topicContent.videoFile, `course-${this.courseId}/videos`)
          .toPromise();
        videoUrl = videoResponse.url;
        topicContent.uploadProgress = 33;
      }

      // Upload PDF
      if (topicContent.pdfFile) {
        const pdfResponse = await this.cloudinaryService
          .uploadPdf(topicContent.pdfFile, `course-${this.courseId}/pdfs`)
          .toPromise();
        pdfUrl = pdfResponse.url;
        topicContent.uploadProgress = 66;
      }

      // Upload thumbnail
      if (topicContent.thumbnailFile) {
        const thumbnailResponse = await this.cloudinaryService
          .uploadImage(topicContent.thumbnailFile, `course-${this.courseId}/thumbnails`)
          .toPromise();
        thumbnailUrl = thumbnailResponse.url;
        topicContent.uploadProgress = 100;
      }

      // Create content object
      const contentData = {
        courseId: this.courseId,
        title: topicContent.title,
        description: topicContent.description,
        contentType: topicContent.videoFile ? 'VIDEO' : 'PDF',
        url: videoUrl || pdfUrl,
        thumbnailUrl: thumbnailUrl,
        topic: topicContent.topic,
        difficulty: topicContent.difficulty,
        duration: topicContent.duration,
        isPreview: false
      };

      // Save to backend
      await this.contentService.createContent(contentData).toPromise();
      
      topicContent.uploaded = true;
      topicContent.uploading = false;
      return true;

    } catch (error: any) {
      topicContent.error = error.message || 'Upload failed';
      topicContent.uploading = false;
      topicContent.uploadProgress = 0;
      return false;
    }
  }

  // Upload all selected topics
  async uploadAll(): Promise<void> {
    // Validate
    if (this.topicContents.length === 0) {
      this.errorMessage = 'Please select at least one topic';
      return;
    }

    // Check if all have files and titles
    for (const tc of this.topicContents) {
      if (!tc.videoFile && !tc.pdfFile) {
        this.errorMessage = `Please select a video or PDF file for topic: ${tc.topic}`;
        return;
      }
      if (!tc.title) {
        this.errorMessage = `Please enter a title for topic: ${tc.topic}`;
        return;
      }
    }

    this.overallUploading = true;
    this.completedUploads = 0;
    this.totalUploads = this.topicContents.length;
    this.errorMessage = '';
    this.message = '';

    // Upload each topic sequentially
    for (const topicContent of this.topicContents) {
      const success = await this.uploadTopicContent(topicContent);
      if (success) {
        this.completedUploads++;
      }
    }

    this.overallUploading = false;

    // Show result
    const failed = this.topicContents.filter(tc => !tc.uploaded).length;
    if (failed === 0) {
      this.message = `Successfully uploaded ${this.completedUploads} content items!`;
      setTimeout(() => {
        this.router.navigate(['/instructor/courses', this.courseId, 'manage']);
      }, 2000);
    } else {
      this.errorMessage = `${this.completedUploads} succeeded, ${failed} failed. Check individual errors below.`;
    }
  }

  // Remove a file selection
  removeVideoFile(topic: string): void {
    const tc = this.getTopicContent(topic);
    if (tc) tc.videoFile = null;
  }

  removePdfFile(topic: string): void {
    const tc = this.getTopicContent(topic);
    if (tc) tc.pdfFile = null;
  }

  removeThumbnailFile(topic: string): void {
    const tc = this.getTopicContent(topic);
    if (tc) tc.thumbnailFile = null;
  }

  goBack(): void {
    this.router.navigate(['/instructor/courses', this.courseId, 'manage']);
  }
}

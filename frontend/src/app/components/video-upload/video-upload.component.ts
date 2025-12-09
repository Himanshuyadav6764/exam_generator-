import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService, Video } from '../../services/video.service';
import { TopicService, Topic } from '../../services/topic.service';
import { SubjectService, Subject } from '../../services/subject.service';

@Component({
  selector: 'app-video-upload',
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.component.css']
})
export class VideoUploadComponent implements OnInit {
  videoForm: FormGroup;
  isEditMode = false;
  videoId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  videoFile: File | null = null;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  uploadProgress = 0;

  subjects: Subject[] = [];
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];

  currentUserRole: string | null = null;
  userEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private topicService: TopicService,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      subjectId: ['', Validators.required],
      topicId: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
      isPreview: [false],
      orderIndex: [0]
    });
  }

  ngOnInit(): void {
    this.currentUserRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');

    this.loadSubjects();

    // Check if in edit mode
    this.videoId = this.route.snapshot.paramMap.get('id');
    if (this.videoId) {
      this.isEditMode = true;
      this.loadVideo();
    }

    // Watch for subject changes to filter topics
    this.videoForm.get('subjectId')?.valueChanges.subscribe(subjectId => {
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
      this.videoForm.patchValue({ topicId: '' });
      return;
    }

    this.topicService.getTopicsBySubject(subjectId).subscribe({
      next: (topics) => {
        this.filteredTopics = topics;
        // Reset topic selection if current topic is not in filtered list
        const currentTopicId = this.videoForm.get('topicId')?.value;
        if (currentTopicId && !topics.find(t => t.id === currentTopicId)) {
          this.videoForm.patchValue({ topicId: '' });
        }
      },
      error: (err) => {
        this.error = 'Failed to load topics';
        console.error('Error loading topics:', err);
      }
    });
  }

  loadVideo(): void {
    if (!this.videoId) return;

    this.loading = true;
    this.error = null;

    this.videoService.getVideoById(this.videoId).subscribe({
      next: (video) => {
        this.videoForm.patchValue({
          title: video.title,
          description: video.description,
          subjectId: video.subjectId,
          topicId: video.topicId,
          duration: video.duration,
          isPreview: video.isPreview,
          orderIndex: video.orderIndex
        });

        if (video.thumbnailUrl) {
          this.thumbnailPreview = video.thumbnailUrl;
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load video details';
        this.loading = false;
        console.error('Error loading video:', err);
      }
    });
  }

  onVideoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('video/')) {
        this.error = 'Please select a valid video file';
        return;
      }

      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        this.error = 'Video size should be less than 500MB';
        return;
      }

      this.videoFile = file;
      this.error = null;
    }
  }

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Thumbnail size should be less than 5MB';
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
    if (this.videoForm.invalid) {
      Object.keys(this.videoForm.controls).forEach(key => {
        const control = this.videoForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.isEditMode && !this.videoFile) {
      this.error = 'Please select a video file to upload';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.uploadProgress = 0;

    if (this.isEditMode && this.videoId) {
      this.updateVideo();
    } else {
      this.uploadVideo();
    }
  }

  uploadVideo(): void {
    if (!this.videoFile) return;

    const formData = this.videoForm.value;

    this.videoService.uploadVideo(
      this.videoFile,
      formData.topicId,
      formData.title,
      formData.description,
      formData.duration,
      formData.isPreview
    ).subscribe({
      next: (video) => {
        if (this.thumbnailFile && video.id) {
          this.uploadThumbnail(video.id);
        } else {
          this.handleSuccess('Video uploaded successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to upload video. Please try again.';
        this.loading = false;
        console.error('Error uploading video:', err);
      }
    });
  }

  updateVideo(): void {
    if (!this.videoId) return;

    const formData = this.videoForm.value;
    const updatedVideo: Video = {
      title: formData.title,
      description: formData.description,
      url: '', // Will be updated if video is re-uploaded
      subjectId: formData.subjectId,
      topicId: formData.topicId,
      duration: formData.duration,
      isPreview: formData.isPreview,
      orderIndex: formData.orderIndex
    };

    this.videoService.updateVideo(this.videoId, updatedVideo).subscribe({
      next: (video) => {
        if (this.thumbnailFile && video.id) {
          this.uploadThumbnail(video.id);
        } else if (this.videoFile && video.id) {
          // Re-upload video if new file selected
          this.reuploadVideo(video.id);
        } else {
          this.handleSuccess('Video updated successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to update video. Please try again.';
        this.loading = false;
        console.error('Error updating video:', err);
      }
    });
  }

  reuploadVideo(videoId: string): void {
    if (!this.videoFile) return;

    const formData = this.videoForm.value;

    this.videoService.uploadVideo(
      this.videoFile,
      formData.topicId,
      formData.title,
      formData.description,
      formData.duration,
      formData.isPreview
    ).subscribe({
      next: () => {
        if (this.thumbnailFile) {
          this.uploadThumbnail(videoId);
        } else {
          this.handleSuccess('Video re-uploaded successfully!');
        }
      },
      error: (err) => {
        this.error = 'Failed to re-upload video';
        this.loading = false;
        console.error('Error re-uploading video:', err);
      }
    });
  }

  uploadThumbnail(videoId: string): void {
    if (!this.thumbnailFile) return;

    this.videoService.uploadThumbnail(videoId, this.thumbnailFile).subscribe({
      next: () => {
        this.handleSuccess(
          this.isEditMode ? 'Video updated with new thumbnail!' : 'Video uploaded with thumbnail!'
        );
      },
      error: (err) => {
        this.error = 'Video saved, but thumbnail upload failed.';
        this.loading = false;
        console.error('Error uploading thumbnail:', err);
      }
    });
  }

  handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;

    setTimeout(() => {
      this.router.navigate(['/videos']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/videos']);
  }

  // Form getters
  get title() { return this.videoForm.get('title'); }
  get description() { return this.videoForm.get('description'); }
  get subjectId() { return this.videoForm.get('subjectId'); }
  get topicId() { return this.videoForm.get('topicId'); }
  get duration() { return this.videoForm.get('duration'); }
}

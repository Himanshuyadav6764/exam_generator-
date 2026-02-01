import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { Router } from '@angular/router';

interface Subcontent {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  videoFileName?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  mcqCount?: number;
  mcqQuestions?: any[];
  status: 'pending' | 'uploading' | 'completed';
}

interface Topic {
  id: string;
  name: string;
  description: string;
  subcontents: Subcontent[];
  expanded: boolean;
}

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {
  // Step 1: Course Basic Info
  course = {
    title: '',
    description: '',
    instructorEmail: '',
    instructorName: '',
    category: '',
    difficulty: 'BEGINNER',
    thumbnail: '',
    status: 'DRAFT',
    topics: [] as any[]
  };

  courseId: string | null = null;
  currentStep: 'course' | 'topics' | 'publish' = 'course';
  
  // Topics
  topics: Topic[] = [];
  topicInput = '';
  topicDescriptionInput = '';
  selectedTopicId: string | null = null;
  
  // Subcontent
  subcontentInput = '';
  subcontentDescriptionInput = '';
  
  // File uploads
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  uploadingFile = false;
  
  // Messages
  message = '';
  errorMessage = '';
  
  // UI State
  showTopicForm = false;
  showSubcontentForm = false;
  uploadProgress = 0;
  showAIQuizGenerator = false;
  selectedTopicForQuiz: Topic | null = null;

  constructor(
    private courseService: CourseService,
    private cloudinaryService: CloudinaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Read from localStorage keys set by auth.service
    const email = localStorage.getItem('email') || '';
    const fullName = localStorage.getItem('fullName') || '';
    const role = localStorage.getItem('role') || '';
    
    console.log('Current user:', { email, fullName, role });
    
    this.course.instructorEmail = email;
    this.course.instructorName = fullName;
  }

  // ============ STEP 1: CREATE COURSE ============
  
  onThumbnailSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.thumbnailFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async createCourse(): Promise<void> {
    if (!this.course.title || !this.course.description || !this.course.category) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.uploadingFile = true;
    this.message = 'Creating course...';

    try {
      // Upload thumbnail if selected
      if (this.thumbnailFile) {
        this.message = 'Uploading thumbnail...';
        const response: any = await this.cloudinaryService.uploadImage(
          this.thumbnailFile,
          'course-thumbnails'
        ).toPromise();
        this.course.thumbnail = response.url;
      }

      // Create course in database
      const response: any = await this.courseService.createCourse(this.course).toPromise();
      this.courseId = response.id;
      this.message = '✅ Course created! Now add topics.';
      setTimeout(() => this.message = '', 3000);
      this.currentStep = 'topics';
      
    } catch (error: any) {
      this.errorMessage = 'Failed to create course: ' + (error?.error?.error || error?.error?.message || error?.message || 'Unknown error');
      setTimeout(() => this.errorMessage = '', 5000);
      console.error('Course creation error:', error);
      console.error('Error status:', error?.status);
      console.error('Error details:', error?.error);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      console.log('Token exists:', !!token);
      console.log('User role:', role);
      
      if (error?.status === 403) {
        this.errorMessage = 'Access denied. You must be logged in as an INSTRUCTOR. Current role: ' + role;
      }
    } finally {
      this.uploadingFile = false;
    }
  }

  // ============ STEP 2: MANAGE TOPICS ============
  
  toggleTopicForm(): void {
    this.showTopicForm = !this.showTopicForm;
    if (!this.showTopicForm) {
      this.topicInput = '';
      this.topicDescriptionInput = '';
    }
  }

  async addTopic(): Promise<void> {
    if (!this.topicInput.trim() || !this.courseId) return;

    const newTopic: Topic = {
      id: Date.now().toString(),
      name: this.topicInput.trim(),
      description: this.topicDescriptionInput.trim(),
      subcontents: [],
      expanded: false
    };

    this.topics.push(newTopic);
    this.topicInput = '';
    this.topicDescriptionInput = '';
    this.showTopicForm = false;
    
    // Save to backend
    await this.updateCourseTopics();
    
    // Auto-expand the new topic and show AI Quiz Generator
    newTopic.expanded = true;
    this.selectedTopicForQuiz = newTopic;
    this.showAIQuizGenerator = true;
  }

  async updateCourseTopics(): Promise<void> {
    if (!this.courseId) return;
    
    try {
      const topicNames = this.topics.map(t => t.name);
      await this.courseService.updateCourse(this.courseId, { 
        topics: topicNames 
      }).toPromise();
    } catch (error) {
      console.error('Failed to update topics', error);
    }
  }

  deleteTopic(topicId: string): void {
    this.topics = this.topics.filter(t => t.id !== topicId);
    this.updateCourseTopics();
  }

  toggleTopicExpand(topicId: string): void {
    const topic = this.topics.find(t => t.id === topicId);
    if (topic) {
      topic.expanded = !topic.expanded;
      this.selectedTopicId = topic.expanded ? topicId : null;
    }
  }

  // ============ STEP 3: MANAGE SUBCONTENTS ============
  
  toggleSubcontentForm(topicId: string): void {
    this.selectedTopicId = topicId;
    this.showSubcontentForm = !this.showSubcontentForm;
    if (!this.showSubcontentForm) {
      this.subcontentInput = '';
      this.subcontentDescriptionInput = '';
    }
  }

  openAIQuizGenerator(topic: Topic): void {
    this.selectedTopicForQuiz = topic;
    this.showAIQuizGenerator = true;
  }

  closeAIQuizGenerator(): void {
    this.showAIQuizGenerator = false;
    this.selectedTopicForQuiz = null;
  }

  addSubcontent(topicId: string): void {
    if (!this.subcontentInput.trim()) return;

    const topic = this.topics.find(t => t.id === topicId);
    if (!topic) return;

    const newSubcontent: Subcontent = {
      id: Date.now().toString(),
      name: this.subcontentInput.trim(),
      description: this.subcontentDescriptionInput.trim(),
      status: 'pending'
    };

    topic.subcontents.push(newSubcontent);
    this.subcontentInput = '';
    this.subcontentDescriptionInput = '';
    this.showSubcontentForm = false;
  }

  async uploadVideo(topicId: string, subcontentId: string, event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    const topic = this.topics.find(t => t.id === topicId);
    const subcontent = topic?.subcontents.find(s => s.id === subcontentId);
    if (!subcontent) return;

    subcontent.status = 'uploading';
    this.uploadingFile = true;
    
    try {
      const response: any = await this.cloudinaryService.uploadVideo(file, 'course-videos').toPromise();
      subcontent.videoUrl = response.url;
      subcontent.videoFileName = file.name;
      subcontent.status = 'completed';
      this.message = '✅ Video uploaded successfully';
      setTimeout(() => this.message = '', 3000);
    } catch (error: any) {
      subcontent.status = 'pending';
      this.errorMessage = 'Video upload failed: ' + (error?.error?.error || error?.message || 'Unknown error');
      setTimeout(() => this.errorMessage = '', 5000);
      console.error('Video upload error:', error);
    } finally {
      this.uploadingFile = false;
    }
  }

  async uploadPDF(topicId: string, subcontentId: string, event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    const topic = this.topics.find(t => t.id === topicId);
    const subcontent = topic?.subcontents.find(s => s.id === subcontentId);
    if (!subcontent) return;

    subcontent.status = 'uploading';
    this.uploadingFile = true;
    
    try {
      const response: any = await this.cloudinaryService.uploadPdf(file, 'course-pdfs').toPromise();
      subcontent.pdfUrl = response.url;
      subcontent.pdfFileName = file.name;
      subcontent.status = 'completed';
      this.message = '✅ PDF uploaded successfully';
      setTimeout(() => this.message = '', 3000);
    } catch (error: any) {
      subcontent.status = 'pending';
      this.errorMessage = 'PDF upload failed: ' + (error?.error?.error || error?.message || 'Unknown error');
      setTimeout(() => this.errorMessage = '', 5000);
      console.error('PDF upload error:', error);
    } finally {
      this.uploadingFile = false;
    }
  }

  openMCQForm(topicId: string, subcontentId: string): void {
    // TODO: Open MCQ creation modal/form
    alert('MCQ form will open here');
  }

  deleteSubcontent(topicId: string, subcontentId: string): void {
    const topic = this.topics.find(t => t.id === topicId);
    if (topic) {
      topic.subcontents = topic.subcontents.filter(s => s.id !== subcontentId);
    }
  }

  // Progress tracking removed - focus on content upload only

  // ============ STEP 4: PUBLISH ============
  
  goToPublishStep(): void {
    this.currentStep = 'publish';
  }

  async publishCourse(): Promise<void> {
    if (!this.courseId) {
      this.errorMessage = 'No course ID found. Please create a course first.';
      return;
    }

    this.uploadingFile = true;
    this.message = 'Publishing course...';

    try {
      // First update course with topics and subcontents
      const courseData = {
        id: this.courseId,
        topics: this.topics.map(t => t.name),
        topicSubcontents: this.buildTopicSubcontents()
      };
      
      await this.courseService.updateCourse(this.courseId, courseData).toPromise();
      
      // Then publish it
      await this.courseService.publishCourse(this.courseId).toPromise();
      
      this.message = '✅ Course published successfully!';
      this.uploadingFile = false;
      
      setTimeout(() => {
        this.router.navigate(['/instructor-dashboard']);
      }, 2000);
    } catch (error: any) {
      this.uploadingFile = false;
      this.errorMessage = 'Failed to publish: ' + (error?.error?.message || error?.message || 'Unknown error');
      console.error('Publish error:', error);
    }
  }

  private buildTopicSubcontents(): any {
    const topicSubcontents: any = {};
    
    this.topics.forEach(topic => {
      topicSubcontents[topic.name] = topic.subcontents.map(sc => ({
        name: sc.name,
        description: sc.description,
        videoUrls: sc.videoUrl ? [sc.videoUrl] : [],
        videoFileNames: sc.videoFileName ? [sc.videoFileName] : [],
        pdfUrls: sc.pdfUrl ? [sc.pdfUrl] : [],
        pdfFileNames: sc.pdfFileName ? [sc.pdfFileName] : [],
        mcqCount: sc.mcqCount || 0
      }));
    });
    
    return topicSubcontents;
  }

  getTotalVideos(): number {
    return this.topics.reduce((sum, t) => 
      sum + t.subcontents.filter(s => s.videoUrl).length, 0
    );
  }

  getTotalPDFs(): number {
    return this.topics.reduce((sum, t) => 
      sum + t.subcontents.filter(s => s.pdfUrl).length, 0
    );
  }

  getTotalMCQs(): number {
    return this.topics.reduce((sum, t) => 
      sum + t.subcontents.reduce((s, sc) => s + (sc.mcqCount || 0), 0), 0
    );
  }

  getTotalSubcontents(): number {
    return this.topics.reduce((sum, t) => sum + t.subcontents.length, 0);
  }

  cancelCreation(): void {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      this.router.navigate(['/instructor-dashboard']);
    }
  }
}

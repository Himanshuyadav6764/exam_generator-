import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MCQService, MCQ } from '../../services/mcq.service';
import { CourseService } from '../../services/course.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mcq-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mcq-management.component.html',
  styleUrl: './mcq-management.component.css'
})
export class McqManagementComponent implements OnInit {
  courseId: string = '';
  courseName: string = '';
  courseTopics: string[] = [];
  
  // MCQ Form
  mcq: MCQ = {
    courseId: '',
    topicId: '',
    topicName: '', // Add topicName field
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    difficulty: 'BEGINNER',
    points: 10,
    explanation: ''
  };
  
  mcqList: MCQ[] = [];
  isEditMode = false;
  editingMcqId: string = '';
  
  // Filters
  filterDifficulty: string = 'ALL';
  filterTopic: string = 'ALL';
  
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcqService: MCQService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      this.mcq.courseId = this.courseId; // Set courseId in mcq object
      this.loadCourseDetails();
      this.loadMCQs();
    });
  }

  loadCourseDetails(): void {
    this.courseService.getCourseById(this.courseId).subscribe(
      (course: any) => {
        console.log('Loaded course:', course);
        console.log('Course topics:', course.topics);
        this.courseName = course.title;
        this.courseTopics = course.topics || [];
        console.log('Assigned courseTopics:', this.courseTopics);
        
        if (this.courseTopics.length === 0) {
          this.errorMessage = '⚠️ This course has no topics. Please add topics to the course first before creating MCQs.';
        }
      },
      (error: any) => {
        console.error('Error loading course:', error);
        this.errorMessage = 'Failed to load course details. Please try again.';
      }
    );
  }

  loadMCQs(): void {
    // Load all MCQs - we'll filter by course in the component if needed
    this.mcqService.getAllMCQs().subscribe({
      next: (mcqs: MCQ[]) => {
        console.log('Loaded MCQs:', mcqs);
        this.mcqList = mcqs || []; // Handle null/undefined
        // Clear error message if MCQs loaded successfully
        if (this.errorMessage === 'Failed to load MCQs. Please check if you are logged in.') {
          this.errorMessage = '';
        }
        // Show info message if no MCQs exist
        if (this.mcqList.length === 0 && !this.errorMessage) {
          console.log('No MCQs found in database');
        }
      },
      error: (error: any) => {
        console.error('Error loading MCQs:', error);
        // Don't show error for empty list - just set to empty array
        this.mcqList = [];
        // Only show error for actual failures, not just empty list
        if (error.status === 401) {
          this.errorMessage = 'Please log in to access MCQs.';
        } else if (error.status !== 404) {
          console.warn('MCQ loading issue (non-critical):', error.status);
        }
      }
    });
  }

  getFilteredMCQs(): MCQ[] {
    return this.mcqList.filter(mcq => {
      const difficultyMatch = this.filterDifficulty === 'ALL' || mcq.difficulty === this.filterDifficulty;
      const topicMatch = this.filterTopic === 'ALL' || mcq.topicId === this.filterTopic;
      return difficultyMatch && topicMatch;
    });
  }

  onDifficultyChange(): void {
    // Auto-set points based on difficulty
    if (this.mcq.difficulty === 'BEGINNER') {
      this.mcq.points = 10;
    } else if (this.mcq.difficulty === 'INTERMEDIATE') {
      this.mcq.points = 15;
    } else if (this.mcq.difficulty === 'ADVANCED') {
      this.mcq.points = 20;
    }
  }

  onTopicChange(): void {
    // Topic change event handler - difficulty can be set manually
  }

  saveMCQ(): void {
    console.log('🔍 saveMCQ called');
    console.log('🔍 courseId from component:', this.courseId);
    console.log('🔍 mcq object before validation:', JSON.stringify(this.mcq, null, 2));
    
    if (!this.validateMCQ()) {
      console.log('❌ Validation failed');
      return;
    }

    // Ensure courseId and topicName are set before submitting
    this.mcq.courseId = this.courseId;
    this.mcq.topicName = this.mcq.topicId; // Set topicName from topicId (they're the same from dropdown)
    console.log('✅ courseId set:', this.mcq.courseId);
    console.log('✅ topicName set:', this.mcq.topicName);
    console.log('📤 Sending MCQ:', JSON.stringify(this.mcq, null, 2));
    
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.editingMcqId) {
      this.mcqService.updateMCQ(this.editingMcqId, this.mcq).subscribe({
        next: (response) => {
          this.successMessage = 'MCQ updated successfully!';
          this.loadMCQs();
          this.resetForm();
          this.submitting = false;
        },
        error: (error: any) => {
          console.error('Update MCQ error:', error);
          this.errorMessage = 'Failed to update MCQ: ' + (error.error || error.message || 'Unknown error');
          this.submitting = false;
        }
      });
    } else {
      console.log('Creating MCQ:', this.mcq);
      this.mcqService.createMCQ(this.mcq).subscribe({
        next: (response) => {
          console.log('MCQ created successfully:', response);
          this.successMessage = 'MCQ created successfully!';
          this.loadMCQs();
          this.resetForm();
          this.submitting = false;
        },
        error: (error: any) => {
          console.error('Create MCQ error:', error);
          this.errorMessage = 'Failed to create MCQ: ' + (error.error || error.message || 'Unknown error');
          this.submitting = false;
        }
      });
    }
  }

  validateMCQ(): boolean {
    console.log('🔍 Validating MCQ...');
    
    if (!this.mcq.question.trim()) {
      console.log('❌ Question validation failed');
      this.errorMessage = 'Question is required';
      return false;
    }

    for (let i = 0; i < 4; i++) {
      if (!this.mcq.options[i].trim()) {
        console.log(`❌ Option ${i + 1} validation failed`);
        this.errorMessage = `Option ${i + 1} is required`;
        return false;
      }
    }

    if (!this.mcq.topicId) {
      console.log('❌ TopicId validation failed - topicId:', this.mcq.topicId);
      this.errorMessage = 'Topic is required';
      return false;
    }

    console.log('✅ Validation passed');
    return true;
  }

  editMCQ(mcq: MCQ): void {
    this.isEditMode = true;
    this.editingMcqId = mcq.id || '';
    this.mcq = { ...mcq };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteMCQ(id: string): void {
    if (confirm('Are you sure you want to delete this MCQ?')) {
      this.mcqService.deleteMCQ(id).subscribe(
        () => {
          this.successMessage = 'MCQ deleted successfully!';
          this.loadMCQs();
        },
        (error: any) => {
          this.errorMessage = 'Failed to delete MCQ';
        }
      );
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingMcqId = '';
    this.mcq = {
      courseId: this.courseId, // Preserve courseId
      topicId: '',
      topicName: '', // Reset topicName
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      difficulty: 'BEGINNER',
      points: 10,
      explanation: ''
    };
  }

  createMockTest(): void {
    if (this.mcqList.length === 0) {
      alert('Please create some MCQs first before creating a mock test');
      return;
    }
    this.router.navigate(['/instructor/mock-test/create', this.courseId]);
  }

  goBack(): void {
    this.router.navigate(['/instructor/courses']);
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MCQService, MCQ } from '../../services/mcq.service';
import { TopicService, Topic } from '../../services/topic.service';
import { SubjectService, Subject } from '../../services/subject.service';

@Component({
  selector: 'app-mcq-form',
  templateUrl: './mcq-form.component.html',
  styleUrls: ['./mcq-form.component.css']
})
export class MCQFormComponent implements OnInit {
  mcqForm: FormGroup;
  isEditMode = false;
  mcqId: string | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  subjects: Subject[] = [];
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];

  currentUserRole: string | null = null;
  userEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private mcqService: MCQService,
    private topicService: TopicService,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.mcqForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      subjectId: ['', Validators.required],
      topicId: ['', Validators.required],
      option1: ['', [Validators.required, Validators.maxLength(200)]],
      option2: ['', [Validators.required, Validators.maxLength(200)]],
      option3: ['', [Validators.required, Validators.maxLength(200)]],
      option4: ['', [Validators.required, Validators.maxLength(200)]],
      correctAnswerIndex: ['', Validators.required],
      explanation: ['', [Validators.maxLength(1000)]],
      points: [1, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.currentUserRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');

    this.loadSubjects();

    this.mcqId = this.route.snapshot.paramMap.get('id');
    if (this.mcqId) {
      this.isEditMode = true;
      this.loadMCQ();
    }

    this.mcqForm.get('subjectId')?.valueChanges.subscribe(subjectId => {
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
      this.mcqForm.patchValue({ topicId: '' });
      return;
    }

    this.topicService.getTopicsBySubject(subjectId).subscribe({
      next: (topics) => {
        this.filteredTopics = topics;
        const currentTopicId = this.mcqForm.get('topicId')?.value;
        if (currentTopicId && !topics.find(t => t.id === currentTopicId)) {
          this.mcqForm.patchValue({ topicId: '' });
        }
      },
      error: (err) => {
        this.error = 'Failed to load topics';
        console.error('Error loading topics:', err);
      }
    });
  }

  loadMCQ(): void {
    if (!this.mcqId) return;

    this.loading = true;
    this.error = null;

    this.mcqService.getMCQById(this.mcqId).subscribe({
      next: (mcq) => {
        this.mcqForm.patchValue({
          question: mcq.question,
          subjectId: mcq.subjectId,
          topicId: mcq.topicId,
          option1: mcq.options[0],
          option2: mcq.options[1],
          option3: mcq.options[2],
          option4: mcq.options[3],
          correctAnswerIndex: mcq.correctAnswerIndex.toString(),
          explanation: mcq.explanation,
          points: mcq.points
        });

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load MCQ details';
        this.loading = false;
        console.error('Error loading MCQ:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.mcqForm.invalid) {
      Object.keys(this.mcqForm.controls).forEach(key => {
        const control = this.mcqForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.isEditMode && this.mcqId) {
      this.updateMCQ();
    } else {
      this.createMCQ();
    }
  }

  createMCQ(): void {
    const formData = this.mcqForm.value;

    const newMCQ: MCQ = {
      question: formData.question,
      options: [
        formData.option1,
        formData.option2,
        formData.option3,
        formData.option4
      ],
      correctAnswerIndex: parseInt(formData.correctAnswerIndex),
      explanation: formData.explanation,
      topicId: formData.topicId,
      subjectId: formData.subjectId,
      points: formData.points
    };

    this.mcqService.createMCQ(newMCQ).subscribe({
      next: () => {
        this.handleSuccess('MCQ created successfully!');
      },
      error: (err) => {
        this.error = 'Failed to create MCQ. Please try again.';
        this.loading = false;
        console.error('Error creating MCQ:', err);
      }
    });
  }

  updateMCQ(): void {
    if (!this.mcqId) return;

    const formData = this.mcqForm.value;

    const updatedMCQ: MCQ = {
      question: formData.question,
      options: [
        formData.option1,
        formData.option2,
        formData.option3,
        formData.option4
      ],
      correctAnswerIndex: parseInt(formData.correctAnswerIndex),
      explanation: formData.explanation,
      topicId: formData.topicId,
      subjectId: formData.subjectId,
      points: formData.points
    };

    this.mcqService.updateMCQ(this.mcqId, updatedMCQ).subscribe({
      next: () => {
        this.handleSuccess('MCQ updated successfully!');
      },
      error: (err) => {
        this.error = 'Failed to update MCQ. Please try again.';
        this.loading = false;
        console.error('Error updating MCQ:', err);
      }
    });
  }

  handleSuccess(message: string): void {
    this.successMessage = message;
    this.loading = false;

    setTimeout(() => {
      this.router.navigate(['/mcqs']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/mcqs']);
  }

  // Form getters
  get question() { return this.mcqForm.get('question'); }
  get subjectId() { return this.mcqForm.get('subjectId'); }
  get topicId() { return this.mcqForm.get('topicId'); }
  get option1() { return this.mcqForm.get('option1'); }
  get option2() { return this.mcqForm.get('option2'); }
  get option3() { return this.mcqForm.get('option3'); }
  get option4() { return this.mcqForm.get('option4'); }
  get correctAnswerIndex() { return this.mcqForm.get('correctAnswerIndex'); }
  get explanation() { return this.mcqForm.get('explanation'); }
  get points() { return this.mcqForm.get('points'); }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TopicService, Topic, BulkTopicRequest } from '../../services/topic.service';
import { SubjectService, Subject } from '../../services/subject.service';

@Component({
  selector: 'app-topic-management',
  templateUrl: './topic-management.component.html',
  styleUrls: ['./topic-management.component.css']
})
export class TopicManagementComponent implements OnInit {
  subjectId: string | null = null;
  subject: Subject | null = null;
  topics: Topic[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Simple add mode
  newTopicName: string = '';

  // Edit mode
  editingTopicId: string | null = null;
  editingName: string = '';
  editingDescription: string = '';

  currentUserRole: string | null = null;
  userEmail: string | null = null;

  constructor(
    private topicService: TopicService,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');
    
    this.subjectId = this.route.snapshot.paramMap.get('subjectId');
    if (this.subjectId) {
      this.loadSubject();
      this.loadTopics();
    }
  }

  loadSubject(): void {
    if (!this.subjectId) return;

    this.subjectService.getSubjectById(this.subjectId).subscribe({
      next: (subject) => {
        this.subject = subject;
      },
      error: (err) => {
        this.error = 'Failed to load subject details';
        console.error('Error loading subject:', err);
      }
    });
  }

  loadTopics(): void {
    if (!this.subjectId) return;

    this.loading = true;
    this.error = null;

    this.topicService.getTopicsBySubject(this.subjectId).subscribe({
      next: (topics) => {
        this.topics = topics.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load topics. Please try again.';
        this.loading = false;
        console.error('Error loading topics:', err);
      }
    });
  }

  createTopic(name: string, description: string): void {
    if (!this.subjectId || !name.trim()) return;

    const newTopic: Topic = {
      name: name.trim(),
      description: description.trim(),
      subjectId: this.subjectId,
      difficulty: this.subject?.difficulty || 'BEGINNER',
      orderIndex: this.topics.length
    };

    this.loading = true;
    this.error = null;

    this.topicService.createTopic(newTopic).subscribe({
      next: (topic) => {
        this.topics.push(topic);
        this.successMessage = 'Topic created successfully!';
        this.clearSuccessMessage();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to create topic. Please try again.';
        this.loading = false;
        console.error('Error creating topic:', err);
      }
    });
  }

  // Simple add topic method
  addTopic(): void {
    if (!this.subjectId || !this.newTopicName.trim()) return;

    const newTopic: Topic = {
      name: this.newTopicName.trim(),
      description: '',
      subjectId: this.subjectId,
      difficulty: 'BEGINNER',
      orderIndex: this.topics.length
    };

    this.loading = true;
    this.error = null;

    this.topicService.createTopic(newTopic).subscribe({
      next: (topic) => {
        this.topics.push(topic);
        this.successMessage = 'Topic added successfully!';
        this.newTopicName = '';
        this.clearSuccessMessage();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to add topic. Please try again.';
        this.loading = false;
        console.error('Error adding topic:', err);
      }
    });
  }

  startEdit(topic: Topic): void {
    this.editingTopicId = topic.id || null;
    this.editingName = topic.name;
    this.editingDescription = topic.description || '';
  }

  cancelEdit(): void {
    this.editingTopicId = null;
    this.editingName = '';
    this.editingDescription = '';
  }

  saveEdit(): void {
    if (!this.editingTopicId || !this.editingName.trim() || !this.subjectId) return;

    const updatedTopic: Topic = {
      name: this.editingName.trim(),
      description: this.editingDescription.trim(),
      subjectId: this.subjectId,
      difficulty: 'BEGINNER'
    };

    this.loading = true;
    this.error = null;

    this.topicService.updateTopic(this.editingTopicId, updatedTopic).subscribe({
      next: (topic) => {
        const index = this.topics.findIndex(t => t.id === topic.id);
        if (index !== -1) {
          this.topics[index] = topic;
        }
        this.successMessage = 'Topic updated successfully!';
        this.cancelEdit();
        this.clearSuccessMessage();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to update topic. Please try again.';
        this.loading = false;
        console.error('Error updating topic:', err);
      }
    });
  }

  deleteTopic(topicId: string): void {
    if (!confirm('Are you sure you want to delete this topic? All associated content will be removed.')) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.topicService.deleteTopic(topicId).subscribe({
      next: () => {
        this.topics = this.topics.filter(t => t.id !== topicId);
        this.successMessage = 'Topic deleted successfully!';
        this.clearSuccessMessage();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to delete topic. Please try again.';
        this.loading = false;
        console.error('Error deleting topic:', err);
      }
    });
  }

  viewTopicContent(topicId: string): void {
    this.router.navigate(['/topics', topicId, 'content']);
  }

  clearSuccessMessage(): void {
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  canManageTopics(): boolean {
    if (this.currentUserRole === 'ADMIN') return true;
    if (this.currentUserRole === 'INSTRUCTOR' && this.subject?.instructorEmail === this.userEmail) {
      return true;
    }
    return false;
  }

  goBack(): void {
    this.router.navigate(['/subjects', this.subjectId]);
  }
}

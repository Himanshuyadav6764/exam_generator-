import { Component, OnInit } from '@angular/core';
import { ContentService, GlobalStats } from '../../services/content.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats?: GlobalStats;
  isLoading: boolean = false;
  errorMessage: string = '';
  userRole: string = '';
  userEmail: string = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.userEmail = localStorage.getItem('email') || '';
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.contentService.getGlobalStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load statistics';
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  getPercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER': return '🌱';
      case 'INTERMEDIATE': return '🔥';
      case 'ADVANCED': return '⚡';
      default: return '';
    }
  }
}

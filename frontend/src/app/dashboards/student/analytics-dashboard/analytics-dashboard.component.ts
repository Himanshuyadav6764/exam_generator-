import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';
import { AdaptiveLearningService } from '../../../services/adaptive-learning.service';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

interface QuizPerformance {
  quizName: string;
  score: number;
  accuracy: number;
  timeTaken: string;
  difficulty: string;
  rank?: number;
  date: Date;
}

interface TopicPerformance {
  topic: string;
  score: number;
  attempts: number;
  accuracy: number;
  color: string;
}

interface SkillProgression {
  date: string;
  level: string;
  rating: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  
  studentEmail: string = '';
  loading: boolean = true;
  
  // Charts
  pieChart: any;
  lineChart: any;
  
  // Data
  topicPerformance: TopicPerformance[] = [];
  quizPerformance: QuizPerformance[] = [];
  skillProgression: SkillProgression[] = [];
  
  // Analytics Summary
  overallScore: number = 0;
  totalQuizzes: number = 0;
  averageAccuracy: number = 0;
  currentLevel: string = 'Beginner';
  topicsStudied: number = 0;
  
  // Strength & Weakness
  strongTopics: string[] = [];
  weakTopics: string[] = [];
  recommendedTopics: string[] = [];
  improvementTips: string[] = [];

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private adaptiveService: AdaptiveLearningService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentEmail = user.email;
      this.loadAnalyticsData();
    }
  }

  loadAnalyticsData(): void {
    this.loading = true;
    console.log('📊 Loading analytics for:', this.studentEmail);
    
    // Fetch overall progress from adaptive learning API
    this.adaptiveService.getAllCoursesProgress(this.studentEmail).subscribe({
      next: (response: any) => {
        console.log('✅ Analytics API Response:', response);
        const data = response.data || response;
        this.processAnalyticsData(data);
        this.loading = false;
        
        // Render charts after data is loaded
        setTimeout(() => {
          this.renderPieChart();
          this.renderLineChart();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error loading analytics:', error);
        this.loading = false;
        // Show empty state
      }
    });
  }

  processAnalyticsData(data: any): void {
    if (!data) {
      console.log('⚠️ No analytics data available');
      this.loading = false;
      return;
    }
    
    console.log('🔄 Processing analytics data:', data);
    
    // Extract summary stats (includes both AI and normal quizzes)
    this.overallScore = Math.round(data.overallScore || 0);
    this.totalQuizzes = data.totalQuizAttempts || 0; // This includes both AI and normal
    this.averageAccuracy = Math.round(data.averageAccuracy || 0);
    this.currentLevel = data.currentLevel || 'Beginner';
    this.topicsStudied = data.topicsStudied || 0;
    
    console.log('📈 Stats Summary:', {
      overallScore: this.overallScore,
      totalQuizzes: this.totalQuizzes,
      averageAccuracy: this.averageAccuracy,
      topicsStudied: this.topicsStudied,
      currentLevel: this.currentLevel
    });
    
    // Process topic-wise performance (includes both AI and normal quizzes)
    if (data.topicPerformance && Object.keys(data.topicPerformance).length > 0) {
      this.processTopicPerformance(data.topicPerformance);
    }
    
    // Process quiz attempts (includes both AI and normal quizzes)
    if (data.allQuizAttempts && data.allQuizAttempts.length > 0) {
      this.processQuizAttempts(data.allQuizAttempts);
    }
    
    // Identify strengths and weaknesses (based on all quiz types)
    this.identifyStrengthsWeaknesses();
    
    // Generate skill progression
    this.generateSkillProgression();
    
    // Generate improvement tips
    this.generateImprovementTips();
  }
  
  processTopicPerformance(topicPerformance: any): void {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    let colorIndex = 0;
    
    this.topicPerformance = [];
    
    Object.keys(topicPerformance).forEach(topic => {
      const perf = topicPerformance[topic];
      this.topicPerformance.push({
        topic: topic,
        score: Math.round(perf.averageScore || 0),
        attempts: perf.attempts || 0,
        accuracy: Math.round(perf.averageScore || 0),
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    });
    
    // Sort by score
    this.topicPerformance.sort((a, b) => b.score - a.score);
  }
  
  processQuizAttempts(attempts: any[]): void {
    this.quizPerformance = [];
    
    console.log(`📝 Processing ${attempts.length} quiz attempts (AI + Normal)`);
    
    let aiCount = 0;
    let normalCount = 0;
    
    attempts.forEach((attempt: any) => {
      const accuracy = (attempt.score / attempt.totalQuestions) * 100;
      const quizType = attempt.quizType || 'normal';
      
      if (quizType === 'ai') {
        aiCount++;
      } else {
        normalCount++;
      }
      
      this.quizPerformance.push({
        quizName: (attempt.topicName || 'Quiz') + (quizType === 'ai' ? ' (AI)' : ''),
        score: attempt.score,
        accuracy: Math.round(accuracy),
        timeTaken: this.formatTime(attempt.timeSpent || 0),
        difficulty: attempt.difficultyLevel || attempt.difficulty || 'MEDIUM',
        date: new Date(attempt.attemptedAt || attempt.attemptDate || Date.now())
      });
    });
    
    console.log(`✅ Quiz breakdown: ${normalCount} Normal + ${aiCount} AI = ${attempts.length} Total`);
    
    // Sort by date (most recent first)
    this.quizPerformance.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  identifyStrengthsWeaknesses(): void {
    if (this.topicPerformance.length === 0) {
      this.strongTopics = [];
      this.weakTopics = [];
      return;
    }
    
    this.strongTopics = this.topicPerformance
      .filter(t => t.score >= 75)
      .map(t => t.topic)
      .slice(0, 3);
      
    this.weakTopics = this.topicPerformance
      .filter(t => t.score < 60)
      .map(t => t.topic)
      .slice(0, 3);
  }
  
  processProgressData(progressData: any[]): void {
    if (!progressData || progressData.length === 0) {
      console.log('⚠️ No progress data available');
      this.loading = false;
      return;
    }
    
    // Process topic performance
    const topicMap = new Map<string, { score: number, attempts: number, correct: number, total: number }>();
    
    progressData.forEach(progress => {
      // Process topic mastery
      if (progress.topicMastery) {
        Object.keys(progress.topicMastery).forEach(topic => {
          const mastery = progress.topicMastery[topic];
          const existing = topicMap.get(topic) || { score: 0, attempts: 0, correct: 0, total: 0 };
          
          existing.score += mastery.averageScore || 0;
          existing.attempts += mastery.totalAttempts || 0;
          existing.correct += mastery.correctAnswers || 0;
          existing.total += existing.attempts;
          
          topicMap.set(topic, existing);
        });
      }
      
      // Process quiz attempts
      if (progress.quizAttempts && progress.quizAttempts.length > 0) {
        progress.quizAttempts.forEach((quiz: any) => {
          const accuracy = (quiz.score / quiz.totalQuestions) * 100;
          this.quizPerformance.push({
            quizName: quiz.quizTitle,
            score: quiz.score,
            accuracy: Math.round(accuracy),
            timeTaken: this.formatTime(quiz.timeSpent || 0),
            difficulty: quiz.difficulty,
            date: new Date(quiz.attemptedAt)
          });
        });
      }
      
      // Update overall stats
      this.overallScore = Math.max(this.overallScore, progress.overallScore || 0);
      this.totalQuizzes += progress.quizAttempts?.length || 0;
      this.currentLevel = progress.currentLevel || 'BEGINNER';
    });
    
    // Convert topic map to array
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
    let colorIndex = 0;
    
    topicMap.forEach((data, topic) => {
      const avgScore = data.attempts > 0 ? data.score / data.attempts : 0;
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      
      this.topicPerformance.push({
        topic: topic,
        score: Math.round(avgScore),
        attempts: data.attempts,
        accuracy: Math.round(accuracy),
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    });
    
    // Sort topics by score
    this.topicPerformance.sort((a, b) => b.score - a.score);
    
    // Identify strong and weak topics
    this.strongTopics = this.topicPerformance.filter(t => t.score >= 80).map(t => t.topic).slice(0, 3);
    this.weakTopics = this.topicPerformance.filter(t => t.score < 60).map(t => t.topic).slice(0, 3);
    
    // Calculate average accuracy
    if (this.topicPerformance.length > 0) {
      this.averageAccuracy = Math.round(
        this.topicPerformance.reduce((sum, t) => sum + t.accuracy, 0) / this.topicPerformance.length
      );
    }
    
    // Generate skill progression (mock data based on current level)
    this.generateSkillProgression();
    
    // Generate improvement tips
    this.generateImprovementTips();
  }

  loadMockData(): void {
    // Mock topic performance data
    this.topicPerformance = [
      { topic: 'Python Basics', score: 85, attempts: 5, accuracy: 88, color: '#FF6384' },
      { topic: 'Data Structures', score: 72, attempts: 4, accuracy: 75, color: '#36A2EB' },
      { topic: 'Algorithms', score: 68, attempts: 3, accuracy: 70, color: '#FFCE56' },
      { topic: 'Object Oriented', score: 90, attempts: 6, accuracy: 92, color: '#4BC0C0' },
      { topic: 'Web Development', score: 55, attempts: 2, accuracy: 60, color: '#9966FF' }
    ];
    
    // Mock quiz performance
    this.quizPerformance = [
      { quizName: 'Python Basics Quiz', score: 8, accuracy: 80, timeTaken: '12m 30s', difficulty: 'EASY', rank: 15, date: new Date('2025-11-25') },
      { quizName: 'Data Structures Quiz', score: 7, accuracy: 70, timeTaken: '15m 45s', difficulty: 'MEDIUM', rank: 22, date: new Date('2025-11-27') },
      { quizName: 'Algorithms Quiz', score: 6, accuracy: 60, timeTaken: '18m 20s', difficulty: 'HARD', rank: 30, date: new Date('2025-11-28') },
      { quizName: 'OOP Concepts Quiz', score: 9, accuracy: 90, timeTaken: '10m 15s', difficulty: 'MEDIUM', rank: 8, date: new Date('2025-11-29') },
      { quizName: 'Web Dev Quiz', score: 5, accuracy: 50, timeTaken: '20m 00s', difficulty: 'MEDIUM', rank: 45, date: new Date('2025-12-01') }
    ];
    
    this.overallScore = 75;
    this.totalQuizzes = 5;
    this.averageAccuracy = 72;
    this.currentLevel = 'INTERMEDIATE';
    
    this.strongTopics = ['Object Oriented', 'Python Basics'];
    this.weakTopics = ['Web Development', 'Algorithms'];
    
    this.generateSkillProgression();
    this.generateImprovementTips();
    
    setTimeout(() => {
      this.renderPieChart();
      this.renderLineChart();
    }, 100);
  }

  generateSkillProgression(): void {
    // Only generate progression if there's actual quiz data
    if (this.quizPerformance.length === 0) {
      this.skillProgression = [];
      return;
    }
    
    // Build progression from actual quiz attempts
    this.skillProgression = [];
    const quizzesByDate = new Map<string, number[]>();
    
    // Group quizzes by date
    this.quizPerformance.forEach(quiz => {
      const dateStr = new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!quizzesByDate.has(dateStr)) {
        quizzesByDate.set(dateStr, []);
      }
      quizzesByDate.get(dateStr)!.push(quiz.accuracy);
    });
    
    // Convert to progression data
    quizzesByDate.forEach((scores, date) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      let level = 'BEGINNER';
      
      if (avgScore >= 90) level = 'MASTERY';
      else if (avgScore >= 75) level = 'ADVANCED';
      else if (avgScore >= 50) level = 'INTERMEDIATE';
      
      this.skillProgression.push({
        date: date,
        level: level,
        rating: Math.round(avgScore)
      });
    });
    
    // Sort by date (newest last)
    this.skillProgression.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  generateImprovementTips(): void {
    this.improvementTips = [];
    
    if (this.averageAccuracy < 70) {
      this.improvementTips.push('📖 Review fundamental concepts before attempting quizzes');
      this.improvementTips.push('⏰ Spend more time on practice problems');
    }
    
    if (this.weakTopics.length > 0) {
      this.improvementTips.push(`🎯 Focus on improving: ${this.weakTopics.join(', ')}`);
    }
    
    if (this.currentLevel === 'BEGINNER') {
      this.improvementTips.push('🚀 Complete more quizzes to level up to Intermediate');
      this.improvementTips.push('💡 Watch all video lectures thoroughly');
    }
    
    if (this.strongTopics.length > 0) {
      this.improvementTips.push(`✨ Excellent work on: ${this.strongTopics.join(', ')}`);
    }
    
    this.recommendedTopics = this.weakTopics.length > 0 ? this.weakTopics : ['Continue with current topics'];
  }

  renderPieChart(): void {
    const canvas = document.getElementById('topicPieChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.topicPerformance.map(t => t.topic),
        datasets: [{
          label: 'Performance Score',
          data: this.topicPerformance.map(t => t.score),
          backgroundColor: this.topicPerformance.map(t => t.color),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 13,
                family: "'Poppins', sans-serif"
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, family: "'Poppins', sans-serif" },
            bodyFont: { size: 13, family: "'Poppins', sans-serif" },
            callbacks: {
              label: (context: any) => {
                const topic = this.topicPerformance[context.dataIndex];
                return [
                  `Score: ${topic.score}%`,
                  `Attempts: ${topic.attempts}`,
                  `Accuracy: ${topic.accuracy}%`
                ];
              }
            }
          }
        }
      }
    });
  }

  renderLineChart(): void {
    const canvas = document.getElementById('skillLineChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.skillProgression.map(s => s.date),
        datasets: [{
          label: 'Skill Rating',
          data: this.skillProgression.map(s => s.rating),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, family: "'Poppins', sans-serif" },
            bodyFont: { size: 13, family: "'Poppins', sans-serif" },
            callbacks: {
              label: (context: any) => {
                const skill = this.skillProgression[context.dataIndex];
                return [
                  `Rating: ${skill.rating}/100`,
                  `Level: ${skill.level}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 12,
                family: "'Poppins', sans-serif"
              },
              callback: (value: any) => value + '%'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: "'Poppins', sans-serif"
              },
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  getDifficultyClass(difficulty: string): string {
    switch(difficulty?.toUpperCase()) {
      case 'EASY': return 'difficulty-easy';
      case 'MEDIUM': return 'difficulty-medium';
      case 'HARD': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  }

  getLevelBadgeClass(level: string): string {
    switch(level?.toUpperCase()) {
      case 'BEGINNER': return 'level-beginner';
      case 'INTERMEDIATE': return 'level-intermediate';
      case 'ADVANCED': return 'level-advanced';
      case 'MASTERY': return 'level-mastery';
      default: return 'level-beginner';
    }
  }

  getRankClass(rank?: number): string {
    if (!rank) return '';
    if (rank <= 10) return 'rank-gold';
    if (rank <= 30) return 'rank-silver';
    return 'rank-bronze';
  }
}

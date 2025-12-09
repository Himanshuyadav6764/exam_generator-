import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdaptiveLearningService } from '../../../services/adaptive-learning.service';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin, Subscription } from 'rxjs';
import { RecommendationSyncService } from '../../../services/recommendation-sync.service';

// Register Chart.js components
Chart.register(...registerables);

interface PerformanceData {
  overallCompletion?: number;
  overallScore: number;
  totalTimeSpent?: number;
  currentDifficultyLevel?: string;
  currentLevel?: string;
  topicScores: { [key: string]: number };
  topicCompletion: { [key: string]: number };
  strengthWeakness?: { [key: string]: string };
  recommendedTopic?: string;
  recommendedDifficulty?: string;
  recommendationReason?: string;
  totalQuizzes: number;
  timeSpent?: number;
  recentActivity?: any[];
}

interface QuizHistory {
  topicName?: string;
  topic?: string;
  score: number;
  totalQuestions?: number;
  difficulty: string;
  timeSpent: number;
  attemptDate?: string;
  date?: string;
  percentage?: number;
}

@Component({
  selector: 'app-adaptive-panel',
  templateUrl: './adaptive-panel.component.html',
  styleUrls: ['./adaptive-panel.component.css']
})
export class AdaptivePanelComponent implements OnInit, AfterViewInit, OnDestroy {
  
  @ViewChild('progressChart') progressChartRef!: ElementRef<HTMLCanvasElement>;
  
  private recommendationSubscription?: Subscription;
  
  // Expose Math to template
  Math = Math;
  
  courseId: string = '';
  studentEmail: string = '';
  fullName: string = '';
  userInitials: string = 'ST';
  
  performanceData: PerformanceData | null = null;
  loading: boolean = true;
  error: string = '';
  
  // Published courses data
  publishedCourses: any[] = [];
  allCoursesProgress: any = null;
  
  // Chart data
  topicLabels: string[] = [];
  topicScoreData: number[] = [];
  topicCompletionData: number[] = [];
  progressChart: Chart | null = null;
  
  // Quiz history
  recentQuizzes: QuizHistory[] = [];
  
  // Recommended courses (from search)
  recommendedCourses: any[] = [];
  filteredRecommendations: any[] = [];
  loadingRecommendations: boolean = false;
  searchQuery: string = '';
  
  // Difficulty colors
  difficultyColors: { [key: string]: string } = {
    'BEGINNER': '#4ade80',
    'INTERMEDIATE': '#f59e0b',
    'ADVANCED': '#ef4444'
  };
  
  // Navigation state
  activeNav: string = 'dashboard';
  
  // Helper for String in template
  String = String;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adaptiveService: AdaptiveLearningService,
    private authService: AuthService,
    private courseService: CourseService,
    private http: HttpClient,
    private recommendationSync: RecommendationSyncService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.studentEmail = user.email;
      this.fullName = user.fullName || user.email.split('@')[0];
      this.userInitials = this.getInitials(this.fullName);
    }
    
    this.route.queryParams.subscribe(params => {
      this.courseId = params['courseId'] || '';
      if (!this.courseId) {
        this.loadAnyCourseData();
      } else {
        this.loadPerformanceData();
      }
    });
    
    // Load recommended courses
    this.loadCourseRecommendations();
    
    // Subscribe to recommendation updates
    this.recommendationSubscription = this.recommendationSync.recommendationAdded$.subscribe(() => {
      console.log('🔄 Recommendation added, reloading list...');
      this.loadCourseRecommendations();
    });
  }
  
  ngAfterViewInit(): void {
    // Chart will be initialized after data is loaded
  }
  
  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadAnyCourseData(): void {
    if (!this.studentEmail) {
      console.error('No student email found');
      this.showDemoData();
      return;
    }

    this.loading = true;
    this.error = '';

    // Fetch published courses and student progress in parallel
    forkJoin({
      courses: this.courseService.getPublishedCourses(),
      progress: this.adaptiveService.getAllCoursesProgress(this.studentEmail)
    }).subscribe({
      next: (result) => {
        console.log('Fetched data:', result);
        
        // Store published courses
        this.publishedCourses = result.courses;
        this.allCoursesProgress = result.progress.data;

        // Process and merge the data
        this.processRealCourseData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching course data:', err);
        this.error = 'Failed to load course data';
        this.showDemoData();
        this.loading = false;
      }
    });
  }

  processRealCourseData(): void {
    if (!this.allCoursesProgress || this.publishedCourses.length === 0) {
      this.showEmptyState();
      return;
    }

    // Create a map of course IDs to course data
    const courseMap = new Map();
    this.publishedCourses.forEach(course => {
      courseMap.set(course.id, course);
    });

    // Collect ONLY topics with actual quiz attempts (real data only)
    const topicScoreMap = new Map<string, number[]>();

    // Map performance data to topics - ONLY if they have scores
    if (this.allCoursesProgress.courseProgress) {
      this.allCoursesProgress.courseProgress.forEach((cp: any) => {
        const course = courseMap.get(cp.courseId);
        if (course && cp.topicScores) {
          Object.keys(cp.topicScores).forEach(topic => {
            const score = cp.topicScores[topic];
            // Only add if score exists and is greater than 0
            if (score && score > 0) {
              if (!topicScoreMap.has(topic)) {
                topicScoreMap.set(topic, []);
              }
              const scores = topicScoreMap.get(topic) || [];
              scores.push(score);
              topicScoreMap.set(topic, scores);
            }
          });
        }
      });
    }

    // Calculate average scores ONLY for topics with actual quiz attempts
    this.topicLabels = Array.from(topicScoreMap.keys());
    this.topicScoreData = this.topicLabels.map(topic => {
      const scores = topicScoreMap.get(topic) || [];
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });
    
    // Use scores as completion data
    this.topicCompletionData = [...this.topicScoreData];

    // Build performance data object
    this.performanceData = {
      overallScore: this.allCoursesProgress.overallScore || 0,
      currentLevel: this.determineLevel(this.allCoursesProgress.overallScore || 0),
      totalQuizzes: this.allCoursesProgress.totalQuizzes || 0,
      timeSpent: Math.round((this.allCoursesProgress.totalTimeSpent || 0) / 60), // Convert seconds to minutes
      topicScores: {},
      topicCompletion: {},
      recentActivity: []
    };

    // Populate topic scores
    this.topicLabels.forEach((topic, index) => {
      this.performanceData!.topicScores[topic] = this.topicScoreData[index];
      this.performanceData!.topicCompletion[topic] = this.topicScoreData[index];
    });

    // Generate recommendation from weakest topic
    this.generateRecommendation();

    // Generate quiz history from REAL quiz attempts only
    this.recentQuizzes = [];
    if (this.allCoursesProgress.courseProgress) {
      this.allCoursesProgress.courseProgress.forEach((cp: any) => {
        const course = courseMap.get(cp.courseId);
        if (course && cp.quizAttempts && Array.isArray(cp.quizAttempts)) {
          // Use actual quiz attempts from database
          cp.quizAttempts.forEach((attempt: any) => {
            if (attempt.topicName && attempt.score > 0) {
              this.recentQuizzes.push({
                topic: attempt.topicName,
                score: Math.round((attempt.score / (attempt.totalQuestions || 1)) * 100),
                date: attempt.attemptDate ? new Date(attempt.attemptDate).toLocaleDateString() : 'N/A',
                difficulty: attempt.difficultyLevel || 'BEGINNER',
                timeSpent: Math.round((attempt.timeSpent || 0) / 60) // Convert seconds to minutes
              });
            }
          });
        }
      });
    }

    // Sort by most recent and limit to 10
    this.recentQuizzes = this.recentQuizzes.slice(0, 10);

    // Initialize chart with real data
    setTimeout(() => this.initializeChart(), 100);
  }

  determineLevel(score: number): string {
    if (score >= 80) return 'ADVANCED';
    if (score >= 50) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  generateRecommendation(): void {
    if (!this.performanceData || this.topicLabels.length === 0) {
      return;
    }

    // Find weakest topic (lowest score)
    let weakestTopic = '';
    let weakestScore = 100;

    this.topicLabels.forEach((topic, index) => {
      const score = this.topicScoreData[index];
      if (score < weakestScore) {
        weakestScore = score;
        weakestTopic = topic;
      }
    });

    // If no quiz attempts yet, recommend first course
    if (weakestScore === 0 && this.publishedCourses.length > 0) {
      const firstCourse = this.publishedCourses[0];
      this.performanceData.recommendedTopic = firstCourse.topics?.[0] || firstCourse.title;
      this.performanceData.recommendedDifficulty = firstCourse.difficulty || 'BEGINNER';
      this.performanceData.recommendationReason = `Start your learning journey with ${firstCourse.title}. This is a great foundation course.`;
      return;
    }

    // Recommend improvement on weak topic
    if (weakestTopic) {
      this.performanceData.recommendedTopic = weakestTopic;
      this.performanceData.recommendedDifficulty = weakestScore < 40 ? 'BEGINNER' : 'INTERMEDIATE';
      this.performanceData.recommendationReason = `Your current score in ${weakestTopic} is ${weakestScore}%. Focus on this topic to improve your overall performance.`;
    }
  }

  showEmptyState(): void {
    // Show empty state with no fake data
    this.performanceData = {
      overallScore: 0,
      currentLevel: 'BEGINNER',
      totalQuizzes: 0,
      timeSpent: 0,
      topicScores: {},
      topicCompletion: {},
      recentActivity: []
    };

    // Recommend first published course if available
    if (this.publishedCourses.length > 0) {
      const firstCourse = this.publishedCourses[0];
      this.performanceData.recommendedTopic = firstCourse.title;
      this.performanceData.recommendedDifficulty = firstCourse.difficulty || 'BEGINNER';
      this.performanceData.recommendationReason = `Start your learning journey with ${firstCourse.title}. Take quizzes to see your personalized recommendations.`;
    } else {
      this.performanceData.recommendedTopic = 'No courses available';
      this.performanceData.recommendedDifficulty = 'BEGINNER';
      this.performanceData.recommendationReason = 'Courses will appear here once published by instructors.';
    }

    this.topicLabels = [];
    this.topicScoreData = [];
    this.topicCompletionData = [];
    this.recentQuizzes = [];
    this.loading = false;
  }

  showDemoData(): void {
    // Redirect to empty state
    this.showEmptyState();
  }

  loadPerformanceData(): void {
    if (!this.courseId || !this.studentEmail) {
      this.showDemoData();
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.adaptiveService.getOverallProgress(this.studentEmail, this.courseId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.performanceData = response.progress;
          this.prepareChartData();
        } else {
          this.error = 'No performance data available yet. Complete some quizzes to see your progress!';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading performance:', err);
        this.error = 'Failed to load performance data';
        this.loading = false;
      }
    });
  }

  prepareChartData(): void {
    if (!this.performanceData) return;
    
    this.topicLabels = Object.keys(this.performanceData.topicScores);
    this.topicScoreData = Object.values(this.performanceData.topicScores);
    this.topicCompletionData = Object.values(this.performanceData.topicCompletion);
    
    // Initialize chart after data is prepared
    setTimeout(() => this.initializeChart(), 100);
  }
  
  initializeChart(): void {
    if (!this.progressChartRef || this.progressChart) return;
    
    const ctx = this.progressChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Create target proficiency array (all 85%)
    const targetData = this.topicLabels.map(() => 85);
    
    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: this.topicLabels,
        datasets: [{
          label: 'Your Proficiency',
          data: this.topicScoreData,
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(67, 97, 238, 1)',
          pointRadius: 4
        }, {
          label: 'Target Proficiency',
          data: targetData,
          backgroundColor: 'rgba(76, 201, 240, 0.2)',
          borderColor: 'rgba(76, 201, 240, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(76, 201, 240, 1)',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Topic-wise Strength Analysis',
            font: {
              size: 16
            }
          }
        }
      }
    };
    
    this.progressChart = new Chart(ctx, config);
  }
  
  setActiveNav(nav: string): void {
    this.activeNav = nav;
    console.log('Navigation clicked:', nav); // Debug log
    
    // Navigate based on selection
    switch(nav) {
      case 'courses':
        console.log('Navigating to /my-courses'); // Debug log
        this.router.navigate(['/my-courses']);
        break;
      case 'dashboard':
        // Stay on current page
        console.log('Staying on dashboard');
        break;
      case 'progress':
        // TODO: Navigate to progress tracking page
        console.log('Progress tracking - Coming soon');
        break;
      case 'assignments':
        // TODO: Navigate to assignments page
        console.log('Assignments - Coming soon');
        break;
      case 'settings':
        // TODO: Navigate to settings page
        console.log('Settings - Coming soon');
        break;
      case 'help':
        // TODO: Navigate to help page
        console.log('Help & Support - Coming soon');
        break;
    }
  }
  
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
  
  startLearning(): void {
    // Find the recommended course from published courses
    const recommendedCourse = this.publishedCourses.find(course => 
      course.title === this.performanceData?.recommendedTopic || 
      course.topics?.includes(this.performanceData?.recommendedTopic)
    );

    if (recommendedCourse) {
      this.router.navigate(['/learning-content'], { 
        queryParams: { 
          courseId: recommendedCourse.id,
          courseName: recommendedCourse.title
        } 
      });
    } else if (this.publishedCourses.length > 0) {
      // If not found, use first published course
      const firstCourse = this.publishedCourses[0];
      this.router.navigate(['/learning-content'], { 
        queryParams: { 
          courseId: firstCourse.id,
          courseName: firstCourse.title
        } 
      });
    } else {
      alert('No courses available for learning');
    }
  }
  
  viewAllQuizzes(): void {
    // Navigate to quizzes page
    this.router.navigate(['/my-courses']);
  }
  
  reviewQuiz(quiz: QuizHistory): void {
    // Navigate to quiz review
    console.log('Reviewing quiz:', quiz);
  }
  
  getDifficultyClass(difficulty: string): string {
    const d = difficulty.toUpperCase();
    if (d === 'BEGINNER') return 'beginner';
    if (d === 'INTERMEDIATE') return 'intermediate';
    if (d === 'ADVANCED') return 'advanced';
    return '';
  }

  getStrengthWeaknessClass(status: string): string {
    switch (status) {
      case 'STRONG': return 'strength-badge strong';
      case 'WEAK': return 'strength-badge weak';
      case 'MODERATE': return 'strength-badge moderate';
      default: return 'strength-badge';
    }
  }

  getStrengthWeaknessIcon(status: string): string {
    switch (status) {
      case 'STRONG': return '💪';
      case 'WEAK': return '📚';
      case 'MODERATE': return '📈';
      default: return '📊';
    }
  }

  getDifficultyColor(difficulty: string): string {
    return this.difficultyColors[difficulty] || '#9E9E9E';
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  refreshData(): void {
    // Clear existing data and reload
    this.loading = true;
    this.performanceData = null;
    this.topicLabels = [];
    this.topicScoreData = [];
    this.topicCompletionData = [];
    this.recentQuizzes = [];
    
    // Reload fresh data
    this.loadAnyCourseData();
  }

  hasStrongTopics(): boolean {
    if (!this.performanceData || !this.topicLabels || !this.performanceData.strengthWeakness) return false;
    return this.topicLabels.some(topic => this.performanceData?.strengthWeakness?.[topic] === 'STRONG');
  }

  hasModerateTopics(): boolean {
    if (!this.performanceData || !this.topicLabels || !this.performanceData.strengthWeakness) return false;
    return this.topicLabels.some(topic => this.performanceData?.strengthWeakness?.[topic] === 'MODERATE');
  }

  hasWeakTopics(): boolean {
    if (!this.performanceData || !this.topicLabels || !this.performanceData.strengthWeakness) return false;
    return this.topicLabels.some(topic => this.performanceData?.strengthWeakness?.[topic] === 'WEAK');
  }

  // Load course recommendations from search history
  loadCourseRecommendations(): void {
    this.loadingRecommendations = true;
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');

    if (!email || !token) {
      console.error('❌ No email or token found in localStorage');
      this.loadingRecommendations = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(`http://localhost:8081/api/student/${email}/recommendations`, { headers })
      .subscribe({
        next: (response) => {
          // Handle both array response and object with recommendations property
          this.recommendedCourses = Array.isArray(response) ? response : (response.recommendations || []);
          this.filteredRecommendations = [...this.recommendedCourses]; // Initialize filtered list
          this.loadingRecommendations = false;
          console.log('✅ Loaded recommended courses:', this.recommendedCourses.length);
        },
        error: (error) => {
          console.error('❌ Error loading recommendations:', error);
          this.loadingRecommendations = false;
          this.recommendedCourses = [];
          this.filteredRecommendations = [];
        }
      });
  }

  // Filter recommendations based on search query
  filterRecommendations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredRecommendations = [...this.recommendedCourses];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredRecommendations = this.recommendedCourses.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.instructorName?.toLowerCase().includes(query) ||
      course.subjects?.some((subject: string) => subject.toLowerCase().includes(query))
    );
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredRecommendations = [...this.recommendedCourses];
  }

  // Delete recommendation
  deleteRecommendation(event: Event, courseId: string): void {
    event.stopPropagation(); // Prevent card click

    if (!confirm('Remove this course from recommendations?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(`http://localhost:8081/api/student/${this.studentEmail}/recommendations/${courseId}`, { headers })
      .subscribe({
        next: () => {
          // Remove from both arrays
          this.recommendedCourses = this.recommendedCourses.filter(c => c.id !== courseId);
          this.filteredRecommendations = this.filteredRecommendations.filter(c => c.id !== courseId);
          console.log('✅ Recommendation removed successfully');
          
          // Show success message
          alert('Course removed from recommendations');
        },
        error: (error) => {
          console.error('❌ Error deleting recommendation:', error);
          alert('Failed to remove recommendation. Please try again.');
        }
      });
  }

  // Navigate to recommended course - directly to course content
  viewRecommendedCourse(courseId: string): void {
    this.router.navigate(['/course-enrolled', courseId]);
  }
  
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.recommendationSubscription) {
      this.recommendationSubscription.unsubscribe();
    }
  }
}

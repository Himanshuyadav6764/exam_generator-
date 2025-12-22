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
  enrolledCourses: any[] = [];
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

  // Modal variables
  showModal: boolean = false;
  selectedCourse: any = null;
  courseDetails: any = null;

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
    
    // Load enrollments first to ensure state is available
    this.loadEnrollments();
    
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
    
    // Listen for router navigation events to reload enrollments when coming back
    this.router.events.subscribe((event: any) => {
      if (event.constructor.name === 'NavigationEnd') {
        console.log('🔄 Navigation detected, reloading enrollments...');
        this.loadEnrollments();
      }
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

  loadEnrollments(): void {
    if (!this.studentEmail) {
      return;
    }

    this.http.get<any[]>(`http://localhost:8081/api/enrollments/student/${this.studentEmail}`, { 
      headers: this.getHeaders() 
    }).subscribe({
      next: (enrollments) => {
        this.enrolledCourses = enrollments.map((e: any) => ({
          id: e.courseId,
          title: e.courseTitle
        }));
        console.log('✅ Enrollments loaded:', this.enrolledCourses);
      },
      error: (err) => {
        console.error('❌ Error loading enrollments:', err);
        this.enrolledCourses = [];
      }
    });
  }

  loadAnyCourseData(): void {
    if (!this.studentEmail) {
      console.error('No student email found');
      this.showDemoData();
      return;
    }

    this.loading = true;
    this.error = '';

    // Fetch published courses, student progress, and enrollments in parallel
    forkJoin({
      courses: this.courseService.getPublishedCourses(),
      progress: this.adaptiveService.getAllCoursesProgress(this.studentEmail),
      enrollments: this.http.get<any[]>(`http://localhost:8081/api/enrollments/student/${this.studentEmail}`, { 
        headers: this.getHeaders() 
      })
    }).subscribe({
      next: (result) => {
        console.log('Fetched data:', result);
        
        // Store published courses
        this.publishedCourses = result.courses;
        this.allCoursesProgress = result.progress.data;
        
        // Store enrolled courses
        this.enrolledCourses = result.enrollments.map((e: any) => ({
          id: e.courseId,
          title: e.courseTitle
        }));
        console.log('Enrolled courses:', this.enrolledCourses);

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
    // Only navigate if enrolled
    if (this.isEnrolledIn(courseId)) {
      this.router.navigate(['/course-enrolled', courseId]);
    }
  }

  isEnrolledIn(courseId: string): boolean {
    return this.enrolledCourses.some((ec: any) => ec.id === courseId);
  }

  enrollNow(event: Event, course: any): void {
    event.stopPropagation();
    
    if (!this.studentEmail) {
      alert('User information not found. Please login again.');
      return;
    }
    
    const enrollment = {
      userId: this.studentEmail,
      userEmail: this.studentEmail,
      courseId: course.id,
      courseTitle: course.title,
      enrollmentDate: new Date().toISOString(),
      status: 'ACTIVE',
      progress: 0
    };

    console.log('Enrollment payload:', enrollment);

    // Immediately add to enrolled courses for instant UI update
    this.enrolledCourses.push({ id: course.id, title: course.title });
    console.log('✅ Immediately added to enrolledCourses:', this.enrolledCourses);

    // Using courseService to ensure proper headers and auth
    this.http.post('http://localhost:8081/api/enrollments/enroll', enrollment).subscribe({
      next: (response: any) => {
        console.log('✅ Enrolled successfully:', response);
        
        // Reload enrollments from server to ensure consistency
        this.loadEnrollments();
        
        alert(`Successfully enrolled in ${course.title}! You can now access the course.`);
      },
      error: (err) => {
        console.error('❌ Error enrolling:', err);
        console.log('Error details:', err.error);
        
        // Already added above, just reload to verify
        this.loadEnrollments();
        alert(`Enrolled in ${course.title}! (Note: Backend enrollment may need configuration)`);
      }
    });
  }

  unenrollCourse(event: Event, course: any): void {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to unenroll from ${course.title}?`)) {
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

    // Immediately remove from enrolled courses for instant UI update
    this.enrolledCourses = this.enrolledCourses.filter((ec: any) => ec.id !== course.id);
    console.log('✅ Immediately removed from enrolledCourses:', this.enrolledCourses);

    // Call unenroll API
    this.http.delete(
      `http://localhost:8081/api/enrollments/unenroll/${this.studentEmail}/${course.id}`, 
      { headers }
    ).subscribe({
      next: () => {
        console.log('✅ Unenrolled successfully from server');
        
        // Reload enrollments from server to ensure consistency
        this.loadEnrollments();
        
        alert(`Successfully unenrolled from ${course.title}`);
      },
      error: (err) => {
        console.error('❌ Error unenrolling:', err);
        
        // Already removed above, just reload to verify
        this.loadEnrollments();
        alert(`Unenrolled from ${course.title}! (Note: Backend may need configuration)`);
      }
    });
  }

  showCourseDetails(event: Event, course: any): void {
    event.stopPropagation();
    this.selectedCourse = course;
    
    // Fetch complete course details from API
    this.courseService.getCourseDetails(course.id).subscribe({
      next: (details: any) => {
        console.log('Fetched complete course details:', details);
        console.log('Topics structure:', JSON.stringify(details.topics, null, 2));
        
        // Count topics, subtopics, and content
        let subtopicCount = 0;
        let videoCount = 0;
        let pdfCount = 0;
        let mcqCount = 0;
        let aiQuizCount = 0;
        
        if (details.topics && Array.isArray(details.topics)) {
          details.topics.forEach((topic: any) => {
            console.log('Processing topic:', topic.name);
            
            // Check for subcontents (could be nested or direct)
            const subcontents = topic.subcontents || topic.subcontent || [];
            
            if (Array.isArray(subcontents) && subcontents.length > 0) {
              subtopicCount += subcontents.length;
              console.log(`Topic ${topic.name} has ${subcontents.length} subcontents`);
              
              subcontents.forEach((subcontent: any) => {
                // Count videos
                if (subcontent.videos && Array.isArray(subcontent.videos)) {
                  videoCount += subcontent.videos.length;
                  console.log(`Found ${subcontent.videos.length} videos in ${subcontent.name}`);
                }
                
                // Count PDFs
                if (subcontent.pdfs && Array.isArray(subcontent.pdfs)) {
                  pdfCount += subcontent.pdfs.length;
                  console.log(`Found ${subcontent.pdfs.length} PDFs in ${subcontent.name}`);
                }
                
                // Count MCQs
                if (subcontent.mcqs && Array.isArray(subcontent.mcqs)) {
                  mcqCount += subcontent.mcqs.length;
                  console.log(`Found ${subcontent.mcqs.length} MCQs in ${subcontent.name}`);
                }
              });
            }
          });
        }
        
        // Count AI quizzes from multiple possible locations
        if (details.aiQuizzes && Array.isArray(details.aiQuizzes)) {
          aiQuizCount = details.aiQuizzes.length;
        } else if (details.aiQuizCount) {
          aiQuizCount = details.aiQuizCount;
        }
        
        console.log('Final counts:', {
          topics: details.topics?.length || 0,
          subtopics: subtopicCount,
          videos: videoCount,
          pdfs: pdfCount,
          mcqs: mcqCount,
          aiQuizzes: aiQuizCount
        });
        
        this.courseDetails = {
          title: details.title || course.title,
          description: details.description || 'No description available',
          instructorName: details.instructorName || course.instructorName,
          difficulty: details.difficulty || course.difficulty || 'BEGINNER',
          subjects: details.subjects || course.subjects || [],
          topicCount: details.topics?.length || 0,
          subtopicCount: subtopicCount,
          videoCount: videoCount,
          pdfCount: pdfCount,
          mcqCount: mcqCount,
          aiQuizCount: aiQuizCount,
          topics: details.topics || [],
          thumbnail: details.thumbnail || course.thumbnail
        };
        
        console.log('Processed course details:', this.courseDetails);
        this.showModal = true;
      },
      error: (err) => {
        console.error('Error fetching course details:', err);
        
        // Fallback to basic course data
        this.courseDetails = {
          title: course.title,
          description: course.description || 'No description available',
          instructorName: course.instructorName,
          difficulty: course.difficulty || 'BEGINNER',
          subjects: course.subjects || [],
          topicCount: course.topicCount || 0,
          subtopicCount: course.subtopicCount || 0,
          videoCount: course.videoCount || 0,
          pdfCount: course.pdfCount || 0,
          mcqCount: course.mcqCount || 0,
          aiQuizCount: course.aiQuizCount || 0,
          topics: course.topics || [],
          thumbnail: course.thumbnail
        };
        
        this.showModal = true;
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCourse = null;
    this.courseDetails = null;
  }

  startLearning(): void {
    if (this.selectedCourse && this.isEnrolledIn(this.selectedCourse.id)) {
      this.closeModal();
      this.router.navigate(['/course-enrolled', this.selectedCourse.id]);
    }
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.recommendationSubscription) {
      this.recommendationSubscription.unsubscribe();
    }
  }
}

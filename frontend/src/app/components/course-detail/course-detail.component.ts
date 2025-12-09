import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: any = null;
  loading: boolean = true;
  error: string = '';
  fromAdaptive: boolean = false;
  
  // Expanded tracking
  expandedTopics: Set<string> = new Set();
  expandedWeeks: Set<number> = new Set();
  weeklyStructure: any[] = [];
  currentWeek: number = 1;
  totalWeeks: number = 0;
  activeTab: string = 'chapters';
  progressPercentage: number = 0;
  
  // Video player state
  showVideoPlayer: boolean = false;
  currentVideo: any = null;
  currentTopic: any = null;
  currentSubcontent: any = null;
  sidebarCollapsed: boolean = false;
  allVideos: any[] = [];
  currentVideoIndex: number = 0;
  currentContentType: string = 'videos'; // 'videos', 'articles', 'quizzes'
  
  // Notes section
  studentNotes: string = '';
  notesLoading: boolean = false;
  notesSaved: boolean = false;
  
  // Course completion metrics
  overallScore: number = 0;
  timeSpent: number = 0;
  totalQuizzes: number = 0;
  quizzesCompleted: number = 0;
  currentLevel: string = 'Beginner';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.courseId = params['id'];
      this.fromAdaptive = params['from'] === 'adaptive';
      
      if (this.courseId) {
        this.loadCourseDetails();
      } else {
        this.error = 'No course selected';
        this.loading = false;
      }
    });
  }

  loadCourseDetails(): void {
    this.loading = true;
    this.error = '';
    
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        console.log('📚 Course loaded:', course);
        console.log('📋 Topics:', course.topics);
        console.log('📦 TopicSubcontents:', course.topicSubcontents);
        
        // Debug each topic's subcontents
        if (course.topics && course.topicSubcontents) {
          course.topics.forEach((topic: string) => {
            const subcontents = course.topicSubcontents[topic];
            console.log(`📌 Topic "${topic}" has ${subcontents?.length || 0} subcontents:`, subcontents);
          });
        }
        
        this.organizeIntoWeeks();
        this.calculateProgress();
        this.loading = false;
        
        // Auto-expand current week
        if (this.weeklyStructure.length > 0) {
          this.expandedWeeks.add(this.currentWeek);
        }
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.error = 'Failed to load course details';
        this.loading = false;
      }
    });
  }

  organizeIntoWeeks(): void {
    if (!this.course || !this.course.topics || this.course.topics.length === 0) {
      this.weeklyStructure = [];
      return;
    }

    console.log('🔧 Organizing topics into weeks...');
    const topicsPerWeek = 3; // Distribute topics across weeks
    this.weeklyStructure = [];
    
    for (let i = 0; i < this.course.topics.length; i += topicsPerWeek) {
      const weekTopics = this.course.topics.slice(i, i + topicsPerWeek);
      const weekNumber = Math.floor(i / topicsPerWeek) + 1;
      
      const weekData: any = {
        weekNumber: weekNumber,
        topics: weekTopics.map((topicName: string) => {
          const subcontents = this.getSubcontents(topicName);
          
          const topicData = {
            name: topicName,
            videos: this.getTotalVideos(subcontents),
            articles: this.getTotalPDFs(subcontents),
            problems: this.calculateProblems(subcontents),
            mcqs: this.getTotalMCQs(subcontents),
            contests: this.calculateContests(subcontents),
            progress: Math.floor(Math.random() * 15), // Mock progress for now
            subcontents: subcontents
          };
          
          console.log(`📋 Topic "${topicName}":`, {
            videos: topicData.videos,
            pdfs: topicData.articles,
            mcqs: topicData.mcqs,
            subcontents: subcontents.length
          });
          
          return topicData;
        })
      };
      
      this.weeklyStructure.push(weekData);
    }
    
    this.totalWeeks = this.weeklyStructure.length;
    console.log(`✅ Created ${this.totalWeeks} weeks with structure:`, this.weeklyStructure);
  }

  calculateProblems(subcontents: any[]): number {
    // Count problems - can be customized based on your data structure
    return subcontents.reduce((sum, sc) => {
      const problemCount = (sc.problems?.length || 0) + Math.floor((sc.mcqs?.length || 0) * 0.5);
      return sum + problemCount;
    }, 0);
  }

  calculateContests(subcontents: any[]): number {
    // Contests - one per topic typically
    return subcontents.length > 0 ? 1 : 0;
  }

  toggleWeek(weekNumber: number): void {
    if (this.expandedWeeks.has(weekNumber)) {
      this.expandedWeeks.delete(weekNumber);
    } else {
      this.expandedWeeks.add(weekNumber);
    }
  }

  isWeekExpanded(weekNumber: number): boolean {
    return this.expandedWeeks.has(weekNumber);
  }

  calculateProgress(): void {
    if (this.course && this.course.topics) {
      const totalTopics = this.course.topics.length;
      const completedTopics = this.getCompletedTopics();
      this.progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      
      // Calculate metrics
      this.calculateCompletionMetrics();
    }
  }

  calculateCompletionMetrics(): void {
    // Calculate overall score based on progress
    this.overallScore = this.progressPercentage;
    
    // Calculate time spent (mock data - can be replaced with actual tracking)
    const topicsViewed = this.getCompletedTopics();
    this.timeSpent = topicsViewed * 15; // Assume 15 minutes per topic
    
    // Count total quizzes and completed quizzes
    this.totalQuizzes = 0;
    this.quizzesCompleted = 0;
    
    if (this.weeklyStructure) {
      this.weeklyStructure.forEach(week => {
        week.topics?.forEach((topic: any) => {
          if (topic.mcqs) {
            this.totalQuizzes += topic.mcqs;
            // Assume 30% of quizzes are completed
            this.quizzesCompleted += Math.floor(topic.mcqs * 0.3);
          }
        });
      });
    }
    
    // Determine current level based on progress
    if (this.progressPercentage < 25) {
      this.currentLevel = 'Beginner';
    } else if (this.progressPercentage < 50) {
      this.currentLevel = 'Elementary';
    } else if (this.progressPercentage < 75) {
      this.currentLevel = 'Intermediate';
    } else if (this.progressPercentage < 90) {
      this.currentLevel = 'Advanced';
    } else {
      this.currentLevel = 'Expert';
    }
  }

  toggleTopic(topicName: string): void {
    if (this.expandedTopics.has(topicName)) {
      this.expandedTopics.delete(topicName);
    } else {
      this.expandedTopics.add(topicName);
    }
  }

  isTopicExpanded(topicName: string): boolean {
    return this.expandedTopics.has(topicName);
  }

  getSubcontents(topicName: string): any[] {
    if (!this.course) {
      console.warn('⚠️ Course not loaded yet');
      return [];
    }
    
    if (!this.course.topicSubcontents) {
      console.warn('⚠️ No topicSubcontents in course:', this.course);
      return [];
    }
    
    const subcontents = this.course.topicSubcontents[topicName];
    if (!subcontents || subcontents.length === 0) {
      console.warn(`⚠️ No subcontents found for topic "${topicName}"`);
      return [];
    }
    
    console.log(`✅ Found ${subcontents.length} subcontents for topic "${topicName}"`);
    return subcontents;
  }

  viewContent(subcontent: any, topicName: string): void {
    // Navigate to content viewer or open modal
    console.log('Viewing content:', subcontent);
    // You can implement a modal or navigate to a content viewer page
  }

  goBack(): void {
    if (this.fromAdaptive) {
      this.router.navigate(['/adaptive-panel']);
    } else {
      this.router.navigate(['/student-dashboard']);
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch(difficulty?.toUpperCase()) {
      case 'BEGINNER': return '#4ade80';
      case 'INTERMEDIATE': return '#fbbf24';
      case 'ADVANCED': return '#ef4444';
      default: return '#9ca3af';
    }
  }

  hasVideos(subcontents: any[]): boolean {
    return subcontents.some(sc => sc.videoUrls && sc.videoUrls.length > 0);
  }

  hasPDFs(subcontents: any[]): boolean {
    return subcontents.some(sc => sc.pdfUrls && sc.pdfUrls.length > 0);
  }

  hasMCQs(subcontents: any[]): boolean {
    return subcontents.some(sc => sc.mcqCount && sc.mcqCount > 0);
  }

  getTotalVideos(subcontents: any[]): number {
    return subcontents.reduce((sum, sc) => sum + (sc.videoUrls?.length || 0), 0);
  }

  getTotalPDFs(subcontents: any[]): number {
    return subcontents.reduce((sum, sc) => sum + (sc.pdfUrls?.length || 0), 0);
  }

  getTotalMCQs(subcontents: any[]): number {
    return subcontents.reduce((sum, sc) => sum + (sc.mcqCount || 0), 0);
  }

  getCompletedTopics(): number {
    return this.weeklyStructure.reduce((sum, week) => {
      return sum + week.topics.filter((t: any) => t.progress === 100).length;
    }, 0);
  }

  getFirstSubcontentTitle(topic: any): string {
    if (topic.subcontents && topic.subcontents.length > 0) {
      return topic.subcontents[0].name || 'Continue learning';
    }
    return 'Start learning';
  }

  // Video player methods
  playVideo(video: any, subcontent: any, topic: any): void {
    this.currentVideo = video;
    this.currentSubcontent = subcontent;
    this.currentTopic = topic;
    this.showVideoPlayer = true;
    this.currentContentType = 'videos';
    this.buildAllVideosList();
    this.findCurrentVideoIndex();
    this.loadStudentNotes();
  }

  buildAllVideosList(): void {
    this.allVideos = [];
    this.weeklyStructure.forEach(week => {
      week.topics.forEach((topic: any) => {
        topic.subcontents?.forEach((subcontent: any) => {
          // Handle the backend structure: videoUrls and videoFileNames arrays
          if (subcontent.videoUrls && subcontent.videoUrls.length > 0) {
            subcontent.videoUrls.forEach((videoUrl: string, index: number) => {
              this.allVideos.push({
                video: {
                  id: `${topic.name}-${subcontent.name}-${index}`,
                  url: videoUrl,
                  title: subcontent.videoFileNames?.[index] || `Video ${index + 1}`,
                  description: subcontent.description
                },
                subcontent: subcontent,
                topic: topic
              });
            });
          }
        });
      });
    });
    console.log(`📹 Built video list with ${this.allVideos.length} videos`);
  }

  findCurrentVideoIndex(): void {
    if (this.currentVideo) {
      this.currentVideoIndex = this.allVideos.findIndex(item => 
        item.video.id === this.currentVideo.id
      );
    }
  }

  closeVideoPlayer(): void {
    this.showVideoPlayer = false;
    this.currentVideo = null;
    this.currentSubcontent = null;
    this.currentTopic = null;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  playNextVideo(): void {
    if (this.currentVideoIndex < this.allVideos.length - 1) {
      this.currentVideoIndex++;
      const nextItem = this.allVideos[this.currentVideoIndex];
      this.currentVideo = nextItem.video;
      this.currentSubcontent = nextItem.subcontent;
      this.currentTopic = nextItem.topic;
    }
  }

  playPrevVideo(): void {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
      const prevItem = this.allVideos[this.currentVideoIndex];
      this.currentVideo = prevItem.video;
      this.currentSubcontent = prevItem.subcontent;
      this.currentTopic = prevItem.topic;
    }
  }

  hasNextVideo(): boolean {
    return this.currentVideoIndex < this.allVideos.length - 1;
  }

  hasPrevVideo(): boolean {
    return this.currentVideoIndex > 0;
  }

  selectVideoFromSidebar(item: any): void {
    this.currentVideo = item.video;
    this.currentSubcontent = item.subcontent;
    this.currentTopic = item.topic;
    this.currentVideoIndex = this.allVideos.indexOf(item);
  }

  isCurrentVideo(video: any): boolean {
    return this.currentVideo && this.currentVideo.id === video.id;
  }

  openPDF(pdf: any): void {
    if (pdf.url) {
      window.open(pdf.url, '_blank');
    }
  }

  startQuiz(subcontent: any): void {
    // Navigate to quiz component or open quiz modal
    console.log('Starting quiz for:', subcontent.name);
    // You can implement quiz navigation here
  }

  // Notes management methods
  loadStudentNotes(): void {
    // Load notes from localStorage or backend
    const courseNotes = localStorage.getItem(`course_notes_${this.courseId}`);
    this.studentNotes = courseNotes || '';
  }

  saveStudentNotes(): void {
    this.notesLoading = true;
    // Save notes to localStorage (you can replace with backend call)
    localStorage.setItem(`course_notes_${this.courseId}`, this.studentNotes);
    
    setTimeout(() => {
      this.notesSaved = true;
      this.notesLoading = false;
      
      // Reset saved state after 2 seconds
      setTimeout(() => {
        this.notesSaved = false;
      }, 2000);
    }, 500);
  }

  // Set current content type based on what's being viewed
  setContentType(type: 'videos' | 'articles' | 'quizzes'): void {
    this.currentContentType = type;
  }

  // Get active content icon
  getContentIcon(): string {
    switch(this.currentContentType) {
      case 'videos': return '🎥';
      case 'articles': return '📄';
      case 'quizzes': return '📝';
      default: return '📚';
    }
  }
}

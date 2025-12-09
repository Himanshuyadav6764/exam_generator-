import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { StudentDashboardComponent } from './dashboards/student-dashboard/student-dashboard.component';
import { InstructorDashboardComponent } from './dashboards/instructor-dashboard/instructor-dashboard.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard/admin-dashboard.component';
import { CreateCourseComponent } from './components/instructor/create-course/create-course.component';
import { CourseManagementComponent } from './components/instructor/course-management/course-management.component';
import { ContentManagementComponent } from './components/instructor/content-management/content-management.component';
import { BulkContentUploadComponent } from './components/instructor/bulk-content-upload/bulk-content-upload.component';
import { McqManagementComponent } from './components/mcq-management/mcq-management.component';
import { MCQQuizComponent } from './components/mcq-quiz/mcq-quiz.component';
import { SearchComponent } from './components/search/search.component';
import { AdaptivePanelComponent } from './dashboards/student/adaptive-panel/adaptive-panel.component';
import { LearningContentComponent } from './dashboards/student/learning-content/learning-content.component';
import { MyCoursesComponent } from './dashboards/student/my-courses/my-courses.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { CourseEnrolledComponent } from './components/student/course-enrolled/course-enrolled.component';
// import { CourseOverviewComponent } from './components/student/course-overview/course-overview.component'; // Removed - bypassed
import { LearningWorkspaceComponent } from './components/student/learning-workspace/learning-workspace.component';
import { AiQuizAttemptComponent } from './components/student/ai-quiz-attempt/ai-quiz-attempt.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { AiQuizGeneratorComponent } from './components/instructor/ai-quiz-generator/ai-quiz-generator.component';
import { AnalyticsDashboardComponent } from './dashboards/student/analytics-dashboard/analytics-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'student-dashboard', 
    component: StudentDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'instructor-dashboard', 
    component: InstructorDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' }
  },
  { 
    path: 'create-course', 
    component: CreateCourseComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'course-management', 
    component: CourseManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'content-management/:id', 
    component: ContentManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'bulk-content-upload/:id', 
    component: BulkContentUploadComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'mcq-management/:id', 
    component: McqManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'quiz/:topicId', 
    component: MCQQuizComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'search', 
    component: SearchComponent,
    canActivate: [AuthGuard]
  },
  // Removed course-overview route - students go directly to course-enrolled
  // { 
  //   path: 'course-overview/:id', 
  //   component: CourseOverviewComponent,
  //   canActivate: [AuthGuard, RoleGuard],
  //   data: { role: 'STUDENT' }
  // },
  { 
    path: 'course-enrolled/:id', 
    component: CourseEnrolledComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'learning-workspace/:courseId/:topic/:subtopic', 
    component: LearningWorkspaceComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'student/adaptive-dashboard', 
    redirectTo: '/adaptive-panel',
    pathMatch: 'full'
  },
  { 
    path: 'adaptive-panel', 
    component: AdaptivePanelComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'learning-content', 
    component: LearningContentComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'my-courses', 
    component: MyCoursesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'analytics-dashboard', 
    component: AnalyticsDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { 
    path: 'course-detail', 
    component: CourseDetailComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'ai-quiz-generator', 
    component: AiQuizGeneratorComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'ai-quiz-generator/:courseId', 
    component: AiQuizGeneratorComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'INSTRUCTOR' }
  },
  { 
    path: 'ai-quiz-attempt/:courseId/:topicId', 
    component: AiQuizAttemptComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STUDENT' }
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

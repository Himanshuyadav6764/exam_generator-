import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { StudentDashboardComponent } from './dashboards/student-dashboard/student-dashboard.component';
import { InstructorDashboardComponent } from './dashboards/instructor-dashboard/instructor-dashboard.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard/admin-dashboard.component';
import { CreateCourseComponent } from './components/instructor/create-course/create-course.component';
import { CourseManagementComponent } from './components/instructor/course-management/course-management.component';
import { ContentManagementComponent } from './components/instructor/content-management/content-management.component';
import { BulkContentUploadComponent } from './components/instructor/bulk-content-upload/bulk-content-upload.component';
import { MCQQuizComponent } from './components/mcq-quiz/mcq-quiz.component';
import { SearchComponent } from './components/search/search.component';
import { AdaptivePanelComponent } from './dashboards/student/adaptive-panel/adaptive-panel.component';
import { LearningContentComponent } from './dashboards/student/learning-content/learning-content.component';
import { MyCoursesComponent } from './dashboards/student/my-courses/my-courses.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { CourseDetailsModalComponent } from './components/course-details-modal/course-details-modal.component';
import { CourseEnrolledComponent } from './components/student/course-enrolled/course-enrolled.component';
import { LearningWorkspaceComponent } from './components/student/learning-workspace/learning-workspace.component';
import { CourseOverviewComponent } from './components/student/course-overview/course-overview.component';
import { AiQuizAttemptComponent } from './components/student/ai-quiz-attempt/ai-quiz-attempt.component';
import { SafePipe } from './pipes/safe.pipe';
import { AiQuizGeneratorComponent } from './components/instructor/ai-quiz-generator/ai-quiz-generator.component';
import { AnalyticsDashboardComponent } from './dashboards/student/analytics-dashboard/analytics-dashboard.component';

@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        StudentDashboardComponent,
        InstructorDashboardComponent,
        AdminDashboardComponent,
        CreateCourseComponent,
        CourseManagementComponent,
        ContentManagementComponent,
        BulkContentUploadComponent,
        MCQQuizComponent,
        SearchComponent,
        AdaptivePanelComponent,
        LearningContentComponent,
        MyCoursesComponent,
        CourseDetailComponent,
        CourseDetailsModalComponent,
        CourseEnrolledComponent,
        LearningWorkspaceComponent,
        CourseOverviewComponent,
        AiQuizAttemptComponent,
        SafePipe,
        AiQuizGeneratorComponent,
        AnalyticsDashboardComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }

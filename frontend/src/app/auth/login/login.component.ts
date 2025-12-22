import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard(this.authService.getUserRole()!);
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    // Trim and lowercase email for consistency
    this.email = this.email.trim().toLowerCase();

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('✅ Login successful:', response.email);
        this.redirectToDashboard(response.role);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Login failed:', error);
        
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      }
    });
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'STUDENT':
        this.router.navigate(['/student-dashboard']);
        break;
      case 'INSTRUCTOR':
        this.router.navigate(['/instructor-dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin-dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}

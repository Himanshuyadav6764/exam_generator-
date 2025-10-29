import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['role'];
    const userRole = this.authService.getUserRole();

    if (userRole === expectedRole) {
      return true;
    }

    // Redirect to appropriate dashboard based on user's actual role
    if (userRole === 'STUDENT') {
      this.router.navigate(['/student-dashboard']);
    } else if (userRole === 'INSTRUCTOR') {
      this.router.navigate(['/instructor-dashboard']);
    } else if (userRole === 'ADMIN') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/login']);
    }

    return false;
  }
}

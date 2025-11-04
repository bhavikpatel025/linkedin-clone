import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UserLogin, CurrentUser } from '../../models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 
      Professional Split-Screen Layout Container
      This is a common pattern for modern auth pages like LinkedIn.
    -->
    <div class="auth-container">
      
      <!-- 
        Left Panel: Branding & Welcome Message
        - Uses a professional gradient.
        - Contains a welcome message and a decorative SVG.
      -->
      <div class="auth-panel panel-left">
        <div class="panel-content">
          <svg class="welcome-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
            <path d="M72.2,66.6c-4.3,2.3-8.1,5.2-11.4,8.5c-3.3,3.3-6.2,7.1-8.5,11.4c-2.3,4.3-4.1,8.8-5.3,13.5c-1.2,4.7-1.8,9.5-1.8,14.4c0,4.9,0.6,9.7,1.8,14.4c1.2,4.7,3,9.2,5.3,13.5c2.3,4.3,5.2,8.1,8.5,11.4c3.3,3.3,7.1,6.2,11.4,8.5c4.3,2.3,8.8,4.1,13.5,5.3c4.7,1.2,9.5,1.8,14.4,1.8c4.9,0,9.7-0.6,14.4-1.8c4.7-1.2,9.2-3,13.5-5.3c4.3-2.3,8.1-5.2,11.4-8.5c3.3-3.3,6.2-7.1,8.5-11.4c2.3-4.3,4.1-8.8,5.3-13.5c1.2-4.7,1.8-9.5,1.8-14.4c0-4.9-0.6-9.7-1.8-14.4c-1.2-4.7-3-9.2-5.3-13.5c-2.3-4.3-5.2-8.1-8.5-11.4c-3.3-3.3-7.1-6.2-11.4-8.5c-4.3-2.3-8.8-4.1-13.5-5.3c-4.7-1.2-9.5-1.8-14.4-1.8c-4.9,0-9.7,0.6-14.4,1.8C81.1,62.5,76.5,64.3,72.2,66.6z" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <path d="M127.8,66.6c4.3,2.3,8.1,5.2,11.4,8.5c3.3,3.3,6.2,7.1,8.5,11.4c2.3,4.3,4.1,8.8,5.3,13.5c1.2,4.7,1.8,9.5,1.8,14.4c0,4.9-0.6,9.7-1.8,14.4c-1.2,4.7-3,9.2-5.3,13.5c-2.3,4.3-5.2,8.1-8.5,11.4c-3.3,3.3-7.1,6.2-11.4,8.5c-4.3,2.3-8.8,4.1-13.5,5.3c-4.7,1.2-9.5,1.8-14.4,1.8s-9.7-0.6-14.4-1.8c-4.7-1.2-9.2-3-13.5-5.3c-4.3-2.3-8.1-5.2-11.4-8.5" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h2>Welcome to your professional community</h2>
          <p>Connect, learn, and grow with millions of professionals from around the world.</p>
        </div>
      </div>

      <!-- 
        Right Panel: Login Form in Modern Card
        - Clean white background for the form.
        - Uses a card-like container for the form elements.
      -->
      <div class="auth-panel panel-right">
        <div class="card-container">
          <div class="form-card">
            
            <!-- Form Header -->
            <div class="form-header">
              <!-- <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0a66c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg> -->
              <h3 style="background: linear-gradient(135deg, #0a66c2, #004182); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"  >Welcome Back!</h3>
              <p>Stay updated on your professional world.</p>
            </div>

            <!-- Login Form with Floating Labels -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
              
              <!-- Email Input Group (Floating Label) -->
              <div class="form-group floating">
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder=" " 
                  [class.is-invalid]="showFieldError('email')">
                <label for="email">Email or Phone</label>
                <!-- 
                  Validation Message:
                  This block now clearly shows validation errors, tied to the 'showFieldError' function.
                -->
                <div class="invalid-feedback" *ngIf="showFieldError('email')">
                  <div *ngIf="loginForm.get('email')?.errors?.['required']">Please enter your email or phone.</div>
                  <div *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email address.</div>
                </div>
              </div>

              <!-- Password Input Group (Floating Label) -->
              <div class="form-group floating">
                <div class="password-wrapper">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control"
                    formControlName="password"
                    placeholder=" "
                    [class.is-invalid]="showFieldError('password')">
                  <label for="password">Password</label>
                  <!-- Password Toggle Button -->
                  <button type="button" class="password-toggle" (click)="togglePassword()" aria-label="Toggle password visibility">
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
                <!-- 
                  Validation Message:
                  This block now clearly shows validation errors for the password.
                -->
                <div class="invalid-feedback" *ngIf="showFieldError('password')">
                  <div *ngIf="loginForm.get('password')?.errors?.['required']">Please enter your password.</div>
                  <div *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters.</div>
                </div>
              </div>

              <!-- Forgot Password Link -->
              <div class="form-options">
                <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
              </div>

              <!-- Global Error Message (e.g., "Invalid credentials") -->
              <div class="alert alert-danger" *ngIf="errorMessage" role="alert">
                {{ errorMessage }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn-submit"
                [disabled]="loading || loginForm.invalid">
                <span *ngIf="loading" class="spinner" role="status"></span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </button>
            </form>

            <!-- Footer Section (Sign Up Link) -->
            <div class="auth-footer">
              <p>New to LinkedIn? <a routerLink="/register">Join now</a></p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Import modern font */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f4f6f8;
    }

    /*
     * Split-Screen Layout
     */
    .auth-container {
      display: flex;
      width: 100%;
      min-height: 100vh;
      flex-wrap: wrap; /* Allows stacking on mobile */
    }

    .auth-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      box-sizing: border-box;
    }

    /*
     * Left Panel (Branding)
     */
    .panel-left {
      background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
      color: white;
      flex-basis: 50%; /* Tries to take 50% width */
      min-height: 40vh; /* Ensures height on mobile */
    }

    .panel-content {
      max-width: 450px;
      text-align: left;
    }

    .panel-content h2 {
      font-size: 2.25rem;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 1rem;
    }

    .panel-content p {
      font-size: 1.1rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.6;
    }

    .welcome-svg {
      width: 120px;
      height: 120px;
      margin-bottom: 1.5rem;
      opacity: 0.8;
    }

    /*
     * Right Panel (Form in Modern Card)
     */
    .panel-right {
      background-color: #f3f2ef;
      flex-basis: 50%;
      min-height: 60vh;
    }

    .card-container {
      width: 100%;
      max-width: 440px;
      display: flex;
      justify-content: center;
    }

    .form-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.02);
      padding: 2.5rem;
      width: 100%;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .form-card:hover {
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08), 0 5px 15px rgba(0, 0, 0, 0.03);
    }

    .form-header {
      text-align: left;
      margin-bottom: 2rem;
    }

    .form-header .logo-svg {
      margin-bottom: 1rem;
    }

    .form-header h3 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .form-header p {
      font-size: 1rem;
      color: #4a5568;
    }

    /*
     * Modern Floating Label Form Group
     */
    .form-group.floating {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .form-control {
      width: 100%;
      height: 56px; /* Set a fixed height for floating label */
      padding: 1.25rem 1rem 0.5rem 1rem; /* Padding to make space for label */
      font-size: 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fdfdff;
      color: #1a202c;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-group.floating label {
      position: absolute;
      top: 1rem;
      left: 1rem;
      font-size: 1rem;
      color: #64748b;
      background: #fdfdff; /* Match input background for clean text overlap */
      padding: 0 0.25rem;
      transition: all 0.2s ease;
      pointer-events: none;
    }

    /* The "float" effect */
    .form-control:focus + label,
    .form-control:not(:placeholder-shown) + label {
      top: -0.6rem;
      left: 0.75rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: #0a66c2;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #0a66c2;
      box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.2);
    }
    
    /*
     * Password Field Specifics
     */
    .password-wrapper {
      position: relative;
    }
    
    .password-wrapper .form-control {
      padding-right: 3rem; /* Make space for toggle button */
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 0.25rem;
      border-radius: 50%;
    }

    /*
     * Validation Styles (This is where validation is made visible)
     */
    .form-control.is-invalid {
      border-color: #d93025; /* Red border for error */
      background: #fff8f8;
    }
    
    .form-control.is-invalid:focus {
      box-shadow: 0 0 0 2px rgba(217, 48, 37, 0.2);
      border-color: #d93025;
    }

    /* Make floating label red on error */
    .form-control.is-invalid:focus + label,
    .form-control.is-invalid:not(:placeholder-shown) + label {
      color: #d93025;
    }
    
    /* The error message text */
    .invalid-feedback {
      display: block; /* Show the error message */
      font-size: 0.875rem;
      margin-top: 0.5rem;
      color: #d93025;
      text-align: left;
    }

    /*
     * Form Options & Footer
     */
    .form-options {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .forgot-link {
      color: #0a66c2;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn-submit {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      background-color: #0a66c2;
      border: none;
      border-radius: 24px; /* LinkedIn's pill-shaped button */
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #004182;
    }

    .btn-submit:disabled {
      background-color: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
    }

    .auth-footer p {
      color: #4a5568;
      font-size: 1rem;
    }

    .auth-footer a {
      color: #0a66c2;
      font-weight: 600;
      text-decoration: none;
    }
    
    .auth-footer a:hover {
      text-decoration: underline;
    }

    /*
     * Global Error Alert
     */
    .alert-danger {
      background: #fff5f5;
      color: #c53030;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      text-align: center;
      border: 1px solid #fecaca;
    }

    /*
     * Loading Spinner
     */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /*
     * Responsive Design
     */
    @media (max-width: 968px) {
      .auth-container {
        flex-direction: column;
      }
      
      .auth-panel {
        flex-basis: auto; /* Allow panels to stack */
      }
      
      .panel-left {
        min-height: auto;
        padding: 4rem 2rem;
        text-align: center;
      }
      
      .panel-content {
        max-width: 100%;
      }

      .panel-right {
        padding: 3rem 1.5rem;
      }

      .form-card {
        padding: 2rem 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .form-card {
        padding: 1.5rem 1rem;
        border-radius: 12px;
      }
      
      .panel-left, .panel-right {
        padding: 2rem 1rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdRef: ChangeDetectorRef // Add ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      // Validation rules are defined here
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Redirect to dashboard if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Checks if a form field is invalid and has been touched.
   * This function is used to show validation messages in the template.
   */
  showFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
  // Mark all fields as touched to trigger validation messages
  Object.keys(this.loginForm.controls).forEach(key => {
    const control = this.loginForm.get(key);
    if (control) {
      control.markAsTouched();
    }
  });

  // Set submitted to true
  this.submitted = true;

  // Stop if form is invalid
  if (this.loginForm.invalid) {
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const loginData: UserLogin = {
    email: this.loginForm.value.email,
    password: this.loginForm.value.password
  };

  // Use authService.login instead of apiService.login
  this.authService.login(loginData).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        //  User data is now in response.data.user
        const currentUser: CurrentUser = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          roleId: response.data.user.roleId,
          roleName: response.data.user.roleName,
          profilePicture: response.data.user.profilePicture
        };
        
        this.authService.setCurrentUser(currentUser);
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = response.message || 'Login failed. Please check your credentials.';
        this.cdRef.detectChanges();
      }
      this.loading = false;
    },
    error: (error) => {
      console.error('Login error:', error);
      this.errorMessage = error.error?.message || 'An error occurred during login. Please try again.';
      this.loading = false;
      this.cdRef.detectChanges();
    }
  });
}
}
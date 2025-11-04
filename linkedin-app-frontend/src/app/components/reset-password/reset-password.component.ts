import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      
      <!-- Left Panel -->
      <div class="auth-panel panel-left">
        <div class="panel-content">
          <svg class="welcome-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
            <path d="M72.2,66.6c-4.3,2.3-8.1,5.2-11.4,8.5c-3.3,3.3-6.2,7.1-8.5,11.4c-2.3,4.3-4.1,8.8-5.3,13.5c-1.2,4.7-1.8,9.5-1.8,14.4c0,4.9,0.6,9.7,1.8,14.4c1.2,4.7,3,9.2,5.3,13.5c2.3,4.3,5.2,8.1,8.5,11.4c3.3,3.3,7.1,6.2,11.4,8.5c4.3,2.3,8.8,4.1,13.5,5.3c4.7,1.2,9.5,1.8,14.4,1.8c4.9,0,9.7-0.6,14.4-1.8c4.7-1.2,9.2-3,13.5-5.3c4.3-2.3,8.1-5.2,11.4-8.5c3.3-3.3,6.2-7.1,8.5-11.4c2.3-4.3,4.1-8.8,5.3-13.5c1.2-4.7,1.8-9.5,1.8-14.4c0-4.9-0.6-9.7-1.8-14.4c-1.2-4.7-3-9.2-5.3-13.5c-2.3-4.3-5.2-8.1-8.5-11.4c-3.3-3.3-7.1-6.2-11.4-8.5c-4.3-2.3-8.8-4.1-13.5-5.3c-4.7-1.2-9.5-1.8-14.4-1.8c-4.9,0-9.7,0.6-14.4,1.8C81.1,62.5,76.5,64.3,72.2,66.6z" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <path d="M127.8,66.6c4.3,2.3,8.1,5.2,11.4,8.5c3.3,3.3,6.2,7.1,8.5,11.4c2.3,4.3,4.1,8.8,5.3,13.5c1.2,4.7,1.8,9.5,1.8,14.4c0,4.9-0.6,9.7-1.8,14.4c-1.2,4.7-3,9.2-5.3,13.5c-2.3,4.3-5.2,8.1-8.5,11.4c-3.3,3.3-7.1,6.2-11.4,8.5c-4.3,2.3-8.8,4.1-13.5,5.3c-4.7,1.2-9.5,1.8-14.4,1.8s-9.7-0.6-14.4-1.8c-4.7-1.2-9.2-3-13.5-5.3c-4.3-2.3-8.1-5.2-11.4-8.5" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h2>Set New Password</h2>
          <p>Create a strong password to secure your account.</p>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="auth-panel panel-right">
        <div class="card-container">
          <div class="form-card">
            
            <!-- Form Header -->
            <div class="form-header">
              <h3 style="background: linear-gradient(135deg, #0a66c2, #004182); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Reset Password
              </h3>
              <p>Enter your new password below</p>
            </div>

            <!-- Token Invalid Message -->
            <div class="alert alert-danger" *ngIf="tokenInvalid" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              This reset link is invalid or has expired.
            </div>

            <!-- Reset Password Form -->
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate *ngIf="!tokenInvalid">
              
              <!-- New Password -->
              <div class="form-group floating">
                <div class="password-wrapper">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control"
                    formControlName="password"
                    placeholder=" "
                    [class.is-invalid]="showFieldError('password')">
                  <label for="password">New Password</label>
                  <button type="button" class="password-toggle" (click)="togglePassword()" aria-label="Toggle password visibility">
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
                <div class="invalid-feedback" *ngIf="showFieldError('password')">
                  <div *ngIf="resetForm.get('password')?.errors?.['required']">Password is required</div>
                  <div *ngIf="resetForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</div>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="form-group floating">
                <div class="password-wrapper">
                  <input
                    id="confirmPassword"
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    class="form-control"
                    formControlName="confirmPassword"
                    placeholder=" "
                    [class.is-invalid]="showFieldError('confirmPassword')">
                  <label for="confirmPassword">Confirm Password</label>
                  <button type="button" class="password-toggle" (click)="toggleConfirmPassword()" aria-label="Toggle password visibility">
                    <svg *ngIf="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg *ngIf="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
                <div class="invalid-feedback" *ngIf="showFieldError('confirmPassword')">
                  <div *ngIf="resetForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</div>
                  <div *ngIf="resetForm.hasError('mismatch')">Passwords do not match</div>
                </div>
              </div>

              <!-- Error Message -->
              <div class="alert alert-danger" *ngIf="errorMessage" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{ errorMessage }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn-submit"
                [disabled]="loading || resetForm.invalid">
                <span *ngIf="!loading">Reset Password</span>
                <span *ngIf="loading">
                  <span class="spinner" role="status"></span>
                  Resetting...
                </span>
              </button>
            </form>

            <!-- Footer Section -->
            <div class="auth-footer">
              <p>
                <a routerLink="/login" class="auth-link">Back to Login</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Use the same styles as forgot-password component */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f4f6f8;
    }

    .auth-container {
      display: flex;
      width: 100%;
      min-height: 100vh;
      flex-wrap: wrap;
    }

    .auth-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      box-sizing: border-box;
    }

    .panel-left {
      background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
      color: white;
      flex-basis: 50%;
      min-height: 40vh;
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
    }

    .form-header {
      text-align: left;
      margin-bottom: 2rem;
    }

    .form-header h3 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .form-header p {
      font-size: 1rem;
      color: #4a5568;
    }

    .form-group.floating {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .password-wrapper {
      position: relative;
    }

    .form-control {
      width: 100%;
      height: 56px;
      padding: 1.25rem 1rem 0.5rem 1rem;
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
      background: #fdfdff;
      padding: 0 0.25rem;
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 1;
    }

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

    .form-control.is-invalid {
      border-color: #d93025;
      background: #fff8f8;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s ease;
    }

    .password-toggle:hover {
      color: #0a66c2;
    }

    .invalid-feedback {
      display: block;
      font-size: 0.875rem;
      margin-top: 0.5rem;
      color: #d93025;
      text-align: left;
    }

    .btn-submit {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      background-color: #0a66c2;
      border: none;
      border-radius: 24px;
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

    .auth-link {
      color: #0a66c2;
      font-weight: 600;
      text-decoration: none;
    }

    .auth-link:hover {
      text-decoration: underline;
    }

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

    @media (max-width: 968px) {
      .auth-container {
        flex-direction: column;
      }
      
      .auth-panel {
        flex-basis: auto;
      }
      
      .panel-left {
        min-height: auto;
        padding: 4rem 2rem;
        text-align: center;
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
      }
      
      .panel-left, .panel-right {
        padding: 2rem 1rem;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  loading = false;
  errorMessage = '';
  tokenInvalid = false;
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      this.tokenInvalid = true;
      return;
    }

    // Verify the token
    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.tokenInvalid = true;
        }
      },
      error: (error) => {
        this.tokenInvalid = true;
      }
    });
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  showFieldError(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.resetForm.invalid) {
      return;
    }

    this.loading = true;
    const password = this.resetForm.value.password!;

    this.authService.resetPassword(this.token, password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Password Reset!',
            text: 'Your password has been reset successfully. You can now login with your new password.',
            confirmButtonColor: '#0a66c2',
            confirmButtonText: 'Login Now'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        } else {
          this.errorMessage = response.message || 'Failed to reset password';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Reset password error:', error);
        this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
      }
    });
  }
}
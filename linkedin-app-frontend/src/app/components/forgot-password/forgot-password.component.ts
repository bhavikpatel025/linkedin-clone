import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
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
          <h2>Reset Your Password</h2>
          <p>We'll help you get back into your account quickly and securely.</p>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="auth-panel panel-right">
        <div class="card-container">
          <div class="form-card">
            
            <!-- Form Header -->
            <div class="form-header">
              <h3 style="background: linear-gradient(135deg, #0a66c2, #004182); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Forgot Password?
              </h3>
              <p>Enter your email to receive a reset link</p>
            </div>

            <!-- Forgot Password Form -->
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
              
              <!-- Email Input -->
              <div class="form-group floating">
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder=" "
                  [class.is-invalid]="showFieldError('email')">
                <label for="email">Email Address</label>
                <div class="invalid-feedback" *ngIf="showFieldError('email')">
                  <div *ngIf="forgotForm.get('email')?.errors?.['required']">Please enter your email</div>
                  <div *ngIf="forgotForm.get('email')?.errors?.['email']">Please enter a valid email address</div>
                </div>
              </div>

              <!-- Success Message -->
              <div class="alert alert-success" *ngIf="successMessage" role="alert">
                <i class="bi bi-check-circle me-2"></i>
                {{ successMessage }}
                <div *ngIf="resetToken" class="mt-2">
                  <small class="text-muted">
                    For testing: Use this token in reset password page: 
                    <code class="d-block mt-1">{{ resetToken }}</code>
                  </small>
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
                [disabled]="loading || forgotForm.invalid">
                <span *ngIf="!loading">Send Reset Link</span>
                <span *ngIf="loading">
                  <span class="spinner" role="status"></span>
                  Sending...
                </span>
              </button>
            </form>

            <!-- Footer Section -->
            <div class="auth-footer">
              <p>
                Remember your password? 
                <a routerLink="/login" class="auth-link">Back to Login</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Use the same styles as login component */
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

    .alert-success {
      background: #f0f9ff;
      color: #0369a1;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      text-align: left;
      border: 1px solid #bae6fd;
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

    code {
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      word-break: break-all;
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
export class ForgotPasswordComponent {
  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  successMessage = '';
  errorMessage = '';
  resetToken = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  showFieldError(fieldName: string): boolean {
    const field = this.forgotForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.forgotForm.invalid) {
      return;
    }

    this.loading = true;
    const email = this.forgotForm.value.email!;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = response.message;
          this.resetToken = response.data; // Store token for testing
          this.forgotForm.reset();
          this.submitted = false;
        } else {
          this.errorMessage = response.message || 'Failed to send reset email';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Forgot password error:', error);
        this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
      }
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UserRegistration, Role, Skill, CurrentUser } from '../../models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      
      <!-- Left Panel -->
      <!-- <div class="auth-panel panel-left">
        <div class="panel-content">
          <svg class="welcome-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
            <path d="M72.2,66.6c-4.3,2.3-8.1,5.2-11.4,8.5c-3.3,3.3-6.2,7.1-8.5,11.4c-2.3,4.3-4.1,8.8-5.3,13.5c-1.2,4.7-1.8,9.5-1.8,14.4c0,4.9,0.6,9.7,1.8,14.4c1.2,4.7,3,9.2,5.3,13.5c2.3,4.3,5.2,8.1,8.5,11.4c3.3,3.3,7.1,6.2,11.4,8.5c4.3,2.3,8.8,4.1,13.5,5.3c4.7,1.2,9.5,1.8,14.4,1.8c4.9,0,9.7-0.6,14.4-1.8c4.7-1.2,9.2-3,13.5-5.3c4.3-2.3,8.1-5.2,11.4-8.5c3.3-3.3,6.2-7.1,8.5-11.4c2.3-4.3,4.1-8.8,5.3-13.5c1.2-4.7,1.8-9.5,1.8-14.4c0-4.9-0.6-9.7-1.8-14.4c-1.2-4.7-3-9.2-5.3-13.5c-2.3-4.3-5.2-8.1-8.5-11.4c-3.3-3.3-7.1-6.2-11.4-8.5c-4.3-2.3-8.8-4.1-13.5-5.3c-4.7-1.2-9.5-1.8-14.4-1.8c-4.9,0-9.7,0.6-14.4,1.8C81.1,62.5,76.5,64.3,72.2,66.6z" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <path d="M127.8,66.6c4.3,2.3,8.1,5.2,11.4,8.5c3.3,3.3,6.2,7.1,8.5,11.4c2.3,4.3,4.1,8.8,5.3,13.5c1.2,4.7,1.8,9.5,1.8,14.4c0,4.9-0.6,9.7-1.8,14.4c-1.2,4.7-3,9.2-5.3,13.5c-2.3,4.3-5.2,8.1-8.5,11.4c-3.3,3.3-7.1,6.2-11.4,8.5c-4.3,2.3-8.8,4.1-13.5,5.3c-4.7,1.2-9.5,1.8-14.4,1.8s-9.7-0.6-14.4-1.8c-4.7-1.2-9.2-3-13.5-5.3c-4.3-2.3-8.1-5.2-11.4-8.5" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <h2>Join Our Professional Network</h2>
          <p>Create your account to connect with professionals, discover opportunities, and grow your career.</p>
        </div>
      </div> -->

      <!-- Right Panel -->
      <div class="auth-panel panel-right">
        <div class="card-container">
          <div class="form-card">
            
            <!-- Form Header -->
            <div class="form-header">
              <h3 style="background: linear-gradient(135deg, #0a66c2, #004182); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Create Account
              </h3>
              <p>Fill in your details to get started</p>
            </div>

            <!-- Register Form -->
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
              
              <!-- Name Input -->
              <div class="form-group floating">
                <input
                  id="name"
                  type="text"
                  class="form-control"
                  formControlName="name"
                  placeholder=" "
                  [class.is-invalid]="showFieldError('name')">
                <label for="name">Full Name *</label>
                <div class="invalid-feedback" *ngIf="showFieldError('name')">
                  <div *ngIf="registerForm.get('name')?.errors?.['required']">Name is required</div>
                  <div *ngIf="registerForm.get('name')?.errors?.['maxlength']">Name cannot exceed 100 characters</div>
                </div>
              </div>

              <!-- Gender Input -->
              <div class="form-group">
                <label class="form-label">Gender *</label>
                <div class="gender-options">
                  <div class="gender-option">
                    <input
                      type="radio"
                      id="male"
                      value="Male"
                      formControlName="gender"
                      class="gender-input">
                    <label for="male" class="gender-label">
                      <span class="gender-icon">♂</span>
                      Male
                    </label>
                  </div>
                  <div class="gender-option">
                    <input
                      type="radio"
                      id="female"
                      value="Female"
                      formControlName="gender"
                      class="gender-input">
                    <label for="female" class="gender-label">
                      <span class="gender-icon">♀</span>
                      Female
                    </label>
                  </div>
                </div>
                <div class="invalid-feedback" *ngIf="showFieldError('gender')">
                  Gender selection is required
                </div>
              </div>

              <!-- Email Input -->
              <div class="form-group floating">
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder=" "
                  [class.is-invalid]="showFieldError('email')">
                <label for="email">Email Address *</label>
                <div class="invalid-feedback" *ngIf="showFieldError('email')">
                  <div *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</div>
                  <div *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email address</div>
                </div>
              </div>

              <!-- Phone Number Input -->
              <div class="form-group floating">
                <input
                  id="phoneNumber"
                  type="tel"
                  class="form-control"
                  formControlName="phoneNumber"
                  placeholder=" "
                  maxlength="10"
                  [class.is-invalid]="showFieldError('phoneNumber')">
                <label for="phoneNumber">Phone Number *</label>
                <div class="invalid-feedback" *ngIf="showFieldError('phoneNumber')">
                  <div *ngIf="registerForm.get('phoneNumber')?.errors?.['required']">Phone number is required</div>
                  <div *ngIf="registerForm.get('phoneNumber')?.errors?.['pattern']">Please enter a valid 10-digit number</div>
                  <div *ngIf="registerForm.get('phoneNumber')?.errors?.['minlength']">Phone number must be 10 digits</div>
                </div>
                <div class="form-text" *ngIf="registerForm.get('phoneNumber')?.valid">
                  ✓ Valid phone number
                </div>
              </div>

              <!-- Password Input -->
              <div class="form-group floating">
                <div class="password-wrapper">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control"
                    formControlName="password"
                    placeholder=" "
                    [class.is-invalid]="showFieldError('password')">
                  <label for="password">Password *</label>
                  <button type="button" class="password-toggle" (click)="togglePassword()" aria-label="Toggle password visibility">
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <div class="invalid-feedback" *ngIf="showFieldError('password')">
                  <div *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</div>
                  <div *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</div>
                </div>
              </div>

              <!-- Role Selection -->
              <div class="form-group">
                <label for="roleId" class="form-label">Role *</label>
                <select
                  class="form-select"
                  id="roleId"
                  formControlName="roleId"
                  [class.is-invalid]="showFieldError('roleId')">
                  <option value="">Select your role</option>
                  <option *ngFor="let role of roles" [value]="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="showFieldError('roleId')">
                  Role selection is required
                </div>
              </div>

              <!-- Skills Selection -->
              <div class="form-group">
                <label class="form-label">Skills</label>
                <div class="skills-container">
                  <div class="skills-grid">
                    <div class="skill-option" *ngFor="let skill of skills">
                      <input
                        type="checkbox"
                        [id]="'skill-' + skill.id"
                        [value]="skill.id"
                        (change)="onSkillChange($event, skill.id)"
                        class="skill-input">
                      <label [for]="'skill-' + skill.id" class="skill-label">
                        {{ skill.name }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error Message -->
              <div class="alert alert-danger" *ngIf="errorMessage" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{ errorMessage }}
                <ul class="mb-0 mt-2" *ngIf="errorDetails.length > 0">
                  <li *ngFor="let error of errorDetails">{{ error }}</li>
                </ul>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn-submit"
                [disabled]="loading || registerForm.invalid">
                <span *ngIf="!loading">Create Account</span>
                <span *ngIf="loading">
                  <span class="spinner" role="status"></span>
                  Creating Account...
                </span>
              </button>
            </form>

            <!-- Footer Section -->
            <div class="auth-footer">
              <p>
                Already have an account? 
                <a routerLink="/login" class="auth-link">Sign in</a>
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

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-group.floating {
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

    .form-select {
      width: 100%;
      height: 56px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fdfdff;
      color: #1a202c;
      transition: all 0.2s ease;
    }

    .form-select:focus {
      outline: none;
      border-color: #0a66c2;
      box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.2);
    }

    .form-select.is-invalid {
      border-color: #d93025;
      background: #fff8f8;
    }

    /* Gender Options */
    .gender-options {
      display: flex;
      gap: 1rem;
    }

    .gender-option {
      flex: 1;
    }

    .gender-input {
      display: none;
    }

    .gender-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .gender-input:checked + .gender-label {
      border-color: #0a66c2;
      background: #f0f7ff;
      color: #0a66c2;
    }

    .gender-icon {
      font-size: 1.1rem;
    }

    /* Skills Selection */
    .skills-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      background: #fafafa;
      max-height: 150px;
      overflow-y: auto;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .skill-input {
      display: none;
    }

    .skill-label {
      display: block;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      text-align: center;
    }

    .skill-input:checked + .skill-label {
      border-color: #0a66c2;
      background: #0a66c2;
      color: white;
    }

    .password-wrapper {
      position: relative;
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

    .form-text {
      font-size: 0.875rem;
      margin-top: 0.5rem;
      color: #059669;
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
      text-align: left;
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

      .gender-options {
        flex-direction: column;
      }

      .skills-grid {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  roles: Role[] = [];
  skills: Skill[] = [];
  selectedSkills: number[] = [];
  loading = false;
  errorMessage = '';
  errorDetails: string[] = [];
  showPassword = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Redirect to dashboard if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.loadRoles();
    this.loadSkills();
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.roles = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      },
    });
  }

  loadSkills(): void {
    this.apiService.getSkills().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.skills = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      },
    });
  }

  showFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSkillChange(event: any, skillId: number): void {
    if (event.target.checked) {
      if (!this.selectedSkills.includes(skillId)) {
        this.selectedSkills.push(skillId);
      }
    } else {
      const index = this.selectedSkills.indexOf(skillId);
      if (index > -1) {
        this.selectedSkills.splice(index, 1);
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.errorDetails = [];

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const registrationData: UserRegistration = {
      name: this.registerForm.value.name,
      gender: this.registerForm.value.gender,
      email: this.registerForm.value.email,
      phoneNumber: this.registerForm.value.phoneNumber,
      password: this.registerForm.value.password,
      roleId: parseInt(this.registerForm.value.roleId),
      skillIds: this.selectedSkills,
    };

    // Use authService.register instead of apiService.register
    this.authService.register(registrationData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // User data is now in response.data.user (with JWT token)
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
          this.errorMessage = response.message || 'Registration failed';
          this.errorDetails = response.errors || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage = error.error?.message || 'An error occurred during registration';
        this.errorDetails = error.error?.errors || [];
        this.loading = false;
      },
    });
  }
}
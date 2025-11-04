// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, NgForm } from '@angular/forms';
// import { Router } from '@angular/router';
// import { ApiService } from '../../services/api.service';
// import { AuthService } from '../../services/auth.service';
// import { Role, Skill, UserRegistration } from '../../models/models';

// @Component({
//   selector: 'app-registration',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <div class="container mt-5">
//       <div class="row justify-content-center">
//         <div class="col-md-8">
//           <div class="card shadow">
//             <div class="card-header bg-primary text-white">
//               <h3 class="mb-0 text-center">
//                 <i class="fas fa-user-plus me-2"></i>Create Your Account
//               </h3>
//             </div>
//             <div class="card-body">
//               <form #registrationForm="ngForm" (ngSubmit)="onSubmit(registrationForm)" novalidate>
//                 <div class="row">
//                   <!-- Name -->
//                   <div class="col-md-6 mb-3">
//                     <label for="name" class="form-label">Full Name <span class="text-danger">*</span></label>
//                     <input
//                       type="text"
//                       class="form-control"
//                       id="name"
//                       name="name"
//                       [(ngModel)]="userData.name"
//                       #name="ngModel"
//                       required
//                       minlength="2"
//                       maxlength="100"
//                       [class.is-invalid]="name.invalid && (name.dirty || name.touched)"
//                       placeholder="Enter your full name"
//                     >
//                     <div *ngIf="name.invalid && (name.dirty || name.touched)" class="invalid-feedback">
//                       <div *ngIf="name.errors?.['required']">Name is required</div>
//                       <div *ngIf="name.errors?.['minlength']">Name must be at least 2 characters</div>
//                       <div *ngIf="name.errors?.['maxlength']">Name cannot exceed 100 characters</div>
//                     </div>
//                   </div>

//                   <!-- Email -->
//                   <div class="col-md-6 mb-3">
//                     <label for="email" class="form-label">Email Address <span class="text-danger">*</span></label>
//                     <input
//                       type="email"
//                       class="form-control"
//                       id="email"
//                       name="email"
//                       [(ngModel)]="userData.email"
//                       #email="ngModel"
//                       required
//                       email
//                       [class.is-invalid]="email.invalid && (email.dirty || email.touched)"
//                       placeholder="Enter your email"
//                     >
//                     <div *ngIf="email.invalid && (email.dirty || email.touched)" class="invalid-feedback">
//                       <div *ngIf="email.errors?.['required']">Email is required</div>
//                       <div *ngIf="email.errors?.['email']">Please enter a valid email</div>
//                     </div>
//                   </div>
//                 </div>

//                 <div class="row">
//                   <!-- Password -->
//                   <div class="col-md-6 mb-3">
//                     <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
//                     <input
//                       type="password"
//                       class="form-control"
//                       id="password"
//                       name="password"
//                       [(ngModel)]="userData.password"
//                       #password="ngModel"
//                       required
//                       minlength="6"
//                       [class.is-invalid]="password.invalid && (password.dirty || password.touched)"
//                       placeholder="Enter password (min 6 characters)"
//                     >
//                     <div *ngIf="password.invalid && (password.dirty || password.touched)" class="invalid-feedback">
//                       <div *ngIf="password.errors?.['required']">Password is required</div>
//                       <div *ngIf="password.errors?.['minlength']">Password must be at least 6 characters</div>
//                     </div>
//                   </div>

//                   <!-- Phone Number -->
//                   <div class="col-md-6 mb-3">
//                     <label for="phoneNumber" class="form-label">Phone Number <span class="text-danger">*</span></label>
//                     <input
//                       type="tel"
//                       class="form-control"
//                       id="phoneNumber"
//                       name="phoneNumber"
//                       [(ngModel)]="userData.phoneNumber"
//                       #phoneNumber="ngModel"
//                       required
//                       pattern="[0-9]{10,15}"
//                       [class.is-invalid]="phoneNumber.invalid && (phoneNumber.dirty || phoneNumber.touched)"
//                       placeholder="Enter your phone number"
//                     >
//                     <div *ngIf="phoneNumber.invalid && (phoneNumber.dirty || phoneNumber.touched)" class="invalid-feedback">
//                       <div *ngIf="phoneNumber.errors?.['required']">Phone number is required</div>
//                       <div *ngIf="phoneNumber.errors?.['pattern']">Please enter a valid phone number</div>
//                     </div>
//                   </div>
//                 </div>

//                 <!-- Gender -->
//                 <div class="mb-3">
//                   <label class="form-label">Gender <span class="text-danger">*</span></label>
//                   <div class="d-flex gap-4">
//                     <div class="form-check">
//                       <input
//                         class="form-check-input"
//                         type="radio"
//                         name="gender"
//                         id="male"
//                         value="Male"
//                         [(ngModel)]="userData.gender"
//                         #gender="ngModel"
//                         required
//                       >
//                       <label class="form-check-label" for="male">
//                         <i class="fas fa-male me-1"></i>Male
//                       </label>
//                     </div>
//                     <div class="form-check">
//                       <input
//                         class="form-check-input"
//                         type="radio"
//                         name="gender"
//                         id="female"
//                         value="Female"
//                         [(ngModel)]="userData.gender"
//                         #gender2="ngModel"
//                         required
//                       >
//                       <label class="form-check-label" for="female">
//                         <i class="fas fa-female me-1"></i>Female
//                       </label>
//                     </div>
//                   </div>
//                   <div *ngIf="gender.invalid && (gender.dirty || gender.touched)" class="text-danger small">
//                     Gender is required
//                   </div>
//                 </div>

//                 <!-- Role -->
//                 <div class="mb-3">
//                   <label for="role" class="form-label">Role <span class="text-danger">*</span></label>
//                   <select
//                     class="form-select"
//                     id="role"
//                     name="roleId"
//                     [(ngModel)]="userData.roleId"
//                     #roleId="ngModel"
//                     required
//                     [class.is-invalid]="roleId.invalid && (roleId.dirty || roleId.touched)"
//                   >
//                     <option value="">Select a role</option>
//                     <option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</option>
//                   </select>
//                   <div *ngIf="roleId.invalid && (roleId.dirty || roleId.touched)" class="invalid-feedback">
//                     Role is required
//                   </div>
//                 </div>

//                 <!-- Skills -->
//                 <div class="mb-4">
//                   <label class="form-label">Skills <span class="text-muted">(Select all that apply)</span></label>
//                   <div class="row">
//                     <div class="col-md-4 col-sm-6" *ngFor="let skill of skills">
//                       <div class="form-check mb-2">
//                         <input
//                           class="form-check-input"
//                           type="checkbox"
//                           [id]="'skill-' + skill.id"
//                           [value]="skill.id"
//                           (change)="onSkillChange($event, skill.id)"
//                         >
//                         <label class="form-check-label" [for]="'skill-' + skill.id">
//                           <i class="fas fa-code me-1"></i>{{ skill.name }}
//                         </label>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <!-- Error Messages -->
//                 <div *ngIf="errorMessages.length > 0" class="alert alert-danger">
//                   <ul class="mb-0">
//                     <li *ngFor="let error of errorMessages">{{ error }}</li>
//                   </ul>
//                 </div>

//                 <!-- Success Message -->
//                 <div *ngIf="successMessage" class="alert alert-success">
//                   {{ successMessage }}
//                 </div>

//                 <!-- Submit Button -->
//                 <div class="d-grid gap-2">
//                   <button
//                     type="submit"
//                     class="btn btn-primary btn-lg"
//                     [disabled]="isLoading || registrationForm.invalid"
//                   >
//                     <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
//                     <i *ngIf="!isLoading" class="fas fa-user-plus me-2"></i>
//                     {{ isLoading ? 'Creating Account...' : 'Create Account' }}
//                   </button>
//                 </div>

//                 <div class="text-center mt-3">
//                   <p class="mb-0">Already have an account? 
//                     <a routerLink="/login" class="text-decoration-none">Sign in here</a>
//                   </p>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .card {
//       border-radius: 15px;
//       border: none;
//     }
//     .card-header {
//       border-radius: 15px 15px 0 0 !important;
//       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//     }
//     .form-control:focus, .form-select:focus {
//       border-color: #667eea;
//       box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
//     }
//     .btn-primary {
//       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//       border: none;
//       border-radius: 10px;
//       padding: 12px;
//       font-weight: 500;
//     }
//     .btn-primary:hover {
//       background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
//       transform: translateY(-2px);
//       box-shadow: 0 4px 8px rgba(0,0,0,0.2);
//     }
//     .form-check-input:checked {
//       background-color: #667eea;
//       border-color: #667eea;
//     }
//     .fas {
//       color: #667eea;
//     }
//   `]
// })
// export class RegistrationComponent implements OnInit {
//   userData: UserRegistration = {
//     name: '',
//     gender: '',
//     password: '',
//     email: '',
//     phoneNumber: '',
//     roleId: 0,
//     skillIds: []
//   };

//   roles: Role[] = [];
//   skills: Skill[] = [];
//   isLoading = false;
//   errorMessages: string[] = [];
//   successMessage = '';

//   constructor(
//     private apiService: ApiService,
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.loadRoles();
//     this.loadSkills();
//   }

//   loadRoles(): void {
//     this.apiService.getRoles().subscribe({
//       next: (response) => {
//         if (response.success && response.data) {
//           this.roles = response.data;
//         }
//       },
//       error: (error) => {
//         console.error('Error loading roles:', error);
//       }
//     });
//   }

//   loadSkills(): void {
//     this.apiService.getSkills().subscribe({
//       next: (response) => {
//         if (response.success && response.data) {
//           this.skills = response.data;
//         }
//       },
//       error: (error) => {
//         console.error('Error loading skills:', error);
//       }
//     });
//   }

//   onSkillChange(event: any, skillId: number): void {
//     if (event.target.checked) {
//       this.userData.skillIds.push(skillId);
//     } else {
//       const index = this.userData.skillIds.indexOf(skillId);
//       if (index > -1) {
//         this.userData.skillIds.splice(index, 1);
//       }
//     }
//   }

//   onSubmit(form: NgForm): void {
//     if (form.valid) {
//       this.isLoading = true;
//       this.errorMessages = [];
//       this.successMessage = '';

//       this.apiService.register(this.userData).subscribe({
//         next: (response) => {
//           this.isLoading = false;
//           if (response.success && response.data) {
//             this.successMessage = 'Registration successful! Redirecting to login...';
//             this.authService.setCurrentUser(response.data);
//             setTimeout(() => {
//               this.router.navigate(['/posts']);
//             }, 2000);
//           } else {
//             this.errorMessages = response.errors || ['Registration failed'];
//           }
//         },
//         error: (error) => {
//           this.isLoading = false;
//           this.errorMessages = error.error?.errors || ['Registration failed. Please try again.'];
//         }
//       });
//     }
//   }
// }
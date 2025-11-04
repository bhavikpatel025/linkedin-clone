import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PostCreate, User } from '../../models/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="create-post-container">
      <!-- Header -->
      <div class="create-post-header">
        <div class="container">
          <div class="d-flex align-items-center justify-content-between py-3">
            <div class="d-flex align-items-center">
              <button class="btn btn-back me-3" routerLink="/dashboard">
                <i class="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 class="mb-0 fw-bold">Create a post</h4>
                <small class="text-muted">Share your thoughts with your network</small>
              </div>
            </div>
            <button class="btn btn-close" routerLink="/dashboard">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-md-10">
            <!-- User Info Card -->
            <div class="user-card mb-3">
              <div class="d-flex align-items-center">
                <div class="user-avatar me-3">
                  <!-- ✅ UPDATED: Show profile picture -->
                  @if (currentUserProfilePicture) {
                    <img [src]="currentUserProfilePicture" alt="Profile" class="avatar-image">
                  } @else {
                    <i class="bi bi-person-circle"></i>
                  }
                </div>
                <div>
                  <h6 class="mb-0 fw-bold">{{ currentUser?.name }}</h6>
                  <small class="text-muted">Posting to everyone</small>
                </div>
              </div>
            </div>

            <!-- Rest of your template remains the same -->
            <div class="post-card">
              <form [formGroup]="createPostForm" (ngSubmit)="onSubmit()">
                <!-- Content Area -->
                <div class="content-area">
                  <textarea
                    class="post-textarea"
                    formControlName="description"
                    [class.is-invalid]="isFieldInvalid('description')"
                    placeholder="What do you want to talk about?"
                    (input)="onContentChange()"
                    (keydown)="onKeydown($event)"></textarea>
                  
                  <!-- Character Counter -->
                  <div class="character-counter" [class.near-limit]="characterCount > 1800">
                    {{ characterCount }}/2000
                  </div>

                  <div class="invalid-feedback" *ngIf="isFieldInvalid('description')">
                    <div *ngIf="createPostForm.get('description')?.errors?.['required']">
                      Please write something to post
                    </div>
                    <div *ngIf="createPostForm.get('description')?.errors?.['maxlength']">
                      Post cannot exceed 2000 characters
                    </div>
                  </div>
                </div>

                <!-- Image Preview -->
                <div class="image-preview-section" *ngIf="previewUrl">
                  <div class="image-preview">
                    <img [src]="previewUrl" alt="Preview" class="preview-image">
                    <button
                      type="button"
                      class="btn-remove-image"
                      (click)="removeImage($event)">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                <!-- Add to your post -->
                <div class="add-to-post">
                  <div class="add-to-post-header">
                    <span class="text-muted">Add to your post</span>
                  </div>
                  <div class="add-to-post-actions">
                    <button type="button" class="btn-action" (click)="triggerFileInput()">
                      <i class="bi bi-image-fill text-success"></i>
                      <span>Photo</span>
                    </button>
                    
                    <button type="button" class="btn-action">
                      <i class="bi bi-camera-video-fill text-info"></i>
                      <span>Video</span>
                    </button>
                    
                    <button type="button" class="btn-action">
                      <i class="bi bi-calendar-event-fill text-warning"></i>
                      <span>Event</span>
                    </button>
                    
                    <button type="button" class="btn-action">
                      <i class="bi bi-file-text-fill text-danger"></i>
                      <span>Write article</span>
                    </button>
                  </div>
                </div>

                <!-- Hidden File Input -->
                <input
                  #fileInput
                  type="file"
                  class="d-none"
                  accept="image/*"
                  (change)="onFileSelected($event)">

                <!-- Post Button -->
                <div class="post-actions">
                  <button
                    type="submit"
                    class="btn-post"
                    [disabled]="loading || createPostForm.invalid"
                    [class.btn-post-disabled]="loading || createPostForm.invalid">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Posting...' : 'Post' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-post-container {
      min-height: 100vh;
      background-color: #f4f2ee;
      padding: 10px 0 10px 0;
    }

    .create-post-header {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .btn-back {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e0e0e0;
      background: white;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background-color: #f3f2ef;
      border-color: #0a66c2;
    }

    .btn-close {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e0e0e0;
      background: white;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background-color: #f3f2ef;
      border-color: #d11124;
    }

    .user-card {
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #eef3f8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #0a66c2;
      overflow: hidden; /* ✅ ADDED for profile pictures */
    }

    /* ✅ ADDED: Profile Picture Image Styles */
    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 16px;
    }

    .content-area {
      position: relative;
      padding: 20px;
    }

    .post-textarea {
      width: 100%;
      border: none;
      resize: none;
      font-size: 16px;
      line-height: 1.5;
      min-height: 120px;
      outline: none;
      font-family: inherit;
    }

    .post-textarea::placeholder {
      color: #666;
      font-weight: 400;
    }

    .post-textarea:focus {
      border: none;
      box-shadow: none;
    }

    .character-counter {
      text-align: right;
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .character-counter.near-limit {
      color: #d11124;
      font-weight: 600;
    }

    .image-preview-section {
      padding: 0 20px 20px;
    }

    .image-preview {
      position: relative;
      display: inline-block;
    }

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      object-fit: contain;
    }

    .btn-remove-image {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .btn-remove-image:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }

    .add-to-post {
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
    }

    .add-to-post-header {
      margin-bottom: 12px;
      font-size: 14px;
    }

    .add-to-post-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-action:hover {
      background-color: #f3f2ef;
      border-color: #0a66c2;
    }

    .post-actions {
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      text-align: right;
    }

    .btn-post {
      background: #0a66c2;
      color: white;
      border: none;
      border-radius: 24px;
      padding: 8px 24px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-post:hover:not(:disabled) {
      background: #004182;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
    }

    .btn-post-disabled {
      background: #ccc !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }

    /* ... rest of your existing styles ... */

    /* Responsive Design */
    @media (max-width: 768px) {
      .create-post-header {
        position: relative;
      }

      .container {
        padding: 0 12px;
      }

      .content-area {
        padding: 16px;
      }

      .post-textarea {
        min-height: 100px;
        font-size: 14px;
      }

      .add-to-post-actions {
        gap: 8px;
      }

      .btn-action {
        padding: 6px 12px;
        font-size: 12px;
      }

      .preview-image {
        max-height: 250px;
      }

      .user-card {
        padding: 12px 16px;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }
    }

    @media (max-width: 576px) {
      .add-to-post-actions {
        justify-content: space-between;
      }

      .btn-action {
        flex: 1;
        justify-content: center;
        min-width: 80px;
      }

      .post-actions {
        text-align: center;
      }

      .btn-post {
        width: 100%;
        max-width: 200px;
      }
    }

    /* Animation for new posts */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .post-card {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class CreatePostComponent implements OnInit {
  createPostForm: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  characterCount = 0;
  currentUser = this.authService.currentUserValue;
  
  // ✅ ADD THIS PROPERTY
  currentUserProfilePicture: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.createPostForm = this.formBuilder.group({
      description: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // ✅ ADD THIS - Load current user with profile picture
    this.loadCurrentUserWithProfilePicture();
  }

  // ✅ ADD THIS METHOD - Load fresh user data with profile picture
  loadCurrentUserWithProfilePicture(): void {
    if (this.currentUser) {
      this.apiService.getUserById(this.currentUser.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // ✅ Now we have fresh user data with profilePicture
            const userWithProfilePicture = response.data;
            this.currentUserProfilePicture = userWithProfilePicture.profilePicture 
              ? this.apiService.getImageUrl(userWithProfilePicture.profilePicture)
              : '';
            
            console.log('Profile picture loaded:', this.currentUserProfilePicture);
          }
        },
        error: (error) => {
          console.error('Error loading user profile picture:', error);
        }
      });
    }
  }

  // ... rest of your existing methods remain the same ...
  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPostForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onContentChange(): void {
    const content = this.createPostForm.get('description')?.value || '';
    this.characterCount = content.length;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.onSubmit();
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image size should not exceed 5MB',
          confirmButtonColor: '#0a66c2'
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPG, PNG, GIF)',
          confirmButtonColor: '#0a66c2'
        });
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit(): void {
    if (this.createPostForm.valid && this.currentUser) {
      this.loading = true;

      const postData: PostCreate = {
        description: this.createPostForm.value.description,
        userId: this.currentUser.id,
        photo: this.selectedFile || undefined
      };

      this.apiService.createPost(postData).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              icon: 'success',
              title: 'Posted!',
              text: 'Your post has been shared successfully',
              timer: 1500,
              showConfirmButton: false,
              background: '#fff',
              color: '#000'
            }).then(() => {
              this.router.navigate(['/dashboard']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.message || 'Failed to create post',
              confirmButtonColor: '#0a66c2'
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating post:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while creating the post',
            confirmButtonColor: '#0a66c2'
          });
          this.loading = false;
        }
      });
    } else {
      Object.keys(this.createPostForm.controls).forEach(key => {
        const control = this.createPostForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ConnectionService } from '../../services/connection.service';
import { PostCreate, User } from '../../models/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="create-post-container">
      <!-- Header -->
      <!-- <div class="create-post-header">
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
      </div> -->

      <!-- Main Content -->
      <div class="container">
        <div class="row justify-content-center">
          <!-- Left Sidebar -->
          <div class="col-lg-3 d-none d-lg-block">
            <div class="left-sidebar sticky-sidebar">
              <!-- Profile Card -->
              <div class="profile-card card border-0 shadow-sm mb-3">
                <div class="card-background"></div>
                <div class="card-body text-center p-0">
                  <div class="profile-content pt-4 px-3 pb-3">
                    <div class="profile-avatar mb-2">
                      <div class="avatar-container">
                        @if (currentUserProfilePicture) {
                          <img
                            [src]="currentUserProfilePicture"
                            alt="Profile"
                            class="avatar-image"
                          />
                        } @else {
                          <i class="bi bi-person-circle"></i>
                        }
                      </div>
                    </div>
                    <h6 class="mb-1 fw-bold text-dark">
                      {{ currentUser?.name }}
                    </h6>
                    <p class="text-muted small mb-2">
                      {{ currentUser?.roleName || 'Software Developer' }}
                    </p>
                  <p class="text-muted x-small mb-3">Ahmedabad, Gujarat</p>

                    <!-- Profile Stats -->
                    <div class="profile-stats border-top pt-3">
                      <div class="d-flex justify-content-between">
                        <div class="text-center flex-fill">
                          <small class="text-muted d-block">Connections</small>
                          <div class="fw-bold text-dark">
                            {{ connectionCount }}
                          </div>
                        </div>
                        <div class="text-center flex-fill">
                          <small class="text-muted d-block">Total Posts</small>
                          <div class="fw-bold text-dark">
                            {{ totalPostsCount }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Links -->
              <!-- <div class="saved-card card border-0 shadow-sm">
                <div class="card-body p-0">
                  <div class="saved-item p-3 border-bottom" routerLink="/saved-posts">
                    <i class="bi bi-bookmark me-2 text-muted"></i>
                    <span class="small">Saved Items</span>
                  </div>
                  <div class="saved-item p-3 border-bottom">
                    <i class="bi bi-people me-2 text-muted"></i>
                    <span class="small">Groups</span>
                  </div>
                  <div class="saved-item p-3 border-bottom">
                    <i class="bi bi-newspaper me-2 text-muted"></i>
                    <span class="small">Newsletters</span>
                  </div>
                  <div class="saved-item p-3">
                    <i class="bi bi-calendar-event me-2 text-muted"></i>
                    <span class="small">Events</span>
                  </div>
                </div>
              </div> -->
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="col-lg-6 col-md-10">
            <!-- Create Post Card -->
            <div class="create-post-main card border-0 shadow-sm">
              <!-- User Header -->
              <div class="post-header p-3 border-bottom">
                <div class="d-flex align-items-center">
                  <div class="user-avatar me-3">
                    @if (currentUserProfilePicture) {
                      <img [src]="currentUserProfilePicture" alt="Profile" class="avatar-image">
                    } @else {
                      <i class="bi bi-person-circle"></i>
                    }
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold">{{ currentUser?.name }}</h6>
                    <div class="privacy-selector mt-1">
                      <select class="form-select form-select-sm border-0 bg-light" style="width: auto; font-size: 0.8rem;">
                        <option selected>🌐 Anyone</option>
                        <option>👥 Connections only</option>
                        <option>🔒 Only me</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Post Form -->
              <form [formGroup]="createPostForm" (ngSubmit)="onSubmit()">
                <!-- Content Area -->
                <div class="content-area p-3">
                  <textarea
                    class="post-textarea"
                    formControlName="description"
                    [class.is-invalid]="isFieldInvalid('description')"
                    placeholder="What do you want to talk about?"
                    (input)="onContentChange()"
                    (keydown)="onKeydown($event)"
                    rows="4"></textarea>
                  
                  <!-- Character Counter -->
                  <div class="character-counter" [class.near-limit]="characterCount > 1800" [class.over-limit]="characterCount > 2000">
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
                <div class="image-preview-section px-3 pb-3" *ngIf="previewUrl">
                  <div class="image-preview-container">
                    <div class="image-preview">
                      <img [src]="previewUrl" alt="Preview" class="preview-image">
                      <button
                        type="button"
                        class="btn-remove-image"
                        (click)="removeImage($event)">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Add to Post Options -->
                <div class="add-to-post p-3 border-top">
                  <div class="add-to-post-header mb-2">
                    <span class="text-muted small fw-medium">Add to your post</span>
                  </div>
                  <div class="add-to-post-actions">
                    <button type="button" class="btn-post-option" (click)="triggerFileInput()">
                      <i class="bi bi-image text-success"></i>
                      <span class="ms-1">Photo</span>
                    </button>
                    
                    <button type="button" class="btn-post-option">
                      <i class="bi bi-camera-video text-info"></i>
                      <span class="ms-1">Video</span>
                    </button>
                    
                    <button type="button" class="btn-post-option">
                      <i class="bi bi-calendar-event text-warning"></i>
                      <span class="ms-1">Event</span>
                    </button>
                    
                    <button type="button" class="btn-post-option">
                      <i class="bi bi-file-text text-danger"></i>
                      <span class="ms-1">Article</span>
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
                <div class="post-actions p-3 border-top bg-light">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                    </div>
                    <button
                      type="submit"
                      class="btn-post"
                      [disabled]="loading || createPostForm.invalid || characterCount > 2000"
                      [class.btn-post-disabled]="loading || createPostForm.invalid || characterCount > 2000">
                      <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                      {{ loading ? 'Posting...' : 'Post' }}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Posting Tips -->
            <div class="tips-card card border-0 shadow-sm mt-3 d-lg-none">
              <div class="card-body">
                <h6 class="fw-bold mb-2">💡 Posting Tips</h6>
                <ul class="small text-muted mb-0 ps-3">
                  <li>Share professional achievements</li>
                  <li>Ask thoughtful questions</li>
                  <li>Engage with your network</li>
                  <li>Use relevant hashtags</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="col-lg-3 d-none d-lg-block">
            <div class="right-sidebar sticky-sidebar">
              <!-- Posting Tips -->
              <div class="tips-card card border-0 shadow-sm mb-3">
                <div class="card-body">
                  <h6 class="fw-bold mb-3">💡 Posting Tips</h6>
                  <div class="tip-item mb-3">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-lightning-fill text-warning me-2 mt-1"></i>
                      <div>
                        <small class="fw-medium d-block">Share achievements</small>
                        <small class="text-muted">Celebrate your professional milestones</small>
                      </div>
                    </div>
                  </div>
                  <div class="tip-item mb-3">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-chat-dots text-primary me-2 mt-1"></i>
                      <div>
                        <small class="fw-medium d-block">Ask questions</small>
                        <small class="text-muted">Engage your network with thoughtful queries</small>
                      </div>
                    </div>
                  </div>
                  <div class="tip-item">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-hash text-info me-2 mt-1"></i>
                      <div>
                        <small class="fw-medium d-block">Use hashtags</small>
                        <small class="text-muted">Increase visibility with relevant tags</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <!-- <div class="activity-card card border-0 shadow-sm">
                <div class="card-body">
                  <h6 class="fw-bold mb-3">📈 Your Impact</h6>
                  <div class="activity-stats">
                    <div class="stat-item d-flex justify-content-between align-items-center mb-2">
                      <small class="text-muted">Posts this month</small>
                      <small class="fw-bold text-dark">{{ recentPostsCount }}</small>
                    </div>
                    <div class="stat-item d-flex justify-content-between align-items-center mb-2">
                      <small class="text-muted">Avg. engagement</small>
                      <small class="fw-bold text-dark">{{ avgEngagement }}%</small>
                    </div>
                    <div class="stat-item d-flex justify-content-between align-items-center">
                      <small class="text-muted">New connections</small>
                      <small class="fw-bold text-success">+{{ newConnections }}</small>
                    </div>
                  </div>
                </div>
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-post-container {
      min-height: 100vh;
      background-color: #f3f2ef;
      padding: 20px 0;
    }

    .create-post-header {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      color: #666;
    }

    .btn-back:hover {
      background-color: #f3f2ef;
      border-color: #0a66c2;
      color: #0a66c2;
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
      color: #666;
    }

    .btn-close:hover {
      background-color: #f3f2ef;
      border-color: #d11124;
      color: #d11124;
    }

    /* Sticky Sidebar */
    .sticky-sidebar {
      position: sticky;
      top: 80px;
      height: calc(100vh - 100px);
      overflow-y: auto;
    }

    .sticky-sidebar::-webkit-scrollbar {
      width: 4px;
    }

    .sticky-sidebar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .sticky-sidebar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 10px;
    }

    .sticky-sidebar::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Cards */
    .card {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    /* Profile Card */
    .profile-card {
      position: relative;
      overflow: hidden;
    }

    .card-background {
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px 8px 0 0;
    }

    .profile-content {
      margin-top: -40px;
    }

    .avatar-container {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: white;
      border: 4px solid white;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .avatar-container i {
      font-size: 2.5rem;
      color: #666;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-stats {
      font-size: 0.8rem;
    }

    .x-small {
      font-size: 0.75rem;
    }

    /* Saved Items */
    .saved-item {
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-radius: 4px;
      margin: 2px;
    }

    .saved-item:hover {
      background-color: #f8f9fa;
    }

    /* Main Post Card */
    .create-post-main {
      background: white;
    }

    .post-header {
      background: white;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #eef3f8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: #0a66c2;
      overflow: hidden;
      flex-shrink: 0;
    }

    .privacy-selector .form-select {
      background-color: #f8f9fa;
      border-radius: 16px;
      padding: 2px 12px;
      font-size: 0.8rem;
    }

    .privacy-selector .form-select:focus {
      box-shadow: none;
      border-color: #0a66c2;
    }

    /* Content Area */
    .content-area {
      background: white;
    }

    .post-textarea {
      width: 100%;
      border: none;
      resize: none;
      font-size: 16px;
      line-height: 1.5;
      outline: none;
      font-family: inherit;
      background: white;
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
      font-weight: 500;
    }

    .character-counter.near-limit {
      color: #ff9800;
    }

    .character-counter.over-limit {
      color: #d11124;
      font-weight: 600;
    }

    /* Image Preview */
    .image-preview-container {
      position: relative;
    }

    .image-preview {
      position: relative;
      display: inline-block;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
      display: block;
    }

    .btn-remove-image {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all 0.2s ease;
    }

    .btn-remove-image:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.1);
    }

    /* Add to Post Options */
    .add-to-post {
      background: white;
    }

    .btn-post-option {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      color: #666;
    }

    .btn-post-option:hover {
      background-color: #f3f2ef;
      border-color: #0a66c2;
      color: #000;
      transform: translateY(-1px);
    }

    .add-to-post-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Post Actions */
    .post-actions {
      background: #f8f9fa;
      border-radius: 0 0 8px 8px;
    }

    .btn-post {
      background: #0a66c2;
      color: white;
      border: none;
      border-radius: 24px;
      padding: 8px 24px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      cursor: pointer;
      min-width: 80px;
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

    /* Tips Card */
    .tips-card {
      background: white;
    }

    .tip-item {
      padding: 8px 0;
    }

    .tip-item:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }

    /* Activity Stats */
    .activity-stats {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }

    .stat-item {
      padding: 4px 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .create-post-container {
        padding: 60px 0 20px 0;
      }

      .create-post-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .container {
        padding: 0 12px;
      }

      .content-area {
        padding: 16px;
      }

      .post-textarea {
        min-height: 120px;
        font-size: 14px;
      }

      .add-to-post-actions {
        gap: 6px;
      }

      .btn-post-option {
        padding: 6px 12px;
        font-size: 12px;
      }

      .preview-image {
        max-height: 250px;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
      }

      .avatar-container {
        width: 60px;
        height: 60px;
      }
    }

    @media (max-width: 576px) {
      .add-to-post-actions {
        justify-content: space-between;
      }

      .btn-post-option {
        flex: 1;
        justify-content: center;
        min-width: 70px;
      }

      .post-actions {
        text-align: center;
      }

      .btn-post {
        width: 100%;
        max-width: 200px;
      }

      .avatar-container {
        width: 50px;
        height: 50px;
      }
    }

    /* Animations */
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

    .create-post-main {
      animation: slideIn 0.3s ease-out;
    }

    /* Loading States */
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }

    /* Invalid State */
    .is-invalid {
      border-color: #dc3545 !important;
    }

    .invalid-feedback {
      display: block;
      font-size: 0.8rem;
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
  
  // User data properties
  connectionCount = 0;
  totalPostsCount = 0;
  recentPostsCount = 0;
  avgEngagement = 0;
  newConnections = 0;
  currentUserProfilePicture: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private connectionService: ConnectionService,
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
    
    this.loadCurrentUserWithProfilePicture();
    this.loadConnectionCount();
    this.loadTotalPostsCount();
    this.loadUserStats();
  }

  // Load user profile picture and data
  loadCurrentUserWithProfilePicture(): void {
    if (this.currentUser) {
      this.apiService.getUserById(this.currentUser.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const userWithProfilePicture = response.data;
            this.currentUserProfilePicture = userWithProfilePicture.profilePicture 
              ? this.apiService.getImageUrl(userWithProfilePicture.profilePicture)
              : '';
          }
        },
        error: (error) => {
          console.error('Error loading user profile picture:', error);
        }
      });
    }
  }

  // Load connection count
  loadConnectionCount(): void {
    const userId = this.authService.getCurrentUserId();
    this.connectionService.getConnectionCount(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.connectionCount = response.data ?? 0;
        }
      },
      error: (error) => {
        console.error('Error loading connection count:', error);
        this.connectionCount = 145; // Fallback
      }
    });
  }

  // Load total posts count
  // ✅ UPDATE THIS METHOD - Load total posts count using existing getUserPosts
loadTotalPostsCount(): void {
  const userId = this.authService.getCurrentUserId();
  this.apiService.getUserPosts(userId).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.totalPostsCount = response.data.length || 0;
      }
    },
    error: (error) => {
      console.error('Error loading posts count:', error);
      this.totalPostsCount = 24; // Fallback
    }
  });
}

  // Load user engagement stats
  loadUserStats(): void {
    // These would typically come from your analytics API
    this.recentPostsCount = 3;
    this.avgEngagement = 12;
    this.newConnections = 8;
  }

  // Form validation
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
          confirmButtonColor: '#0a66c2',
          background: '#fff'
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPG, PNG, GIF)',
          confirmButtonColor: '#0a66c2',
          background: '#fff'
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
    if (this.createPostForm.valid && this.currentUser && this.characterCount <= 2000) {
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
              title: 'Posted Successfully!',
              text: 'Your post has been shared with your network',
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
              confirmButtonColor: '#0a66c2',
              background: '#fff'
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
            confirmButtonColor: '#0a66c2',
            background: '#fff'
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
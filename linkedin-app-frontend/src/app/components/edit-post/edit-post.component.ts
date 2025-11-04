import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Post, PostUpdate } from '../../models/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="edit-post-container">
      <!-- Header -->
      <div class="edit-post-header">
        <div class="container">
          <div class="d-flex align-items-center justify-content-between py-3">
            <div class="d-flex align-items-center">
              <button class="btn btn-back me-3" routerLink="/dashboard">
                <i class="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 class="mb-0 fw-bold">Edit post</h4>
                <small class="text-muted">Update your post content</small>
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
  @if (currentUserProfilePicture) {
    <img [src]="currentUserProfilePicture" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle"></i>
  }
</div>
                <div>
                  <h6 class="mb-0 fw-bold">{{ currentUser?.name }}</h6>
                  <small class="text-muted">Editing post • Anyone can see this</small>
                </div>
              </div>
            </div>

            <!-- Preview Card -->
            <!-- <div class="preview-card mb-3" *ngIf="!loading && editPostForm.get('description')?.value">
              <div class="preview-header">
                <h6 class="mb-2 fw-bold">Preview</h6>
                <small class="text-muted">How your updated post will appear</small>
              </div>
              <div class="preview-content">
                <div class="preview-text" [innerHTML]="getFormattedPreview()"></div>
                <button 
                  class="btn-see-more" 
                  *ngIf="shouldShowSeeMore()"
                  (click)="togglePreview()">
                  {{ showFullPreview ? 'See less' : '...see more' }}
                </button>
              </div>
              <div class="preview-image" *ngIf="getPreviewImageUrl()">
                <img [src]="getPreviewImageUrl()" alt="Preview" class="preview-img">
              </div>
            </div> -->

            <!-- Main Edit Card -->
            <div class="edit-card">
              <form [formGroup]="editPostForm" (ngSubmit)="onSubmit()">
                <!-- Content Area -->
                <div class="content-area">
                  <textarea
                    class="post-textarea"
                    formControlName="description"
                    [class.is-invalid]="isFieldInvalid('description')"
                    placeholder="What do you want to talk about?"
                    (input)="onContentChange()"
                    (keydown)="onKeydown($event)"
                    (keyup)="checkLineBreaks()"></textarea>
                  
                  <!-- Formatting Tips -->
                  <!-- <div class="formatting-tips">
                    <small class="text-muted">
                      <i class="bi bi-info-circle me-1"></i>
                      Press Enter for new lines • Use empty lines for paragraphs
                    </small>
                  </div> -->

                  <!-- Character Counter -->
                  <div class="character-counter" [class.near-limit]="characterCount > 1800">
                    {{ characterCount }}/2000
                  </div>

                  <div class="invalid-feedback" *ngIf="isFieldInvalid('description')">
                    <div *ngIf="editPostForm.get('description')?.errors?.['required']">
                      Please write something to post
                    </div>
                    <div *ngIf="editPostForm.get('description')?.errors?.['maxlength']">
                      Post cannot exceed 2000 characters
                    </div>
                  </div>
                </div>

                <!-- Image Management Section -->
                <div class="image-management" *ngIf="existingImageUrl || previewUrl">
                  <div class="image-management-header">
                    <span class="text-muted">Post image</span>
                  </div>
                  
                  <!-- Existing Image -->
                  <div class="existing-image-section" *ngIf="existingImageUrl && !previewUrl">
                    <div class="image-container">
                      <img [src]="existingImageUrl" alt="Current" class="current-image">
                      <div class="image-actions">
                        <button type="button" class="btn-action btn-remove" (click)="removeExistingImage()">
                          <i class="bi bi-trash"></i>
                          Remove
                        </button>
                        <button type="button" class="btn-action btn-replace" (click)="triggerFileInput()">
                          <i class="bi bi-arrow-repeat"></i>
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- New Image Preview -->
                  <div class="new-image-section" *ngIf="previewUrl">
                    <div class="image-container">
                      <img [src]="previewUrl" alt="New" class="new-image">
                      <div class="image-actions">
                        <button type="button" class="btn-action btn-remove" (click)="removeNewImage($event)">
                          <i class="bi bi-x"></i>
                          Remove new image
                        </button>
                        <span class="badge-new">New</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add to your post -->
                <div class="add-to-post">
                  <div class="add-to-post-header">
                    <span class="text-muted">Add to your post</span>
                    <!-- <button 
                      type="button" 
                      class="btn-preview-toggle"
                      (click)="togglePreviewSection()">
                      {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
                    </button> -->
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

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <button
                    type="button"
                    class="btn-cancel"
                    routerLink="/dashboard"
                    [disabled]="submitting">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn-save"
                    [disabled]="submitting || editPostForm.invalid"
                    [class.btn-save-disabled]="submitting || editPostForm.invalid">
                    <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2"></span>
                    {{ submitting ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div class="loading-state" *ngIf="loading">
              <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading your post...</p>
              </div>
            </div>

            <!-- Tips Card -->
            <!-- <div class="tips-card" *ngIf="!loading">
              <div class="tips-header">
                <i class="bi bi-lightbulb me-2"></i>
                <span class="fw-bold">Editing tips</span>
              </div>
              <ul class="tips-list">
                <li>Keep your updates professional and respectful</li>
                <li>Consider adding relevant hashtags</li>
                <li>Check for typos and grammar</li>
                <li>Make sure your message is clear and concise</li>
              </ul>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .edit-post-container {
      min-height: 100vh;
      background-color: #f4f2ee;
       padding: 10px 0 10px 0;      
    }

    .edit-post-header {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .btn-back, .btn-close {
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

    .btn-close:hover {
      background-color: #f3f2ef;
      border-color: #d11124;
    }

    .user-card, .preview-card, .edit-card, .tips-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      margin-bottom: 16px;
    }

    .user-card {
      padding: 16px 20px;
    }

    .preview-card {
      padding: 20px;
    }

    .edit-card {
      padding: 0;
      overflow: hidden;
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
      overflow: hidden;

    }
    .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

    .preview-header {
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }

    .preview-content {
      line-height: 1.6;
      font-size: 14px;
      color: #333;
      margin-bottom: 16px;
    }

    .preview-text {
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: {{ showFullPreview ? 'none' : '120px' }};
      overflow: hidden;
    }

    .btn-see-more {
      background: none;
      border: none;
      color: #0a66c2;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 0;
      margin-top: 4px;
    }

    .btn-see-more:hover {
      text-decoration: underline;
      background-color: #f0f7ff;
    }

    .preview-image {
      margin-top: 12px;
    }

    .preview-img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      object-fit: contain;
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
      line-height: 1.6;
      min-height: 120px;
      outline: none;
      font-family: inherit;
      white-space: pre-wrap;
    }

    .post-textarea::placeholder {
      color: #666;
      font-weight: 400;
    }

    .post-textarea:focus {
      border: none;
      box-shadow: none;
    }

    .formatting-tips {
      margin-top: 8px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #0a66c2;
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

    .image-management {
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
    }

    .image-management-header {
      margin-bottom: 12px;
      font-size: 14px;
      color: #666;
    }

    .image-container {
      position: relative;
      display: inline-block;
    }

    .current-image, .new-image {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      object-fit: contain;
    }

    .image-actions {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-remove {
      color: #d11124;
      border-color: #d11124;
    }

    .btn-remove:hover {
      background: #d11124;
      color: white;
    }

    .btn-replace {
      color: #0a66c2;
      border-color: #0a66c2;
    }

    .btn-replace:hover {
      background: #0a66c2;
      color: white;
    }

    .badge-new {
      background: #0a66c2;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .add-to-post {
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
    }

    .add-to-post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .btn-preview-toggle {
      background: none;
      border: 1px solid #0a66c2;
      color: #0a66c2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-preview-toggle:hover {
      background: #0a66c2;
      color: white;
    }

    .add-to-post-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .add-to-post-actions .btn-action {
      border: 1px solid #e0e0e0;
      background: white;
      color: #666;
      font-size: 14px;
      padding: 8px 16px;
    }

    .add-to-post-actions .btn-action:hover {
      background-color: #f3f2ef;
      border-color: #0a66c2;
      color: #000;
    }

    .action-buttons {
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-cancel {
      background: white;
      color: #666;
      border: 1px solid #e0e0e0;
      border-radius: 24px;
      padding: 8px 24px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #666;
    }

    .btn-save {
      background: #0a66c2;
      color: white;
      border: none;
      border-radius: 24px;
      padding: 8px 24px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-save:hover:not(:disabled) {
      background: #004182;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
    }

    .btn-save-disabled {
      background: #ccc !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }

    .loading-state {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      padding: 60px 20px;
      text-align: center;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .tips-card {
      padding: 20px;
    }

    .tips-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      color: #0a66c2;
      font-size: 14px;
    }

    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .tips-list li {
      padding: 4px 0;
      font-size: 13px;
      color: #666;
      position: relative;
      padding-left: 16px;
      line-height: 1.4;
    }

    .tips-list li:before {
      content: '•';
      color: #0a66c2;
      position: absolute;
      left: 0;
    }

    .invalid-feedback {
      display: block;
      font-size: 12px;
      color: #d11124;
      margin-top: 4px;
    }

    .is-invalid {
      border: 1px solid #d11124 !important;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .edit-post-header {
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

      .add-to-post-actions .btn-action {
        padding: 6px 12px;
        font-size: 12px;
      }

      .current-image, .new-image {
        max-height: 200px;
      }

      .user-card, .preview-card {
        padding: 12px 16px;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }

      .add-to-post-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-cancel, .btn-save {
        width: 100%;
      }
    }

    @media (max-width: 576px) {
      .add-to-post-actions {
        justify-content: space-between;
      }

      .add-to-post-actions .btn-action {
        flex: 1;
        justify-content: center;
        min-width: 80px;
      }

      .image-actions {
        position: relative;
        bottom: auto;
        right: auto;
        margin-top: 8px;
        justify-content: center;
      }
    }
  `]
})
export class EditPostComponent implements OnInit {
  editPostForm: FormGroup;
  loading = false;
  submitting = false;
  postId: number = 0;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingImageUrl: string | null = null;
  existingPhotoPath: string | null = null;
  characterCount = 0;
  showPreview = true;
  showFullPreview = false;
  currentUser = this.authService.currentUserValue;
  currentUserProfilePicture: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.editPostForm = this.formBuilder.group({
      description: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
     this.loadCurrentUserProfilePicture();

    this.route.params.subscribe(params => {
      this.postId = +params['id'];
      if (this.postId) {
        this.loadPost();
      }
    });
  }

  loadPost(): void {
    this.loading = true;
    const userId = this.authService.getCurrentUserId();

    this.apiService.getPostById(this.postId, userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const post = response.data;

          // Check if current user is the owner
          if (post.userId !== this.currentUser?.id) {
            Swal.fire({
              icon: 'error',
              title: 'Unauthorized',
              text: 'You can only edit your own posts',
              confirmButtonColor: '#0a66c2'
            }).then(() => {
              this.router.navigate(['/dashboard']);
            });
            return;
          }

          // Populate form
          this.editPostForm.patchValue({
            description: post.description
          });

          // Set character count
          this.characterCount = post.description.length;

          // Set existing image if available
          if (post.photoPath) {
            this.existingPhotoPath = post.photoPath;
            this.existingImageUrl = this.apiService.getImageUrl(post.photoPath);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading post:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load post',
          confirmButtonColor: '#0a66c2'
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
        this.loading = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editPostForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onContentChange(): void {
    const content = this.editPostForm.get('description')?.value || '';
    this.characterCount = content.length;
  }

  checkLineBreaks(): void {
    // This ensures line breaks are preserved in the textarea
    const textarea = document.querySelector('.post-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.whiteSpace = 'pre-wrap';
      textarea.style.wordWrap = 'break-word';
    }
  }

  onKeydown(event: KeyboardEvent): void {
    // Allow Ctrl+Enter to submit
    if (event.ctrlKey && event.key === 'Enter') {
      this.onSubmit();
    }
  }

  getFormattedPreview(): string {
    const content = this.editPostForm.get('description')?.value || '';
    
    if (!this.showFullPreview && content.length > 200) {
      const truncated = content.substring(0, 200);
      return this.formatText(truncated);
    }
    
    return this.formatText(content);
  }

  formatText(text: string): string {
    // Convert line breaks to HTML and add basic formatting
    return text
      .replace(/\n/g, '<br>')
      .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
      .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
      .replace(/#(\w+)/g, '<strong class="hashtag">#$1</strong>');
  }

  shouldShowSeeMore(): boolean {
    const content = this.editPostForm.get('description')?.value || '';
    return content.length > 200;
  }

  togglePreview(): void {
    this.showFullPreview = !this.showFullPreview;
  }

  togglePreviewSection(): void {
    this.showPreview = !this.showPreview;
    if (this.showPreview) {
      this.showFullPreview = false;
    }
  }

  getPreviewImageUrl(): string | null {
    return this.previewUrl || this.existingImageUrl;
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image size should not exceed 5MB',
          confirmButtonColor: '#0a66c2'
        });
        return;
      }

      // Validate file type
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      // Hide existing image when new one is selected
      this.existingImageUrl = null;
    }
  }

  removeExistingImage(): void {
    this.existingImageUrl = null;
    this.existingPhotoPath = null;
  }

  removeNewImage(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;

    // Show existing image again if it exists
    if (this.existingPhotoPath) {
      this.existingImageUrl = this.apiService.getImageUrl(this.existingPhotoPath);
    }
  }

  // showVideoAlert(): void {
  //   Swal.fire({
  //     icon: 'info',
  //     title: 'Video Upload',
  //     text: 'Video upload feature is coming soon!',
  //     confirmButtonColor: '#0a66c2'
  //   });
  // }

  // showEventAlert(): void {
  //   Swal.fire({
  //     icon: 'info',
  //     title: 'Create Event',
  //     text: 'Event creation feature is coming soon!',
  //     confirmButtonColor: '#0a66c2'
  //   });
  // }

  // showArticleAlert(): void {
  //   Swal.fire({
  //     icon: 'info',
  //     title: 'Write Article',
  //     text: 'Article writing feature is coming soon!',
  //     confirmButtonColor: '#0a66c2'
  //   });
  // }

  onSubmit(): void {
    if (this.editPostForm.valid) {
      this.submitting = true;

      const postData: PostUpdate = {
        id: this.postId,
        description: this.editPostForm.value.description,
        photo: this.selectedFile || undefined,
        existingPhotoPath: this.existingPhotoPath || undefined
      };

      this.apiService.updatePost(postData).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your post has been updated successfully',
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
              text: response.message || 'Failed to update post',
              confirmButtonColor: '#0a66c2'
            });
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error updating post:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating the post',
            confirmButtonColor: '#0a66c2'
          });
          this.submitting = false;
        }
      });
    } else {
      Object.keys(this.editPostForm.controls).forEach(key => {
        const control = this.editPostForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  loadCurrentUserProfilePicture(): void {
  if (this.currentUser) {
    this.apiService.getUserById(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUserProfilePicture = response.data.profilePicture 
            ? this.apiService.getImageUrl(response.data.profilePicture)
            : '';
        }
      },
      error: (error) => {
        console.error('Error loading user profile picture:', error);
      }
    });
  }
}
}
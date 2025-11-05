import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SavedPost, Post } from '../../models/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-saved-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="saved-posts-container">
      <div class="container">
        <!-- Modern Header -->
       <div class="saved-posts-header">
  <div class="header-container">
    <div class="header-main">
      <div class="header-left">
        <div class="header-icon-container">
          <i class="bi bi-bookmark-fill header-icon"></i>
        </div>
        <div class="header-text">
          <h2 class="header-title">Saved Posts</h2>
          <p class="header-subtitle">
            Your curated collection
            <span *ngIf="savedPosts.length > 0" class="post-count">
              • {{ savedPosts.length }} {{ savedPosts.length === 1 ? 'item' : 'items' }}
            </span>
          </p>
        </div>
      </div>
      <button class="btn btn-outline-secondary btn-back" routerLink="/dashboard">
        <i class="bi bi-arrow-left me-2"></i>
        Back to Feed
      </button>
    </div>
  </div>
</div>
        <!-- Content -->
        <div class="saved-posts-content">
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-state">
            <div class="spinner-container">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3 text-muted loading-text">Loading your saved posts...</p>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading && savedPosts.length === 0" class="empty-state">
            <div class="empty-content text-center">
              <div class="empty-icon">
                <i class="bi bi-bookmark-heart"></i>
              </div>
              <h3 class="empty-title">No saved posts yet</h3>
              <p class="empty-description">
                When you discover posts that inspire you, save them here to revisit later.
              </p>
              <a routerLink="/dashboard" class="btn btn-primary btn-explore">
                <i class="bi bi-compass me-2"></i>
                Explore Posts
              </a>
            </div>
          </div>

          <!-- Saved Posts Grid -->
          <div *ngIf="!loading && savedPosts.length > 0" class="saved-posts-grid">
            <div class="row g-4">
              <div 
                class="col-12" 
                *ngFor="let savedPost of savedPosts; trackBy: trackBySavedPostId"
              >
                <div class="saved-post-card">
                  <div class="card-body">
                    <!-- Post Header -->
                    <div class="post-header">
                      <div class="user-info">
                        <div class="user-avatar">
                          @if (savedPost.post?.userProfilePicture) {
                            <img 
                              [src]="apiService.getImageUrl(savedPost.post?.userProfilePicture)" 
                              alt="Profile" 
                              class="avatar-image"
                              (error)="handleImageError($event)"
                            />
                          } @else {
                            <div class="avatar-placeholder">
                              <i class="bi bi-person-circle"></i>
                            </div>
                          }
                        </div>
                        <div class="user-details">
                          <h6 class="user-name">{{ savedPost.post?.userName || 'Unknown User' }}</h6>
                          <div class="post-meta">
                            <span class="post-date">{{ formatDate(savedPost.post?.createdDate) }}</span>
                            <span class="meta-separator">•</span>
                            <span class="saved-date">Saved {{ formatDate(savedPost.savedAt) }}</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Action Menu -->
                      <div class="action-menu">
                        <div class="dropdown">
                          <button class="btn btn-ghost btn-sm" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                          </button>
                          <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                              <button class="dropdown-item text-danger" (click)="unsavePost(savedPost)">
                                <i class="bi bi-bookmark-x me-2"></i>
                                Remove from saved
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <!-- Post Content -->
                    <div class="post-content">
                      <!-- Post Text with Truncation -->
                      <div class="post-text-container" *ngIf="savedPost.post?.description">
                        <div 
                          class="post-text"
                          [class.truncated]="isPostTruncated(savedPost.post!.id)"
                          [innerHTML]="formatPostText(savedPost.post?.description)"
                        ></div>
                        <button 
                          *ngIf="shouldShowMoreButton(savedPost.post?.description)"
                          class="btn-show-more"
                          (click)="togglePostText(savedPost.post!.id)"
                        >
                          {{ isPostTruncated(savedPost.post!.id) ? '...more' : '...less' }}
                        </button>
                      </div>

                      <!-- Post Image -->
                      <div class="post-media" *ngIf="savedPost.post?.photoPath">
                        <img 
                          [src]="apiService.getImageUrl(savedPost.post?.photoPath)" 
                          [alt]="savedPost.post?.description || 'Post image'"
                          class="post-image"
                          (error)="handleImageError($event)"
                        />
                      </div>
                    </div>

                    <!-- Post Stats -->
                    <div class="post-stats">
                      <div class="stats-container">
                        <span class="stat-item">
                          <i class="bi bi-hand-thumbs-up stat-icon"></i>
                          <span class="stat-count">{{ savedPost.post?.likesCount || 0 }}</span>
                          <span class="stat-label">likes</span>
                        </span>
                        <span class="stat-item">
                          <i class="bi bi-chat stat-icon"></i>
                          <span class="stat-count">{{ savedPost.post?.commentsCount || 0 }}</span>
                          <span class="stat-label">comments</span>
                        </span>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="post-actions">
                      <button 
                        class="btn btn-outline-primary btn-sm btn-view"
                        (click)="viewOriginalPost(savedPost.post?.id)"
                      >
                        <i class="bi bi-eye me-2"></i>
                        View Original Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .saved-posts-container {
  min-height: 100vh;
  background-color: #f3f2ef;
  padding: 20px;
}

/* Compact Header */
.saved-posts-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1.5rem;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.header-icon-container {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0a66c2 0%, #00a0dc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon {
  font-size: 1.25rem;
  color: white;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
  font-weight: 500;
}

.post-count {
  color: #0a66c2;
  font-weight: 600;
}

.btn-back {
  border-radius: 12px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1.5px solid #e2e8f0;
  color: #4a5568;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  color: #2d3748;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.spinner-container {
  text-align: center;
}

.loading-text {
  font-size: 1.1rem;
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.empty-content {
  max-width: 500px;
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  color: #0a66c2;
  opacity: 0.7;
  margin-bottom: 1.5rem;
}

.empty-title {
  color: #2d3748;
  margin-bottom: 1rem;
  font-weight: 700;
}

.empty-description {
  color: #718096;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-explore {
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(10, 102, 194, 0.4);
}

/* Saved Posts Grid */
.saved-posts-grid {
  max-width: 800px;
  margin: 0 auto;
}

/* Saved Post Card */
.saved-post-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.saved-post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-body {
  padding: 2rem;
}

/* Post Header */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  border: 3px solid #e2e8f0;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #0a66c2;
  font-size: 1.8rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.post-meta {
  font-size: 0.875rem;
  color: #718096;
}

.meta-separator {
  margin: 0 0.5rem;
}

.action-menu .btn-ghost {
  color: #718096;
  border: none;
  padding: 0.5rem;
}

.action-menu .btn-ghost:hover {
  background: #f7fafc;
  color: #2d3748;
}

/* Post Content */
.post-text-container {
  margin-bottom: 1.5rem;
}

.post-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #2d3748;
  white-space: pre-line;
  word-wrap: break-word;
}

.post-text.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3.2em;
  line-height: 1.6em;
}

.btn-show-more {
  background: none;
  border: none;
  color: #0a66c2;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0;
  margin-top: 0.5rem;
}

.btn-show-more:hover {
  text-decoration: underline;
}

.post-media {
  margin-top: 1rem;
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Post Stats */
.post-stats {
  margin: 1.5rem 0;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.stats-container {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  color: #718096;
  font-size: 0.9rem;
}

.stat-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.stat-count {
  font-weight: 600;
  margin-right: 0.25rem;
}

.stat-label {
  font-weight: 500;
}

/* Action Buttons */
.post-actions {
  display: flex;
  gap: 1rem;
}

.btn-view {
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-view:hover {
  background: #0a66c2;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(10, 102, 194, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .saved-posts-container {
    padding: 15px 10px;
  }

  .saved-posts-header {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-left {
    justify-content: center;
    text-align: center;
  }

  .header-icon-container {
    width: 40px;
    height: 40px;
  }

  .header-icon {
    font-size: 1.1rem;
  }

  .header-title {
    font-size: 1.35rem;
  }

  .btn-back {
    width: 100%;
    order: -1;
    margin-bottom: 0.5rem;
  }

  .card-body {
    padding: 1.5rem;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
  }

  .post-header {
    flex-direction: column;
    gap: 1rem;
  }

  .action-menu {
    align-self: flex-end;
  }

  .stats-container {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 576px) {
  .header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .header-text {
    text-align: center;
  }
}
  `]
})
export class SavedPostsComponent implements OnInit {
  savedPosts: SavedPost[] = [];
  loading = false;
  truncatedPosts: Set<number> = new Set();

  constructor(
    public apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSavedPosts();
  }

  loadSavedPosts(): void {
    this.loading = true;
    const userId = this.authService.getCurrentUserId();

    this.apiService.getUserSavedPosts(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.savedPosts = response.data;
          
          // Initialize truncation for posts with long descriptions
          this.savedPosts.forEach(savedPost => {
            if (savedPost.post && this.shouldShowMoreButton(savedPost.post.description)) {
              this.truncatedPosts.add(savedPost.post.id);
            }
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading saved posts:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load saved posts',
          background: '#fff',
          color: '#2d3748',
          customClass: {
            popup: 'modern-swal'
          }
        });
      }
    });
  }

  // Format post text to preserve line breaks
  formatPostText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>').replace(/\r/g, '');
  }

  // Check if post should show "more" button (after 2 lines)
  shouldShowMoreButton(text: string | undefined): boolean {
    if (!text) return false;

    const lineCount = (text.match(/\n/g) || []).length + 1;
    const charCount = text.length;

    // Show more button if text has more than 2 lines or more than 120 characters
    return lineCount > 2 || charCount > 120;
  }

  // Check if post is currently truncated
  isPostTruncated(postId: number): boolean {
    return this.truncatedPosts.has(postId);
  }

  // Toggle post text between truncated and full
  togglePostText(postId: number): void {
    if (this.truncatedPosts.has(postId)) {
      this.truncatedPosts.delete(postId);
    } else {
      this.truncatedPosts.add(postId);
    }
  }

  unsavePost(savedPost: SavedPost): void {
    const userId = this.authService.getCurrentUserId();

    Swal.fire({
      title: 'Remove from saved?',
      text: 'This post will be removed from your saved items',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0a66c2',
      cancelButtonColor: '#718096',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#2d3748',
      customClass: {
        popup: 'modern-swal'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.unsavePost(userId, savedPost.postId).subscribe({
          next: (response) => {
            if (response.success) {
              this.savedPosts = this.savedPosts.filter(sp => sp.id !== savedPost.id);
              
              Swal.fire({
                icon: 'success',
                title: 'Removed!',
                text: 'Post removed from your saved items',
                timer: 1500,
                showConfirmButton: false,
                background: '#fff',
                color: '#2d3748',
                customClass: {
                  popup: 'modern-swal'
                }
              });
            }
          },
          error: (error) => {
            console.error('Error unsaving post:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to remove post',
              background: '#fff',
              color: '#2d3748',
              customClass: {
                popup: 'modern-swal'
              }
            });
          }
        });
      }
    });
  }

  viewOriginalPost(postId: number | undefined): void {
    if (postId) {
      // Navigate to dashboard and scroll to the post
      window.location.href = `/dashboard#post-${postId}`;
    }
  }

  handleImageError(event: any): void {
    event.target.style.display = 'none';
  }

  trackBySavedPostId(index: number, savedPost: SavedPost): number {
    return savedPost.id;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    
    // Parse the date as UTC
    const date = new Date(dateString + 'Z'); // Add 'Z' to indicate UTC
    const now = new Date();
    
    // Use UTC methods for consistent calculation
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // For older dates, format normally
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ConnectionService } from '../../services/connection.service';
import { NotificationService } from '../../services/notification.service';
import { CreateNotification } from '../../models/notification';
import {
  Post,
  CommentCreate,
  Comment,
  Reply,
  ReplyCreate,
} from '../../models/models';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <div class="container-fluid">
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
    <img [src]="currentUserProfilePicture" alt="Profile" class="avatar-image">
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
                            <!-- CHANGED: Use property instead of method -->
                          </div>
                        </div>
                        <div class="text-center flex-fill">
                          <small class="text-muted d-block">Total Posts</small>
                          <div class="fw-bold text-dark">
                            {{ getUserPostCount() }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Premium Card -->
              <!-- <div class="premium-card card border-0 shadow-sm mb-3">
                <div class="card-body p-3">
                  <small class="text-muted d-block mb-2"
                    >Book your job search with Premium</small
                  >
                  <button class="btn btn-outline-primary btn-sm w-100">
                    Try for ₹0
                  </button>
                </div>
              </div> -->

              <!-- Saved Items -->
              <div class="saved-card card border-0 shadow-sm">
                <div class="card-body p-0">
                  <div class="saved-item p-3 border-bottom">
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
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="col-lg-6">
            <!-- Create Post Card -->
            <div class="create-post-card card border-0 shadow-sm mb-3">
              <div class="card-body p-3">
                <div class="d-flex align-items-center">
                  <div class="user-avatar-small me-2">
  @if (currentUserProfilePicture) {
    <img [src]="currentUserProfilePicture" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle"></i>
  }
</div>
                  <button
                    class="btn btn-light btn-hover flex-grow-1 text-start text-muted"
                    routerLink="/create-post"
                  >
                    Start a post...
                  </button>
                </div>
                <div
                  class="d-flex justify-content-between mt-3 pt-3 border-top"
                >
                  <button class="btn btn-sm btn-post-option">
                    <i class="bi bi-image text-primary me-1"></i>
                    <span>Photo</span>
                  </button>
                  <button class="btn btn-sm btn-post-option">
                    <i class="bi bi-camera-video text-success me-1"></i>
                    <span>Video</span>
                  </button>
                  <button class="btn btn-sm btn-post-option">
                    <i class="bi bi-calendar-event text-warning me-1"></i>
                    <span>Event</span>
                  </button>
                  <button class="btn btn-sm btn-post-option">
                    <i class="bi bi-journal-text text-danger me-1"></i>
                    <span>Write article</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Posts Feed -->
            <div class="posts-feed">
              <!-- Loading -->
              <div *ngIf="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted small">Loading posts...</p>
              </div>

              <!-- No Posts -->
              <div
                *ngIf="!loading && posts.length === 0"
                class="text-center py-5"
              >
                <div class="empty-state">
                  <i class="bi bi-journal-x display-4 text-muted mb-3"></i>
                  <h6 class="text-muted mb-2">No posts yet</h6>
                  <p class="text-muted small mb-3">
                    Be the first to share something with your network!
                  </p>
                  <a routerLink="/create-post" class="btn btn-primary btn-sm">
                    <i class="bi bi-plus-lg me-2"></i>
                    Create First Post
                  </a>
                </div>
              </div>

              <!-- Posts List -->
              <div *ngIf="!loading && posts.length > 0">
                <div
                  class="post-card mb-3"
                  *ngFor="let post of posts; trackBy: trackByPostId"
                >
                  <div class="card border-0 shadow-sm">
                    <div class="card-body p-3">
                      <!-- Post Header -->
                      <div
                        class="post-header d-flex justify-content-between align-items-start mb-2"
                      >
                        <div class="d-flex align-items-center">
                         <div class="user-avatar-small me-2">
  @if (post.userProfilePicture) {
    <img [src]="getImageUrl(post.userProfilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle"></i>
  }
</div>
                          <div>
                            <h6 class="mb-0 fw-bold">{{ post.userName }}</h6>
                            <small class="text-muted">{{
                              formatDate(post.createdDate)
                            }}</small>
                            <span
                              *ngIf="post.updatedDate"
                              class="badge bg-light text-dark ms-1 small"
                            >
                              <i class="bi bi-pencil me-1"></i>
                              Edited
                            </span>
                          </div>
                        </div>
                        <div
                          class="dropdown"
                          *ngIf="post.userId === currentUser?.id"
                        >
                          <button
                            class="btn btn-link text-muted p-0"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i class="bi bi-three-dots"></i>
                          </button>
                          <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                              <a
                                class="dropdown-item small"
                                [routerLink]="['/edit-post', post.id]"
                              >
                                <i class="bi bi-pencil me-2"></i>
                                Edit
                              </a>
                            </li>
                            <li>
                              <a
                                class="dropdown-item small text-danger"
                                href="#"
                                (click)="deletePost($event, post.id)"
                              >
                                <i class="bi bi-trash me-2"></i>
                                Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <!-- Post Content -->
                      <div class="post-content mb-2">
                        <div class="post-text-container">
                          <div
                            class="post-text"
                            [class.truncated]="isPostTruncated(post.id)"
                            [innerHTML]="formatPostText(post.description)"
                          ></div>
                          <button
                            *ngIf="shouldShowMoreButton(post.description)"
                            class="btn-show-more"
                            (click)="togglePostText(post.id)"
                          >
                            {{
                              isPostTruncated(post.id) ? '...more' : ' ...less'
                            }}
                          </button>
                        </div>
                        <div class="post-image" *ngIf="post.photoPath">
                          <img
                            [src]="getImageUrl(post.photoPath)"
                            [alt]="post.description"
                            class="img-fluid rounded"
                          />
                        </div>
                      </div>

                      <!-- Post Stats -->
                      <div class="post-stats mb-2">
                        <small class="text-muted">
                          <span class="me-2">{{ post.likesCount }} likes</span>
                          <span>{{ post.commentsCount }} comments</span>
                        </small>
                      </div>

                      <!-- Post Actions -->
                      <div
                        class="post-actions d-flex align-items-center border-top border-bottom py-1"
                      >
                        <button
                          class="btn btn-sm action-btn flex-fill"
                          [class.text-primary]="post.isLikedByCurrentUser"
                          (click)="toggleLike(post)"
                        >
                          <i
                            [class]="
                              post.isLikedByCurrentUser
                                ? 'bi bi-hand-thumbs-up-fill'
                                : 'bi bi-hand-thumbs-up'
                            "
                          ></i>
                          <span class="ms-1">Like</span>
                        </button>
                        <button
                          class="btn btn-sm action-btn flex-fill"
                          (click)="toggleComments(post.id)"
                        >
                          <i class="bi bi-chat"></i>
                          <span class="ms-1">Comment</span>
                        </button>
                        <button class="btn btn-sm action-btn flex-fill">
                          <i class="bi bi-share"></i>
                          <span class="ms-1">Share</span>
                        </button>
                      </div>

                      <!-- Comments Section -->
                      <div
                        class="comments-section mt-2"
                        *ngIf="showCommentsForPost === post.id"
                      >
                        <!-- Existing Comments -->
                        <div
                          class="comments-list mb-2"
                          *ngIf="post.comments.length > 0"
                        >
                          <div
                            class="comment mb-2"
                            *ngFor="
                              let comment of getSortedComments(post.comments)
                            "
                          >
                            <div class="d-flex">
                              <div class="comment-avatar me-2">
  @if (comment.userProfilePicture) {
    <img [src]="getImageUrl(comment.userProfilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle"></i>
  }
</div>
                              <div class="comment-content flex-grow-1">
                                <div
                                  class="comment-header d-flex justify-content-between align-items-start"
                                >
                                  <div>
                                    <strong class="me-2 small">{{
                                      comment.userName
                                    }}</strong>
                                    <small class="text-muted">{{
                                      formatDate(comment.createdDate)
                                    }}</small>
                                  </div>

                                  <!-- DELETE COMMENT BUTTON -->
                                  <button
                                    *ngIf="comment.canDelete"
                                    class="btn btn-link btn-sm text-danger p-0 ms-2"
                                    (click)="
                                      deleteComment(comment, post, $event)
                                    "
                                    title="Delete comment"
                                  >
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </div>
                                <p class="mb-0 mt-1 small">
                                  {{ comment.content }}
                                </p>

                                <!-- REPLY BUTTON -->
                                <div class="comment-actions mt-1">
                                  <button
                                    class="btn btn-link btn-sm text-muted p-0 me-3"
                                    (click)="toggleReplyForm(comment)"
                                  >
                                    <small>Reply</small>
                                  </button>

                                  <!-- VIEW REPLIES BUTTON -->
                                  <button
                                    *ngIf="
                                      comment.replies &&
                                      comment.replies.length > 0
                                    "
                                    class="btn btn-link btn-sm text-muted p-0"
                                    (click)="toggleReplies(comment)"
                                  >
                                    <small>
                                      {{
                                        comment.showReplies ? 'Hide' : 'View'
                                      }}
                                      {{ comment.replies.length }}
                                      {{
                                        comment.replies.length === 1
                                          ? 'reply'
                                          : 'replies'
                                      }}
                                    </small>
                                  </button>
                                </div>

                                <!-- REPLY FORM -->
                                <div
                                  *ngIf="comment.showReplyForm"
                                  class="reply-form mt-2"
                                >
                                  <form
                                    [formGroup]="getReplyForm(comment.id)"
                                    (submit)="addReply($event, comment)"
                                    class="add-reply-form"
                                  >
                                    <div class="input-group input-group-sm">
                                      <input
                                        type="text"
                                        class="form-control form-control-sm"
                                        placeholder="Write a reply..."
                                        formControlName="content"
                                        style="border-radius: 20px; font-size: 0.8rem;"
                                      />
                                      <button
                                        class="btn btn-primary btn-sm ms-2"
                                        type="submit"
                                        [disabled]="
                                          !getReplyForm(comment.id).valid
                                        "
                                        style="border-radius: 20px; font-size: 0.8rem;"
                                      >
                                        Reply
                                      </button>
                                      <button
                                        class="btn btn-outline-secondary btn-sm ms-1"
                                        type="button"
                                        (click)="toggleReplyForm(comment)"
                                        style="border-radius: 20px; font-size: 0.8rem;"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                </div>

                                <!-- REPLIES SECTION -->
                                <div
                                  *ngIf="
                                    comment.showReplies &&
                                    comment.replies &&
                                    comment.replies.length > 0
                                  "
                                  class="replies-section mt-2 ms-3"
                                >
                                  <div class="replies-list">
                                    <div
                                      class="reply mb-2"
                                      *ngFor="let reply of comment.replies"
                                    >
                                      <div class="d-flex">
                                        <div class="reply-avatar me-2">
  @if (reply.userProfilePicture) {
    <img [src]="getImageUrl(reply.userProfilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle text-muted" style="font-size: 1.2rem;"></i>
  }
</div>
                                        <div class="reply-content flex-grow-1">
                                          <div
                                            class="reply-header d-flex justify-content-between align-items-start"
                                          >
                                            <div>
                                              <strong class="me-2 small">{{
                                                reply.userName
                                              }}</strong>
                                              <small class="text-muted">{{
                                                formatDate(reply.createdDate)
                                              }}</small>
                                            </div>

                                            <!-- DELETE REPLY BUTTON -->
                                            <button
                                              *ngIf="reply.canDelete"
                                              class="btn btn-link btn-sm text-danger p-0 ms-2"
                                              (click)="
                                                deleteReply(
                                                  reply,
                                                  comment,
                                                  $event
                                                )
                                              "
                                              title="Delete reply"
                                            >
                                              <i class="bi bi-trash"></i>
                                            </button>
                                          </div>
                                          <p class="mb-0 mt-1 small">
                                            {{ reply.content }}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Add Comment Form -->
                        <form
                          [formGroup]="getCommentForm(post.id)"
                          (submit)="addComment($event, post.id)"
                          class="add-comment-form"
                        >
                          <div class="input-group input-group-sm">
                            <input
                              type="text"
                              class="form-control form-control-sm"
                              placeholder="Add a comment..."
                              formControlName="content"
                              style="border-radius: 20px;"
                            />
                            <button
                              class="btn btn-primary btn-sm ms-2"
                              type="submit"
                              [disabled]="!getCommentForm(post.id).valid"
                              style="border-radius: 20px;"
                            >
                              Comment
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="col-lg-3 d-none d-lg-block">
            <div class="right-sidebar sticky-sidebar">
              <!-- LinkedIn News -->
              <div class="news-card card border-0 shadow-sm mb-3">
                <div class="card-header bg-transparent border-0 pb-0">
                  <h6 class="fw-bold mb-2">LinkedIn News</h6>
                </div>
                <div class="card-body pt-0">
                  <div
                    class="news-item p-2 border-bottom"
                    *ngFor="let news of linkedinNews"
                  >
                    <h6 class="small fw-bold mb-1 text-dark">
                      {{ news.title }}
                    </h6>
                    <div
                      class="d-flex justify-content-between align-items-center"
                    >
                      <small class="text-muted">{{ news.time }}</small>
                      <small class="text-muted" *ngIf="news.readers"
                        >{{ news.readers }} readers</small
                      >
                    </div>
                  </div>
                  <div class="text-center mt-2">
                    <button
                      class="btn btn-link btn-sm text-primary text-decoration-none p-0"
                    >
                      Show more
                      <i class="bi bi-chevron-down ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Today's Puzzles -->
              <div class="puzzles-card card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0 pb-0">
                  <h6 class="fw-bold mb-2">Today's puzzles</h6>
                </div>
                <div class="card-body pt-0">
                  <div class="puzzle-item p-2 border-bottom">
                    <h6 class="small fw-bold mb-1 text-dark">
                      Zip - a quick brain teaser
                    </h6>
                    <small class="text-muted">Solve in 60% or less!</small>
                    <div class="mt-1">
                      <small class="text-muted">6 connections played</small>
                    </div>
                  </div>
                  <div class="puzzle-item p-2">
                    <h6 class="small fw-bold mb-1 text-dark">Mini Sudoku</h6>
                    <small class="text-muted"
                      >Carried by the originators of Sudoku and the Six World Lo
                      WAS</small
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
  min-height: 100vh;
  background-color: #f3f2ef;
  padding: 20px 20px 20px 20px;
}

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

.card {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

/* Profile Card Styles */
.profile-card {
  position: relative;
  overflow: hidden;
}

.card-background {
  height: 56px;
  background-color: #a0b4b7;
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
  overflow: hidden; /* ✅ ADDED for profile pictures */
}

.profile-avatar {
  font-size: 3.5rem;
  color: #0a66c2;
}

.user-avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eef3f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #0a66c2;
  overflow: hidden; /* ✅ ADDED for profile pictures */
}

.company-avatar {
  font-size: 2rem;
  color: #0a66c2;
  background: #eef3f8;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eef3f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #0a66c2;
  overflow: hidden; /* ✅ ADDED for profile pictures */
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #6c757d;
  overflow: hidden; /* ✅ ADDED for profile pictures */
}

/* ✅ ADDED: Profile Picture Image Styles */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Button Styles */
.btn-hover:hover {
  background-color: #eef3f8 !important;
}

.btn-post-option {
  background: transparent;
  border: none;
  color: #666;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-post-option:hover {
  background-color: #f3f2ef;
  color: #000;
}

.action-btn {
  background: transparent;
  border: none;
  color: #666;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  padding: 6px 12px;
  border-radius: 4px;
}

.action-btn:hover {
  background-color: #f3f2ef;
  color: #0a66c2;
}

.action-btn.text-primary {
  color: #0a66c2;
}

/* Premium Card */
.premium-card {
  background: linear-gradient(135deg, #fef6e6 0%, #fdf2d8 100%);
}

/* Saved Items */
.saved-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.saved-item:hover {
  background-color: #f8f9fa;
}

/* Text Styles */
.post-text-container {
  display: block;
  line-height: 1.4;
}

.post-text {
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-line;
  word-wrap: break-word;
  display: inline;
}

.post-text.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.8em;
  line-height: 1.4em;
}

.btn-show-more {
  font-size: 0.8rem;
  font-weight: 500;
  color: #0a66c2;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: inline;
}

.btn-show-more:hover {
  background-color: transparent !important;
  text-decoration: underline !important;
}

.x-small {
  font-size: 0.75rem;
}

/* Post Image */
.post-image img {
  max-height: 400px;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 8px;
}

/* Comments Section */
.comments-section {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.comment {
  background-color: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.add-comment-form .form-control {
  border: 1px solid #cfd0d2;
}

/* Reply Styles */
.reply {
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.reply-form {
  border-left: 3px solid #0a66c2;
  padding-left: 12px;
}

.add-reply-form .form-control {
  border: 1px solid #cfd0d2;
  font-size: 0.8rem;
}

.comment-actions .btn-link {
  text-decoration: none;
  font-size: 0.8rem;
}

.comment-actions .btn-link:hover {
  text-decoration: underline;
}

.replies-section {
  border-left: 2px solid #dee2e6;
  padding-left: 12px;
}

/* Reply delete button styles */
.reply-header .btn-link {
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.reply-header .btn-link:hover {
  opacity: 1;
  background-color: transparent !important;
}

/* News & Puzzles */
.news-item,
.puzzle-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
}

.news-item:hover,
.puzzle-item:hover {
  background-color: #f8f9fa;
}

.profile-stats {
  font-size: 0.8rem;
}

/* Empty State */
.empty-state i {
  opacity: 0.5;
}

/* Animations */
.post-card {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dropdown */
.dropdown-menu {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.badge {
  font-size: 0.65rem;
  padding: 2px 6px;
}

/* Main content scrollable */
.col-lg-6 {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.col-lg-6::-webkit-scrollbar {
  width: 6px;
}

.col-lg-6::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.col-lg-6::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.col-lg-6::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Comment delete button styles */
.comment-header .btn-link {
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.comment-header .btn-link:hover {
  opacity: 1;
  background-color: transparent !important;
}

.comment:hover .comment-header .btn-link {
  opacity: 0.7;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .comment-header .btn-link {
    opacity: 0.7; /* Always show on mobile for better UX */
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 60px 10px 10px 10px;
  }

  .user-avatar-small {
    width: 40px;
    height: 40px;
    font-size: 1.8rem;
  }

  .comment-avatar {
    width: 28px;
    height: 28px;
    font-size: 1.3rem;
  }

  .reply-avatar {
    width: 24px;
    height: 24px;
    font-size: 1rem;
  }

  .post-image img {
    max-height: 300px;
  }

  .action-btn {
    font-size: 0.8rem;
    padding: 4px 8px;
  }

  .col-lg-6 {
    max-height: none;
    overflow-y: visible;
  }

  .post-text.truncated {
    max-height: 2.8em;
    -webkit-line-clamp: 2;
  }

  .avatar-container {
    width: 60px;
    height: 60px;
  }
}

/* ✅ ADDED: Enhanced responsive styles for profile pictures */
@media (max-width: 576px) {
  .avatar-container {
    width: 50px;
    height: 50px;
  }
  
  .user-avatar-small {
    width: 36px;
    height: 36px;
    font-size: 1.6rem;
  }
  
  .comment-avatar {
    width: 24px;
    height: 24px;
    font-size: 1.1rem;
  }
  
  .reply-avatar {
    width: 20px;
    height: 20px;
    font-size: 0.9rem;
  }
}
      
    `,
  ],
})
export class DashboardComponent implements OnInit {
  posts: Post[] = [];
  loading = false;
  currentUser = this.authService.currentUserValue;
  showCommentsForPost: number | null = null;
  commentForms: Map<number, FormGroup> = new Map();
  replyForms: Map<number, FormGroup> = new Map();
   currentUserProfilePicture: string = '';

  // Track which posts are truncated
  truncatedPosts: Set<number> = new Set();

  // Connection count property
  connectionCount: number = 0;

  linkedinNews = [
    {
      title: 'The 20 Indian startups to watch',
      time: '2h ago',
      readers: '4,726',
    },
    { title: 'Join market to pick up pace', time: '29m ago', readers: '' },
    {
      title: 'Fewer Indian students US bound',
      time: '2h ago',
      readers: '2,518',
    },
    { title: 'IMF ups India growth forecast', time: '2h ago', readers: '783' },
    { title: 'IT giants chart new AI path', time: '2h ago', readers: '743' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private connectionService: ConnectionService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.loadPosts();
    this.loadConnectionCount();
     this.loadCurrentUserProfilePicture();
  }

  // Method to load connection count
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
        // Fallback to static number if API fails
        this.connectionCount = 145;
      },
    });
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

  // REMOVE THIS: Remove the old static method
  // getConnectionCount(): number {
  //   // For now, returning a static number
  //   // You can replace this with actual connection data from your API
  //   return 145;
  // }

  // ALL YOUR EXISTING METHODS REMAIN EXACTLY THE SAME
  loadPosts(): void {
    this.loading = true;
    const userId = this.authService.getCurrentUserId();

    this.apiService.getAllPosts(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.posts = response.data;

          // Initialize all posts and set canDelete for comments
          this.posts.forEach((post) => {
            this.initializeCommentForm(post.id);

            // Set canDelete property for each comment
            post.comments.forEach((comment) => {
              comment.canDelete = this.canDeleteComment(comment, post);
              comment.showReplies = false; // Initialize
              comment.showReplyForm = false; // Initialize
              comment.replies = comment.replies || []; // Initialize replies array

              this.loadReplies(comment);
            });

            if (this.shouldShowMoreButton(post.description)) {
              this.truncatedPosts.add(post.id);
            }
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load posts',
        });
      },
    });
  }

  // Format post text to preserve line breaks
  formatPostText(text: string): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>').replace(/\r/g, '');
  }

  // Check if post should show "more" button (after 2 lines)
  shouldShowMoreButton(text: string): boolean {
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

  initializeCommentForm(postId: number): void {
    if (!this.commentForms.has(postId)) {
      this.commentForms.set(
        postId,
        this.formBuilder.group({
          content: ['', [Validators.required]],
        })
      );
    }
  }

  getCommentForm(postId: number): FormGroup {
    if (!this.commentForms.has(postId)) {
      this.initializeCommentForm(postId);
    }
    return this.commentForms.get(postId)!;
  }

  toggleComments(postId: number): void {
    this.showCommentsForPost =
      this.showCommentsForPost === postId ? null : postId;
  }

  toggleLike(post: Post): void {
    const userId = this.authService.getCurrentUserId();

    this.apiService.toggleLike({ postId: post.id, userId }).subscribe({
      next: (response) => {
        if (response.success) {
          post.isLikedByCurrentUser = !post.isLikedByCurrentUser;
          post.likesCount += post.isLikedByCurrentUser ? 1 : -1;
          if (post.isLikedByCurrentUser && post.userId !== userId) {
            // this.sendLikeNotification(post);
          }
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update like',
        });
      },
    });
  }

  addComment(event: Event, postId: number): void {
    event.preventDefault();
    const form = this.getCommentForm(postId);

    if (form.valid) {
      const userId = this.authService.getCurrentUserId();
      const commentContent = form.value.content;
      const commentData: CommentCreate = {
        content: form.value.content,
        postId: postId,
        userId: userId,
      };

      this.apiService.addComment(commentData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const post = this.posts.find((p) => p.id === postId);
            if (post) {
              // Set canDelete property for the new comment
              response.data.canDelete = this.canDeleteComment(
                response.data,
                post
              );
              post.comments.push(response.data);
              // Sort comments after adding new one
              post.comments = this.sortCommentsByDate(post.comments);
              post.commentsCount++;
              form.reset();
              if (post.userId !== userId) {
                // this.sendCommentNotification(post, commentContent);
              }
            }

            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Comment added successfully',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add comment',
          });
        },
      });
    }
  }

  deletePost(event: Event, postId: number): void {
    event.preventDefault();

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = this.authService.getCurrentUserId();

        this.apiService.deletePost(postId, userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.posts = this.posts.filter((p) => p.id !== postId);
              this.truncatedPosts.delete(postId);

              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Your post has been deleted.',
                timer: 1500,
                showConfirmButton: false,
              });
            }
          },
          error: (error) => {
            console.error('Error deleting post:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete post',
            });
          },
        });
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.apiService.getImageUrl(imagePath);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString();
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  // Method to get current user's post count
  getUserPostCount(): number {
    if (!this.currentUser || !this.posts.length) return 0;

    return this.posts.filter((post) => post.userId === this.currentUser?.id)
      .length;
  }

  // ADD THESE NEW METHODS FOR COMMENT SORTING:

  // Sort comments by date (newest first)
  private sortCommentsByDate(comments: any[]): any[] {
    return comments.sort((a, b) => {
      const dateA = new Date(a.createdDate || a.createdAt || a.date);
      const dateB = new Date(b.createdDate || b.createdAt || b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }

  // Get sorted comments for display
  getSortedComments(comments: any[]): any[] {
    return this.sortCommentsByDate(comments);
  }

  // Send like notification to post owner
  private sendLikeNotification(post: Post): void {
    const currentUserName = this.authService.getCurrentUserName();

    const notificationData: CreateNotification = {
      userId: post.userId, // Notify the post owner
      senderId: this.authService.getCurrentUserId(), // Who liked the post
      title: 'New Like',
      message: `${currentUserName} liked your post`,
      type: 'post_like',
      relatedEntityId: post.id, // Link to the post
    };

    this.notificationService.createNotification(notificationData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Like notification sent successfully');
        }
      },
      error: (error) => {
        console.error('Error sending like notification:', error);
      },
    });
  }

  // Send comment notification to post owner
  private sendCommentNotification(post: Post, comment: string): void {
    const currentUserName = this.authService.getCurrentUserName();

    const notificationData: CreateNotification = {
      userId: post.userId, // Notify the post owner
      senderId: this.authService.getCurrentUserId(), // Who commented
      title: 'New Comment',
      message: `${currentUserName} commented: "${this.truncateText(
        comment,
        50
      )}"`,
      type: 'comment',
      relatedEntityId: post.id, // Link to the post
    };

    this.notificationService.createNotification(notificationData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Comment notification sent successfully');
        }
      },
      error: (error) => {
        console.error('Error sending comment notification:', error);
      },
    });
  }

  // Helper method to truncate long comments
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // ADD THIS METHOD: Delete comment functionality
  deleteComment(comment: Comment, post: Post, event: Event): void {
    event.stopPropagation();

    const currentUserId = this.authService.getCurrentUserId();

    Swal.fire({
      title: 'Delete Comment?',
      text: 'Are you sure you want to delete this comment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteComment(comment.id, currentUserId).subscribe({
          next: (response) => {
            if (response.success) {
              // Remove comment from the post
              post.comments = post.comments.filter((c) => c.id !== comment.id);
              post.commentsCount--;

              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Comment deleted successfully',
                timer: 1500,
                showConfirmButton: false,
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message || 'Failed to delete comment',
              });
            }
          },
          error: (error) => {
            console.error('Error deleting comment:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete comment',
            });
          },
        });
      }
    });
  }

  // ADD THIS METHOD: Check if user can delete comment
  canDeleteComment(comment: Comment, post: Post): boolean {
    const currentUserId = this.authService.getCurrentUserId();

    // User can delete if:
    // 1. They are the comment owner, OR
    // 2. They are the post owner
    return comment.userId === currentUserId; // || post.userId === currentUserId;
  }

  initializeReplyForm(commentId: number): void {
    if (!this.replyForms.has(commentId)) {
      this.replyForms.set(
        commentId,
        this.formBuilder.group({
          content: ['', [Validators.required]],
        })
      );
    }
  }

  // Get reply form for a comment
  getReplyForm(commentId: number): FormGroup {
    if (!this.replyForms.has(commentId)) {
      this.initializeReplyForm(commentId);
    }
    return this.replyForms.get(commentId)!;
  }

  // Toggle replies visibility
  toggleReplies(comment: Comment): void {
    if (!comment.showReplies) {
      // Load replies if not already loaded
      if (!comment.replies || comment.replies.length === 0) {
        this.loadReplies(comment);
      }
    }
    comment.showReplies = !comment.showReplies;
  }

  // Load replies for a comment
  loadReplies(comment: Comment): void {
    this.apiService.getRepliesByCommentId(comment.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          comment.replies = response.data.map((reply) => ({
            ...reply,
            canDelete: this.canDeleteReply(reply),
          }));
        }
      },
      error: (error) => {
        console.error('Error loading replies:', error);
      },
    });
  }

  // Toggle reply form
  toggleReplyForm(comment: Comment): void {
    comment.showReplyForm = !comment.showReplyForm;
    if (comment.showReplyForm) {
      this.initializeReplyForm(comment.id);
    }
  }

  // Add reply to a comment
  addReply(event: Event, comment: Comment): void {
    event.preventDefault();
    const form = this.getReplyForm(comment.id);

    if (form.valid) {
      const userId = this.authService.getCurrentUserId();
      const replyData: ReplyCreate = {
        content: form.value.content,
        commentId: comment.id,
        userId: userId,
      };

      this.apiService.addReply(replyData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Initialize replies array if it doesn't exist
            if (!comment.replies) {
              comment.replies = [];
            }

            // Add the new reply with canDelete property
            const newReply = {
              ...response.data,
              canDelete: this.canDeleteReply(response.data),
            };
            comment.replies.push(newReply);

            // Reset form and hide it
            form.reset();
            comment.showReplyForm = false;

            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Reply added successfully',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (error) => {
          console.error('Error adding reply:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add reply',
          });
        },
      });
    }
  }

  // Delete reply
  deleteReply(reply: Reply, comment: Comment, event: Event): void {
    event.stopPropagation();

    const currentUserId = this.authService.getCurrentUserId();

    Swal.fire({
      title: 'Delete Reply?',
      text: 'Are you sure you want to delete this reply?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteReply(reply.id, currentUserId).subscribe({
          next: (response) => {
            if (response.success) {
              // Remove reply from the comment
              if (comment.replies) {
                comment.replies = comment.replies.filter(
                  (r) => r.id !== reply.id
                );
              }

              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Reply deleted successfully',
                timer: 1500,
                showConfirmButton: false,
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message || 'Failed to delete reply',
              });
            }
          },
          error: (error) => {
            console.error('Error deleting reply:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete reply',
            });
          },
        });
      }
    });
  }

  // Check if user can delete reply
  canDeleteReply(reply: Reply): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return reply.userId === currentUserId;
  }
  
}

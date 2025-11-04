import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, Post, ProfilePictureUpdate } from '../../models/models';
import Swal from 'sweetalert2';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profile-container">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-content">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="loading-text">Loading profile...</p>
        </div>
      </div>

      <!-- Profile Content -->
      <div *ngIf="!loading && user" class="profile-content">
        <!-- Profile Header Section -->
        <div class="profile-header-section">
          <div class="profile-cover-container">
            <div class="profile-cover">
              <div class="cover-overlay"></div>
            </div>
            <div class="profile-header-content">
              <div class="profile-avatar-section">
                <div class="profile-avatar">
                  <!-- ✅ UPDATED AVATAR WITH PROFILE PICTURE -->
                  <div class="avatar-container" (click)="isOwnProfile && fileInput.click()" 
                       [class.clickable]="isOwnProfile">
                    @if (profilePictureUrl) {
                      <img [src]="profilePictureUrl" alt="Profile Picture" class="profile-image">
                    } @else {
                      <i class="bi bi-person-circle"></i>
                    }
                    @if (isOwnProfile) {
                      <div class="avatar-overlay">
                        <i class="bi bi-camera"></i>
                        <small>Update</small>
                      </div>
                    }
                  </div>
                  
                  <!-- ✅ ADD FILE INPUT -->
                  <input #fileInput type="file" accept="image/*" (change)="onFileSelected($event)" 
                         style="display: none;">
                  
                  <!-- ✅ ADD DELETE BUTTON -->
                  @if (profilePictureUrl && isOwnProfile) {
                    <button class="btn-remove-picture" (click)="deleteProfilePicture()" 
                            title="Remove profile picture">
                      <i class="bi bi-trash"></i>
                    </button>
                  }
                </div>
                <div class="profile-actions" *ngIf="!isOwnProfile">
                  <button class="btn-follow">
                    <i class="bi bi-plus-lg"></i>
                    Follow
                  </button>
                  <button class="btn-message">
                    <i class="bi bi-chat"></i>
                    Message
                  </button>
                </div>
              </div>

              <div class="profile-info-section">
                <div class="profile-main-info">
                  <h1 class="profile-name">{{ user.name }}</h1>
                  <p class="profile-headline">{{ user.roleName }}</p>
                  <div class="profile-location">
                    <i class="bi bi-geo-alt"></i>
                    <span>Ahmedabad, Gujarat</span>
                  </div>
                  <div class="profile-contact">
                    <span class="contact-item">
                      <i class="bi bi-envelope"></i>
                      {{ user.email }}
                    </span>
                    <span class="contact-item" *ngIf="user.phoneNumber">
                      <i class="bi bi-telephone"></i>
                      {{ user.phoneNumber }}
                    </span>
                  </div>
                </div>

                <!-- Profile Stats -->
                <div class="profile-stats">
                  <div class="stat-item">
                    <div class="stat-number">{{ userPosts.length }}</div>
                    <div class="stat-label">Posts</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ getTotalLikes() }}</div>
                    <div class="stat-label">Likes</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ getTotalComments() }}</div>
                    <div class="stat-label">Comments</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">{{ connectionCount }}</div>
                    <div class="stat-label">Connections</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="profile-main-content">
          <div class="container-fluid">
            <div class="row">
              <!-- Left Sidebar -->
              <div class="col-lg-4">
                <!-- About Section -->
                <div class="profile-card">
                  <div class="card-header">
                    <h3>About</h3>
                  </div>
                  <div class="card-content">
                    <div class="about-item">
                      <i class="bi bi-building"></i>
                      <div>
                        <div class="about-label">Current Role</div>
                        <div class="about-value">{{ user.roleName }}</div>
                      </div>
                    </div>
                    <div class="about-item">
                      <i class="bi bi-envelope"></i>
                      <div>
                        <div class="about-label">Email</div>
                        <div class="about-value">{{ user.email }}</div>
                      </div>
                    </div>
                    <div class="about-item" *ngIf="user.phoneNumber">
                      <i class="bi bi-telephone"></i>
                      <div>
                        <div class="about-label">Phone</div>
                        <div class="about-value">{{ user.phoneNumber }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Skills Section -->
                <div
                  class="profile-card"
                  *ngIf="user.skills && user.skills.length > 0"
                >
                  <div class="card-header">
                    <h3>Skills</h3>
                  </div>
                  <div class="card-content">
                    <div class="skills-list">
                      <div class="skill-tag" *ngFor="let skill of user.skills">
                        {{ skill.name }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Activity Stats -->
                <div class="profile-card">
                  <div class="card-header">
                    <h3>Activity</h3>
                  </div>
                  <div class="card-content">
                    <div class="activity-stats">
                      <div class="activity-item">
                        <div class="activity-icon post">
                          <i class="bi bi-file-text"></i>
                        </div>
                        <div>
                          <div class="activity-count">
                            {{ userPosts.length }}
                          </div>
                          <div class="activity-label">Posts Published</div>
                        </div>
                      </div>
                      <div class="activity-item">
                        <div class="activity-icon like">
                          <i class="bi bi-heart"></i>
                        </div>
                        <div>
                          <div class="activity-count">
                            {{ getTotalLikes() }}
                          </div>
                          <div class="activity-label">Total Likes</div>
                        </div>
                      </div>
                      <div class="activity-item">
                        <div class="activity-icon comment">
                          <i class="bi bi-chat"></i>
                        </div>
                        <div>
                          <div class="activity-count">
                            {{ getTotalComments() }}
                          </div>
                          <div class="activity-label">Comments</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Content -->
              <div class="col-lg-8">
                <!-- Create Post Card (Own Profile Only) -->
                <div class="profile-card create-post-card" *ngIf="isOwnProfile">
                  <div class="create-post-header">
                    <!-- ✅ UPDATED SMALL AVATAR -->
                    <div class="user-avatar-small">
                      @if (profilePictureUrl) {
                        <img [src]="profilePictureUrl" alt="Profile" class="avatar-image">
                      } @else {
                        <i class="bi bi-person-circle"></i>
                      }
                    </div>
                    <button class="btn-create-post" routerLink="/create-post">
                      Start a post
                    </button>
                  </div>
                  <div class="create-post-actions">
                    <button class="post-action-btn">
                      <i class="bi bi-image text-success"></i>
                      <span>Photo</span>
                    </button>
                    <button class="post-action-btn">
                      <i class="bi bi-camera-video text-info"></i>
                      <span>Video</span>
                    </button>
                    <button class="post-action-btn">
                      <i class="bi bi-calendar-event text-warning"></i>
                      <span>Event</span>
                    </button>
                  </div>
                </div>

                <!-- Posts Section -->
                <div class="posts-section">
                  <div class="section-header">
                    <h3>{{ isOwnProfile ? 'Your Posts' : 'Posts' }}</h3>
                    <div class="posts-count">{{ userPosts.length }} posts</div>
                  </div>

                  <!-- No Posts State -->
                  <div *ngIf="userPosts.length === 0" class="empty-state">
                    <div class="empty-icon">
                      <i class="bi bi-newspaper"></i>
                    </div>
                    <h4>No posts yet</h4>
                    <p *ngIf="isOwnProfile">
                      Share your first post to start building your professional
                      presence
                    </p>
                    <p *ngIf="!isOwnProfile">
                      This user hasn't shared any posts yet
                    </p>
                    <button
                      class="btn-primary"
                      *ngIf="isOwnProfile"
                      routerLink="/create-post"
                    >
                      <i class="bi bi-plus-lg"></i>
                      Create your first post
                    </button>
                  </div>

                  <!-- Posts List -->
                  <div class="posts-list" *ngIf="userPosts.length > 0">
                    <div class="post-card" *ngFor="let post of userPosts">
                      <div class="post-header">
                        <div class="post-user">
                          <!-- ✅ UPDATED POST AVATAR -->
                          <div class="post-avatar">
                            @if (profilePictureUrl) {
                              <img [src]="profilePictureUrl" alt="Profile" class="avatar-image">
                            } @else {
                              <i class="bi bi-person-circle"></i>
                            }
                          </div>
                          <div class="post-user-info">
                            <div class="post-username">{{ user.name }}</div>
                            <div class="post-timestamp">
                              {{ formatDate(post.createdDate) }}
                            </div>
                          </div>
                        </div>
                        <div class="post-actions" *ngIf="isOwnProfile">
                          <div class="dropdown">
                            <button class="btn-more" data-bs-toggle="dropdown">
                              <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                              <li>
                                <a
                                  class="dropdown-item"
                                  [routerLink]="['/edit-post', post.id]"
                                >
                                  <i class="bi bi-pencil"></i>
                                  Edit post
                                </a>
                              </li>
                              <li>
                                <a
                                  class="dropdown-item delete"
                                  href="#"
                                  (click)="deletePost($event, post.id)"
                                >
                                  <i class="bi bi-trash"></i>
                                  Delete post
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div class="post-content">
                        <p class="post-text">{{ post.description }}</p>
                        <div class="post-media" *ngIf="post.photoPath">
                          <img
                            [src]="getImageUrl(post.photoPath)"
                            [alt]="post.description"
                            class="post-image"
                          />
                        </div>
                      </div>

                      <div class="post-stats">
                        <div class="post-stat">
                          <i class="bi bi-heart-fill"></i>
                          <span>{{ post.likesCount }}</span>
                        </div>
                        <div class="post-stat">
                          <i class="bi bi-chat"></i>
                          <span>{{ post.commentsCount }}</span>
                        </div>
                        <div class="post-stat">
                          <i class="bi bi-share"></i>
                          <span>Share</span>
                        </div>
                      </div>
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
  styles: [
    `
      .profile-container {
        min-height: 100vh;
        background-color: #f4f2ee;
      }

      /* Loading State */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
      }

      .loading-content {
        text-align: center;
      }

      .loading-text {
        margin-top: 1rem;
        color: #666;
        font-weight: 500;
      }

      /* Profile Header */
      .profile-header-section {
        position: relative;
      }

      .profile-cover-container {
        position: relative;
      }

      .profile-cover {
        height: 150px;
        background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
        position: relative;
      }

      .cover-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.3));
      }

      .profile-header-content {
        position: relative;
        max-width: 1128px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .profile-avatar-section {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-top: -80px;
        margin-bottom: 24px;
      }

      .profile-avatar {
        position: relative;
        width: 160px;
        height: 160px;
      }

      .profile-actions {
        display: flex;
        gap: 12px;
      }

      .btn-follow,
      .btn-message,
      .btn-edit-profile {
        padding: 10px 20px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 14px;
        border: 1px solid #0a66c2;
        background: white;
        color: #0a66c2;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .btn-follow:hover,
      .btn-message:hover {
        background: #0a66c2;
        color: white;
        box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
      }

      .btn-edit-profile {
        background: #0a66c2;
        color: white;
      }

      .btn-edit-profile:hover {
        background: #004182;
        box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
      }

      .profile-info-section {
        padding-bottom: 32px;
      }

      .profile-main-info {
        margin-bottom: 24px;
      }

      .profile-name {
        font-size: 32px;
        font-weight: 600;
        color: #191919;
        margin: 0 0 8px 0;
      }

      .profile-headline {
        font-size: 18px;
        color: #191919;
        margin: 0 0 12px 0;
        font-weight: 400;
      }

      .profile-location,
      .profile-contact {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;
      }

      .profile-location i,
      .contact-item i {
        color: #666;
        font-size: 14px;
      }

      .profile-location span,
      .contact-item {
        font-size: 14px;
        color: #666;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .profile-stats {
        display: flex;
        gap: 32px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 24px;
        font-weight: 600;
        color: #191919;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: #666;
      }

      /* Main Content */
      .profile-main-content {
        max-width: 1128px;
        margin: 0 auto;
        padding: 0 24px 40px;
      }

      /* Profile Cards */
      .profile-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
        margin-bottom: 16px;
        overflow: hidden;
      }

      .card-header {
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
      }

      .card-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #191919;
      }

      .card-content {
        padding: 24px;
      }

      /* About Section */
      .about-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
      }

      .about-item:last-child {
        margin-bottom: 0;
      }

      .about-item i {
        color: #666;
        font-size: 16px;
        margin-top: 2px;
      }

      .about-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 2px;
      }

      .about-value {
        font-size: 16px;
        color: #191919;
        font-weight: 500;
      }

      /* Skills */
      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .skill-tag {
        background: #eef3f8;
        color: #0a66c2;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 500;
      }

      /* Activity Stats */
      .activity-stats {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .activity-icon.post {
        background: #e7f3ff;
        color: #0a66c2;
      }

      .activity-icon.like {
        background: #fce8e6;
        color: #d11124;
      }

      .activity-icon.comment {
        background: #e6f4ea;
        color: #0d6e2e;
      }

      .activity-count {
        font-size: 18px;
        font-weight: 600;
        color: #191919;
      }

      .activity-label {
        font-size: 14px;
        color: #666;
      }

      /* Create Post Card */
      .create-post-card {
        margin-bottom: 16px;
      }

      .create-post-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
      }

      .user-avatar-small {
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

      .btn-create-post {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 24px;
        background: white;
        color: #666;
        text-align: left;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-create-post:hover {
        background: #f3f2ef;
        color: #191919;
      }

      .create-post-actions {
        display: flex;
        justify-content: space-around;
        padding: 8px 24px 16px;
        border-top: 1px solid #f0f0f0;
      }

      .post-action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: none;
        background: none;
        color: #666;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .post-action-btn:hover {
        background: #f3f2ef;
        color: #191919;
      }

      /* Posts Section */
      .posts-section {
        margin-top: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #191919;
      }

      .posts-count {
        font-size: 14px;
        color: #666;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 60px 40px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
      }

      .empty-icon {
        font-size: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .empty-state h4 {
        margin: 0 0 8px 0;
        color: #191919;
        font-weight: 600;
      }

      .empty-state p {
        color: #666;
        margin-bottom: 24px;
      }

      .btn-primary {
        background: #0a66c2;
        color: white;
        border: none;
        border-radius: 24px;
        padding: 10px 24px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .btn-primary:hover {
        background: #004182;
        box-shadow: 0 2px 8px rgba(10, 102, 194, 0.3);
      }

      /* Post Cards */
      .post-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
        margin-bottom: 16px;
        padding: 16px;
      }

      .post-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .post-user {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .post-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #eef3f8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #0a66c2;
        overflow: hidden;
      }

      .post-user-info {
        flex: 1;
      }

      .post-username {
        font-weight: 600;
        color: #191919;
        margin-bottom: 2px;
      }

      .post-timestamp {
        font-size: 12px;
        color: #666;
      }

      .post-actions {
        position: relative;
      }

      .btn-more {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: none;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .btn-more:hover {
        background: #f3f2ef;
        color: #191919;
      }

      .dropdown-menu {
        border: none;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        padding: 8px;
      }

      .dropdown-item {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        color: #191919;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .dropdown-item:hover {
        background: #f3f2ef;
      }

      .dropdown-item.delete {
        color: #d11124;
      }

      .dropdown-item.delete:hover {
        background: #fce8e6;
      }

      .post-content {
        margin-bottom: 16px;
      }

      .post-text {
        margin: 0 0 12px 0;
        color: #191919;
        line-height: 1.5;
        white-space: pre-wrap;
      }

      .post-media {
        margin-top: 12px;
      }

      .post-image {
        max-width: 100%;
        max-height: 400px;
        border-radius: 8px;
        object-fit: cover;
      }

      .post-stats {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
      }

      .post-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .post-stat:hover {
        color: #0a66c2;
      }

      /* ✅ PROFILE PICTURE STYLES */
      .avatar-container {
        position: relative;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        overflow: hidden;
        background: white;
        border: 6px solid white;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 120px;
        color: #0a66c2;
      }

      .avatar-container.clickable {
        cursor: pointer;
      }

      .avatar-container.clickable:hover .avatar-overlay {
        opacity: 1;
      }

      .profile-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        color: white;
        font-size: 24px;
      }

      .avatar-overlay small {
        font-size: 12px;
        margin-top: 5px;
        font-weight: 500;
      }

      .btn-remove-picture {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #d11124;
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
      }

      .btn-remove-picture:hover {
        background: #a00d1a;
        transform: scale(1.1);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .profile-header-content {
          padding: 0 16px;
        }

        .profile-avatar-section {
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: -60px;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
        }

        .avatar-container {
          width: 120px;
          height: 120px;
          font-size: 80px;
        }

        .profile-actions {
          justify-content: center;
        }

        .profile-main-content {
          padding: 0 16px 40px;
        }

        .profile-stats {
          justify-content: center;
          gap: 24px;
        }

        .profile-name {
          font-size: 24px;
          text-align: center;
        }

        .profile-headline {
          text-align: center;
        }

        .profile-location,
        .profile-contact {
          justify-content: center;
          flex-wrap: wrap;
        }
      }

      @media (max-width: 576px) {
        .profile-cover {
          height: 200px;
        }

        .profile-avatar {
          width: 100px;
          height: 100px;
        }

        .avatar-container {
          width: 100px;
          height: 100px;
          font-size: 60px;
        }

        .create-post-actions {
          flex-wrap: wrap;
          gap: 8px;
        }

        .post-action-btn {
          flex: 1;
          min-width: 100px;
          justify-content: center;
        }

        .profile-stats {
          gap: 16px;
        }

        .stat-number {
          font-size: 20px;
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  userPosts: Post[] = [];
  loading = false;
  userId: number = 0;
  isOwnProfile = false;
  currentUser = this.authService.currentUserValue;
  connectionCount: number = 0;
  
  // Profile Picture Properties
  selectedFile: File | null = null;
  profilePictureUrl: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private connectionService: ConnectionService
  ) {}

  ngOnInit() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe((params) => {
      this.userId = +params['id'];
      this.isOwnProfile = this.userId === this.currentUser?.id;
      if (this.userId) {
        this.loadProfile();
      }
    });
  }

  loadProfile(): void {
    this.loading = true;

    // Load user details
    this.apiService.getUserById(this.userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = response.data;
          // Set profile picture URL
          this.profilePictureUrl = this.user.profilePicture 
            ? this.apiService.getImageUrl(this.user.profilePicture)
            : '';
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load profile',
          confirmButtonColor: '#0a66c2',
        });
      },
    });

    // Load user posts
    const currentUserId = this.authService.getCurrentUserId();
    this.apiService.getUserPosts(this.userId, currentUserId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.userPosts = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
      },
    });
    this.loadConnectionCount();
  }

  loadConnectionCount(): void {
    this.connectionService.getConnectionCount(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.connectionCount = response.data ?? 0;
        }
      },
      error: (error) => {
        console.error('Error loading connection count:', error);
        this.connectionCount = 0;
      },
    });
  }

  deletePost(event: Event, postId: number): void {
    event.preventDefault();

    Swal.fire({
      title: 'Delete post?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d11124',
      cancelButtonColor: '#666',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: '#fff',
      color: '#000',
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = this.authService.getCurrentUserId();

        this.apiService.deletePost(postId, userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.userPosts = this.userPosts.filter((p) => p.id !== postId);

              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Your post has been deleted.',
                timer: 1500,
                showConfirmButton: false,
                background: '#fff',
                color: '#000',
              });
            }
          },
          error: (error) => {
            console.error('Error deleting post:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete post',
              confirmButtonColor: '#0a66c2',
            });
          },
        });
      }
    });
  }

  getTotalLikes(): number {
    return this.userPosts.reduce((total, post) => total + post.likesCount, 0);
  }

  getTotalComments(): number {
    return this.userPosts.reduce(
      (total, post) => total + post.commentsCount,
      0
    );
  }

  getImageUrl(imagePath: string): string {
    return this.apiService.getImageUrl(imagePath);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Profile Picture Methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Please select a JPG, PNG, or GIF image',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please select an image smaller than 5MB',
        });
        return;
      }

      this.selectedFile = file;
      this.uploadProfilePicture();
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile || !this.user) return;

    const updateData: ProfilePictureUpdate = {
      userId: this.user.id,
      profilePicture: this.selectedFile
    };

    this.apiService.updateProfilePicture(updateData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.profilePictureUrl = this.user.profilePicture 
            ? this.apiService.getImageUrl(this.user.profilePicture)
            : '';
          
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Profile picture updated successfully',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      },
      error: (error) => {
        console.error('Error uploading profile picture:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update profile picture',
        });
      }
    });
  }

  deleteProfilePicture(): void {
    if (!this.user) return;

    Swal.fire({
      title: 'Remove profile picture?',
      text: 'Are you sure you want to remove your profile picture?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d11124',
      cancelButtonColor: '#666',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteProfilePicture(this.user!.id).subscribe({
          next: (response) => {
            if (response.success) {
              if (this.user) {
                this.user.profilePicture = undefined;
              }
              this.profilePictureUrl = '';
              
              Swal.fire({
                icon: 'success',
                title: 'Removed!',
                text: 'Profile picture removed successfully',
                timer: 1500,
                showConfirmButton: false,
              });
            }
          },
          error: (error) => {
            console.error('Error deleting profile picture:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to remove profile picture',
            });
          }
        });
      }
    });
  }
}
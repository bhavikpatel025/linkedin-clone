import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SharedStateService } from '../../services/shared-state.service';
import { CurrentUser } from '../../models/models';
import { ConnectionService } from '../../services/connection.service';
import { NotificationService } from '../../services/notification.service';
import { SearchService } from '../../services/search.service';
import { ApiService } from '../../services/api.service'; 
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  Subject,
  filter,
} from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <nav
      class="navbar navbar-expand-lg navbar-light bg-white fixed-top border-bottom"
    >
      <div class="container-fluid mx-3">
        <!-- Logo -->
        <a class="navbar-brand me-3" routerLink="/dashboard">
          <div class="logo-container">
            <div class="logo-linked">Linked</div>
            <div class="logo-in-box">in</div>
          </div>
        </a>

        <!-- Search Bar (Desktop) - UPDATED -->
       <div class="navbar-search me-2 d-none d-md-flex">
  <div class="search-container position-relative" 
       [attr.aria-expanded]="showSearchResults || showSearchHistory">
    <div class="input-group input-group-sm rounded-pill bg-light">
      <span class="input-group-text bg-transparent border-0 ps-3">
        <i class="bi bi-search text-muted small"></i>
      </span>
      <input
        #searchInput
        type="text"
        class="form-control bg-transparent border-0 px-1"
        [placeholder]="getSearchPlaceholder()"
        [attr.aria-label]="'Search ' + getSearchPlaceholder()"
        role="searchbox"
        aria-haspopup="true"
        aria-controls="search-results search-history"
        style="outline: none; box-shadow: none; font-size: 0.875rem;"
        [(ngModel)]="searchQuery"
        (input)="onSearchInput()"
        (focus)="onSearchFocus()"
        (blur)="onSearchBlur()"
        (keyup.enter)="performSearch()"
        (keydown)="onSearchKeydown($event)"
      />
    </div>
            <!-- Search History Dropdown -->
            <div
              class="search-history-dropdown"
              *ngIf="showSearchHistory && searchHistory.length > 0 && !searchQuery"
            >
              <div class="search-results-content">
                <div class="search-history-section">
                  <div class="search-history-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <small class="section-title text-muted fw-bold">Recent searches</small>
                    <button 
                      class="btn btn-clear-history"
                      (click)="clearSearchHistory($event)"
                    >
                      Clear all
                    </button>
                  </div>
                  
                  <div class="search-history-items">
                    <button 
                      class="search-item history-item"
                      *ngFor="let item of searchHistory"
                      (mousedown)="selectSearchHistory(item)"
                    >
                      <i class="bi bi-clock-history me-2 text-muted"></i>
                      <span class="history-text flex-grow-1">{{ item }}</span>
                      <i 
                        class="bi bi-x remove-history" 
                        (mousedown)="removeFromHistory(item, $event)"
                      ></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Results Dropdown -->
             <div
      class="search-results-dropdown"
      *ngIf="showSearchResults && searchQuery"
      id="search-results"
    >
              <div class="search-results-content">
                <!-- Loading State -->
                <div class="search-loading" *ngIf="isSearching">
                  <div
                    class="d-flex align-items-center justify-content-center py-2"
                  >
                    <div
                      class="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    >
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <small class="text-muted">Searching...</small>
                  </div>
                </div>

                <!-- Search Results -->
                <div
                  *ngIf="!isSearching && hasSearchResults()"
                  class="search-results"
                >
                  <!-- Users Results -->
                  <div
                    class="search-section"
                    *ngIf="searchResults.users.length > 0"
                  >
                    <small class="section-title text-muted fw-bold"
                      >People</small
                    >
                    <div class="search-items">
                      <div
                        class="search-item user-item"
                        *ngFor="let user of searchResults.users"
                        (mousedown)="handleUserClick(user)"
                      >
                        <div class="user-avatar me-2">
                          <!-- Profile Picture in Search Results -->
                          @if (getProfilePictureUrl(user.profilePicture)) {
                            <img [src]="getProfilePictureUrl(user.profilePicture)" alt="Profile" class="avatar-image">
                          } @else {
                            <i class="bi bi-person-circle"></i>
                          }
                        </div>
                        <div class="user-info flex-grow-1">
                          <div class="user-name fw-bold">{{ user.name }}</div>
                          <small class="text-muted">{{
                            user.roleName || 'LinkedIn Member'
                          }}</small>
                          <div
                            *ngIf="user.mutualConnections > 0"
                            class="mutual-connections"
                          >
                            <small class="text-primary"
                              >{{ user.mutualConnections }} mutual
                              connection(s)</small
                            >
                          </div>
                        </div>
                        <button
                          *ngIf="currentPage === 'network' && user.canConnect"
                          class="btn btn-connect btn-sm"
                          (mousedown)="sendConnectionRequest(user, $event)"
                        >
                          Connect
                        </button>
                        <button
                          *ngIf="currentPage === 'home'"
                          class="btn btn-view-profile btn-sm"
                          (mousedown)="navigateToProfile(user.id, $event)"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Posts Results (Only in Home) -->
                  <!-- <div
                    class="search-section"
                    *ngIf="
                      currentPage === 'home' && searchResults.posts.length > 0
                    "
                  >
                    <small class="section-title text-muted fw-bold"
                      >Posts</small
                    >
                    <div class="search-items">
                      <div
                        class="search-item post-item"
                        *ngFor="let post of searchResults.posts"
                        (mousedown)="navigateToPost(post.id)"
                      >
                        <i class="bi bi-file-text me-2 text-primary"></i>
                        <div class="post-preview flex-grow-1">
                          <div class="post-text">
                            {{ truncateText(post.description, 50) }}
                          </div>
                          <small class="text-muted"
                            >By {{ post.userName }}</small
                          >
                        </div>
                      </div>
                    </div>
                  </div> -->
                </div>

                <!-- No Results -->
                <div
                  *ngIf="!isSearching && !hasSearchResults() && searchQuery"
                  class="no-results"
                >
                  <div class="text-center py-3">
                    <i
                      class="bi bi-search text-muted mb-2"
                      style="font-size: 1.5rem;"
                    ></i>
                    <p class="text-muted small mb-0">
                      No results found for "{{ searchQuery }}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Search Icon -->
        <div class="d-md-none me-2">
          <a class="nav-link text-center px-2 nav-icon">
            <i
              class="bi bi-search d-block text-muted"
              style="font-size: 1.1rem;"
            ></i>
          </a>
        </div>

        <!-- Toggler -->
        <button
          class="navbar-toggler border-0 p-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span
            class="navbar-toggler-icon"
            style="width: 1rem; height: 1rem;"
          ></span>
        </button>

        <!-- Navigation -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav nav-icons mx-auto">
            <!-- Home -->
            <li class="nav-item mx-1">
              <a
                class="nav-link text-center px-2 nav-icon"
                routerLink="/dashboard"
                routerLinkActive="active"
              >
                <i
                  class="bi bi-house-door-fill d-block"
                  [ngClass]="{
                    'text-dark': isActive('/dashboard'),
                    'text-muted': !isActive('/dashboard')
                  }"
                  style="font-size: 1.2rem;"
                ></i>
                <small
                  class="d-none d-lg-block"
                  [ngClass]="{
                    'text-dark fw-bold': isActive('/dashboard'),
                    'text-muted': !isActive('/dashboard')
                  }"
                  style="font-size: 0.7rem;"
                  >Home</small
                >
              </a>
            </li>

            <!-- Network -->
            <li class="nav-item mx-1">
              <a
                class="nav-link text-center px-2 nav-icon position-relative"
                routerLink="/network"
                routerLinkActive="active"
              >
                <div class="position-relative d-inline-block">
                  <i
                    class="bi bi-people-fill d-block"
                    [ngClass]="{
                      'text-dark': isActive('/network'),
                      'text-muted': !isActive('/network')
                    }"
                    style="font-size: 1.2rem;"
                  ></i>
                  <!--  Badge with loading state -->
                  <span
                    *ngIf="hasPendingRequests || loadingPendingCount"
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    [class.bg-danger]="!loadingPendingCount"
                    [class.bg-secondary]="loadingPendingCount"
                    style="font-size: 0.5rem; padding: 0.2em 0.4em; transform: translate(-30%, -30%);"
                  >
                    @if (loadingPendingCount) {
                      <i class="spinner-border spinner-border-sm" style="width: 0.5rem; height: 0.5rem;"></i>
                    } @else {
                      {{ pendingCount }}
                    }
                    <span class="visually-hidden">pending connection requests</span>
                  </span>
                </div>
                <small
                  class="d-none d-lg-block"
                  [ngClass]="{
                    'text-dark fw-bold': isActive('/network'),
                    'text-muted': !isActive('/network')
                  }"
                  style="font-size: 0.7rem;"
                  >Network</small
                >
              </a>
            </li>

            <!-- Post -->
            <li class="nav-item mx-1">
              <a
                class="nav-link text-center px-2 nav-icon"
                routerLink="/create-post"
                routerLinkActive="active"
              >
                <i
                  class="bi bi-plus-square-fill d-block"
                  [ngClass]="{
                    'text-dark': isActive('/create-post'),
                    'text-muted': !isActive('/create-post')
                  }"
                  style="font-size: 1.2rem;"
                ></i>
                <small
                  class="d-none d-lg-block"
                  [ngClass]="{
                    'text-dark fw-bold': isActive('/create-post'),
                    'text-muted': !isActive('/create-post')
                  }"
                  style="font-size: 0.7rem;"
                  >Post</small
                >
              </a>
            </li>

            <!-- Notifications -->
            <li class="nav-item mx-1">
              <a
                class="nav-link text-center px-2 nav-icon position-relative"
                routerLink="/notifications"
                routerLinkActive="active"
              >
                <div class="position-relative d-inline-block">
                  <i
                    class="bi bi-bell-fill d-block"
                    [ngClass]="{
                      'text-dark': isActive('/notifications'),
                      'text-muted': !isActive('/notifications')
                    }"
                    style="font-size: 1.2rem;"
                  ></i>
                  <!--  Notification badge with loading state -->
                  <span
                    *ngIf="hasUnreadNotifications || loadingNotificationCount"
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    [class.bg-danger]="!loadingNotificationCount"
                    [class.bg-secondary]="loadingNotificationCount"
                    style="font-size: 0.5rem; padding: 0.2em 0.4em; transform: translate(-30%, -30%);"
                  >
                    @if (loadingNotificationCount) {
                      <i class="spinner-border spinner-border-sm" style="width: 0.5rem; height: 0.5rem;"></i>
                    } @else {
                      {{ notificationCount }}
                    }
                    <span class="visually-hidden">unread notifications</span>
                  </span>
                </div>
                <small
                  class="d-none d-lg-block"
                  [ngClass]="{
                    'text-dark fw-bold': isActive('/notifications'),
                    'text-muted': !isActive('/notifications')
                  }"
                  style="font-size: 0.7rem;"
                  >Notifications</small
                >
              </a>
            </li>

            <!-- Jobs -->
            <li class="nav-item mx-1">
              <a
                class="nav-link text-center px-2 nav-icon"
                routerLink="/jobs"
                routerLinkActive="active"
              >
                <i
                  class="bi bi-briefcase-fill d-block"
                  [ngClass]="{
                    'text-dark': isActive('/jobs'),
                    'text-muted': !isActive('/jobs')
                  }"
                  style="font-size: 1.2rem;"
                ></i>
                <small
                  class="d-none d-lg-block"
                  [ngClass]="{
                    'text-dark fw-bold': isActive('/jobs'),
                    'text-muted': !isActive('/jobs')
                  }"
                  style="font-size: 0.7rem;"
                  >Jobs</small
                >
              </a>
            </li>
          </ul>

          <!-- User Menu -->
          <ul class="navbar-nav ms-auto" *ngIf="currentUser">
            <li class="nav-item dropdown">
              <a
                class="nav-link text-center px-2 nav-icon d-flex flex-column align-items-center dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <!-- User Icon -->
                <i
                  class="bi bi-person-circle"
                  [ngClass]="{
                    'text-dark': isActive('/profile'),
                    'text-muted': !isActive('/profile')
                  }"
                  style="font-size: 1.2rem;"
                ></i>

                <!-- Text: 'Me' + Dropdown Icon inline -->
                <div
                  class="d-none d-lg-flex align-items-center justify-content-center"
                  style="font-size: 0.7rem; gap: 3px;"
                >
                  <span
                    [ngClass]="{
                      'text-dark fw-bold': isActive('/profile'),
                      'text-muted': !isActive('/profile')
                    }"
                  >
                    Me
                  </span>
                  <i
                    class="bi bi-caret-down-fill"
                    [ngClass]="{
                      'text-dark': isActive('/profile'),
                      'text-muted': !isActive('/profile')
                    }"
                    style="font-size: 0.55rem; margin-top: 1px;"
                  ></i>
                </div>
              </a>

              <!-- Dropdown Menu -->
              <ul
                class="dropdown-menu dropdown-menu-end shadow border-0"
                style="min-width: 260px;"
              >
                <li class="dropdown-header p-2 border-bottom">
                  <div class="d-flex align-items-center">
                    <div class="me-2">
                      <!-- Profile Picture in Dropdown -->
                      @if (currentUserProfilePicture) {
                        <img [src]="currentUserProfilePicture" alt="Profile" class="dropdown-avatar">
                      } @else {
                        <i class="bi bi-person-circle fs-4 text-primary"></i>
                      }
                    </div>
                    <div>
                      <h6 class="mb-0 fw-bold" style="font-size: 0.9rem;">
                        {{ currentUser.name }}
                      </h6>
                      <small class="text-muted" style="font-size: 0.75rem;">
                        {{ currentUser.roleName || 'LinkedIn Member' }}
                      </small>
                    </div>
                  </div>
                </li>

                <li>
                  <a
                    class="dropdown-item py-2"
                    [routerLink]="['/profile', currentUser.id]"
                    style="font-size: 0.85rem;"
                  >
                    <i class="bi bi-person me-2"></i> View Profile
                  </a>
                </li>

                <li>
                  <a
                    class="dropdown-item py-2"
                    routerLink="/posts"
                    style="font-size: 0.85rem;"
                  >
                    <i class="bi bi-plus-circle me-2"></i> Create Post
                  </a>
                </li>

                <li>
                  <a
                    class="dropdown-item py-2"
                    routerLink="/settings"
                    style="font-size: 0.85rem;"
                  >
                    <i class="bi bi-gear me-2"></i> Settings & Privacy
                  </a>
                </li>

                <li><hr class="dropdown-divider my-1" /></li>

                <li>
                  <a
                    class="dropdown-item py-2"
                    href="#"
                    style="font-size: 0.85rem;"
                  >
                    <i class="bi bi-question-circle me-2"></i> Help
                  </a>
                </li>

                <li><hr class="dropdown-divider my-1" /></li>

                <li>
                  <a
                    class="dropdown-item py-2 text-danger"
                    href="#"
                    (click)="logout($event)"
                    style="font-size: 0.85rem;"
                  >
                    <i class="bi bi-box-arrow-right me-2"></i> Sign Out
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        min-height: 48px;
        font-size: 0.875rem;
      }

      .nav-icon {
        padding: 0.25rem 0.5rem;
        min-width: 60px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .nav-icon:hover {
        background-color: #f3f2ef;
      }

      .nav-icon:hover i,
      .nav-icon:hover small {
        color: #000 !important;
        font-weight: 600;
      }

      .nav-link.active {
        position: relative;
      }

      .nav-link.active::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #000;
      }

      .navbar-search {
        flex-grow: 1;
        max-width: 240px;
      }

      .navbar-search .input-group {
        padding: 0.2rem 0.4rem;
      }

      .navbar-search input {
        font-size: 0.8rem;
      }

      .dropdown-menu {
        border-radius: 6px;
        font-size: 0.85rem;
      }

      .dropdown-item:hover {
        background-color: #f3f2ef;
      }

      .nav-icon .badge {
        font-size: 0.5rem;
        padding: 0.2em 0.4em;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Optional: Add pulse animation for attention */
      @keyframes pulse-badge {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      .nav-icon .badge {
        animation: pulse-badge 2s infinite;
      }

      /* Hide Bootstrap's default dropdown arrow */
      .dropdown-toggle::after {
        display: none !important;
      }

      /* ADD: Connection status animation */
      .nav-icon .bi-wifi.text-success {
        animation: pulse-wifi 2s infinite;
      }

      @keyframes pulse-wifi {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
        100% {
          opacity: 1;
        }
      }

      /* SEARCH STYLES */
      .search-container {
        position: relative;
        width: 100%;
        border-radius: 24px;
        border: 1px solid #cececeff;
      }

      .search-results-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-top: 8px;
        z-index: 1050;
        max-height: 400px;
        overflow-y: auto;
      }

      .search-results-content {
        padding: 8px 0;
      }

      .search-loading {
        padding: 12px 16px;
      }

      .search-section {
        margin-bottom: 8px;
      }

      .section-title {
        display: block;
        padding: 0 16px 4px 16px;
      }

      .search-items {
        padding: 4px 0;
      }

      .search-item {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .search-item:hover {
        background-color: #f8f9fa;
      }

      .user-item {
        display: flex;
        align-items: center;
      }

      .user-avatar {
        font-size: 1.5rem;
        color: #0a66c2;
        flex-shrink: 0;
      }

      .user-info {
        min-width: 0;
      }

      .user-name {
        font-size: 0.9rem;
        margin-bottom: 2px;
      }

      .mutual-connections {
        margin-top: 2px;
      }

      .btn-connect {
        background: #0a66c2;
        color: white;
        border: none;
        border-radius: 16px;
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .btn-connect:hover {
        background: #004182;
      }

      .btn-view-profile {
        background: transparent;
        color: #0a66c2;
        border: 1px solid #0a66c2;
        border-radius: 16px;
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .btn-view-profile:hover {
        background: #f0f7ff;
      }

      .post-item {
        display: flex;
        align-items: flex-start;
      }

      .post-text {
        font-size: 0.85rem;
        line-height: 1.3;
        margin-bottom: 2px;
        color: #333;
      }

      .no-results {
        padding: 16px;
      }

      /* Logo Styles */
      .logo-container {
        display: flex;
        align-items: center;
        line-height: 1;
      }

      .logo-linked {
        font-size: 1.6rem;
        font-weight: 700;
        color: #0a66c2;
        letter-spacing: -0.5px;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI',
          Roboto, sans-serif;
      }

      .logo-in-box {
        font-size: 1.6rem;
        font-weight: 700;
        color: #ffffff ;
        background: #0a66c2;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 4px;
        line-height: 1;
      }

      /* ✅ ADDED: Profile Picture Styles */
      .avatar-image {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #e0e0e0;
      }

      .dropdown-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #e0e0e0;
      }

      /* ✅ ADDED: Search History Styles */
      .search-history-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-top: 8px;
        z-index: 1050;
        max-height: 300px;
        overflow-y: auto;
      }

      .search-history-header {
        border-bottom: 1px solid #f0f0f0;
      }

      .btn-clear-history {
        background: none;
        border: none;
        color: #666;
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .btn-clear-history:hover {
        background-color: #f8f9fa;
        color: #333;
      }

      .history-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
      }

      .history-item:hover {
        background-color: #f8f9fa;
      }

      .history-text {
        font-size: 0.85rem;
        color: #333;
        flex-grow: 1;
      }

      .remove-history {
        color: #999;
        font-size: 0.9rem;
        padding: 4px;
        border-radius: 3px;
        transition: all 0.2s ease;
        opacity: 0;
      }

      .history-item:hover .remove-history {
        opacity: 1;
      }

      .remove-history:hover {
        background-color: #e9ecef;
        color: #dc3545;
      }

      /* For smaller screens */
      @media (max-width: 768px) {
        .logo-linked {
          font-size: 1.4rem;
        }

        .logo-in-box {
          font-size: 1.1rem;
        }
      }
      @media (max-width: 768px) {
        .nav-icon {
          min-width: 45px;
          padding: 0.2rem;
        }
        .nav-icon small {
          display: none !important;
        }
        .navbar {
          min-height: 44px;
        }
        .nav-icon .badge {
          font-size: 0.45rem;
          padding: 0.15em 0.3em;
          min-width: 14px;
          height: 14px;
        }

        .search-results-dropdown {
          position: fixed;
          top: 60px;
          left: 10px;
          right: 10px;
          z-index: 1060;
        }

        .search-history-dropdown {
          position: fixed;
          top: 60px;
          left: 10px;
          right: 10px;
          z-index: 1060;
        }
      }
    `,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {

  private lastPendingCountFetch: number = 0;
private lastNotificationCountFetch: number = 0;
private lastProfileFetch: number = 0;
private readonly CACHE_DURATION = 30000; // 30 seconds cache
  // User & Auth
  currentUser: CurrentUser | null = null;
  currentUserProfilePicture: string = '';  

  // Badges & Counts
  pendingCount: number = 0;
  hasPendingRequests: boolean = false;
  notificationCount: number = 0;
  hasUnreadNotifications: boolean = false;
  loadingPendingCount: boolean = false; // ✅ ADDED
  loadingNotificationCount: boolean = false; // ✅ ADDED

  // SEARCH PROPERTIES
  searchQuery: string = '';
  searchResults: any = { users: [], posts: [] };
  showSearchResults: boolean = false;
  isSearching: boolean = false;
  currentPage: string = 'home';
  
  // Search History Properties
  searchHistory: string[] = [];
  showSearchHistory: boolean = false;

  private searchSubject = new Subject<string>();
  private routerSubscription!: Subscription;
  private pendingCountSubscription!: Subscription;
  private notificationCountSubscription!: Subscription;
  private connectionStateSubscription!: Subscription; 
  private refreshInterval: any;
  private searchSubscription?: Subscription; 

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private connectionService: ConnectionService,
    private sharedStateService: SharedStateService,
    private notificationService: NotificationService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService 
  ) {}

  ngOnInit() {
    this.loadSearchHistory(); 

    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadCurrentUserProfile(); // replaces loadCurrentUserProfilePicture
        this.loadPendingCount();
        this.loadNotificationCount();
        this.subscribeToPendingCount();
        this.subscribeToNotificationCount();      
        this.startAutoRefresh();
      }
    });

    // Track current page for context-aware search
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.determineCurrentPage(event.url);
      });

    // Initial page determination
    this.determineCurrentPage(this.router.url);

    // Setup search debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        if (query.trim()) {
          this.performSearch();
        } else {
          this.searchResults = { users: [], posts: [] };
        }
      });
  }

  ngOnDestroy() {
    if (this.pendingCountSubscription) {
      this.pendingCountSubscription.unsubscribe();
    }
    if (this.notificationCountSubscription) {
      this.notificationCountSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.searchSubscription) { 
      this.searchSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Profile Picture Methods
  getProfilePictureUrl(profilePicturePath: string | undefined): string {
  return this.apiService.getImageUrl(profilePicturePath || '');
}
  private loadCurrentUserProfile(): void {
  const now = Date.now();
  
  // Check if we fetched recently
  if (now - this.lastProfileFetch < this.CACHE_DURATION) {
    return; // Skip if fetched within last 30 seconds
  }

  if (this.currentUser && this.currentUser.id) {
    this.apiService.getUserById(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUserProfilePicture = this.getProfilePictureUrl(response.data.profilePicture);
          this.lastProfileFetch = now;
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }
}

  // Search History Methods
  private loadSearchHistory() {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      this.searchHistory = JSON.parse(history);
    }
  }

  private saveToSearchHistory(query: string) {
    if (!query.trim()) return;
    
    this.searchHistory = this.searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
    this.searchHistory.unshift(query.trim());
    this.searchHistory = this.searchHistory.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  clearSearchHistory(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.searchHistory = [];
    localStorage.removeItem('searchHistory');
  }

  selectSearchHistory(item: string) {
    this.searchQuery = item;
    this.performSearch();
    this.showSearchHistory = false;
  }

  removeFromHistory(item: string, event: Event) {
    event.stopPropagation();
    this.searchHistory = this.searchHistory.filter(historyItem => historyItem !== item);
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  // Search Focus Method
  onSearchFocus() {
    this.showSearchHistory = !this.searchQuery.trim();
    this.showSearchResults = !!this.searchQuery.trim();
  }

  // Search Input Method
  onSearchInput() {
    this.showSearchHistory = !this.searchQuery.trim();
    this.searchSubject.next(this.searchQuery);
  }

  // Search Blur Method
  onSearchBlur() {
    setTimeout(() => {
      this.showSearchResults = false;
      this.showSearchHistory = false;
    }, 200);
  }

  // Perform Search with History and Cancellation
  performSearch() {
    if (!this.searchQuery.trim() || !this.currentUser) {
      this.searchResults = { users: [], posts: [] };
      return;
    }

    // Save to history
    this.saveToSearchHistory(this.searchQuery.trim());
    
    // Cancel previous search if still running
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.isSearching = true;
    this.showSearchResults = true;
    this.showSearchHistory = false;

    this.searchSubscription = this.searchService
      .search(this.searchQuery, this.currentUser.id, this.currentPage)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.searchResults = response.data;
          }
          this.isSearching = false;
          this.searchSubscription = undefined;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isSearching = false;
          this.searchSubscription = undefined;
        },
      });
  }

  // Keyboard Navigation
  onSearchKeydown(event: KeyboardEvent) {
    const results = this.getVisibleResults();
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextResult();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousResult();
        break;
      case 'Escape':
        this.clearSearch();
        this.searchInput.nativeElement.blur();
        break;
      case 'Enter':
        if (!this.searchQuery.trim()) {
          event.preventDefault();
        }
        break;
    }
  }

  private getVisibleResults(): any[] {
    if (this.showSearchHistory) {
      return this.searchHistory.map(item => ({ type: 'history', value: item }));
    }
    
    const results = [...this.searchResults.users.map((user: any) => ({ ...user, type: 'user' }))];
    if (this.currentPage === 'home') {
      results.push(...this.searchResults.posts.map((post: any) => ({ ...post, type: 'post' })));
    }
    return results;
  }

  private focusNextResult() {
    const focusedElement = document.activeElement;
    const results = document.querySelectorAll('.search-item, .history-item');
    
    if (results.length > 0) {
      const currentIndex = Array.from(results).indexOf(focusedElement as Element);
      const nextIndex = (currentIndex + 1) % results.length;
      (results[nextIndex] as HTMLElement).focus();
    }
  }

  private focusPreviousResult() {
    const focusedElement = document.activeElement;
    const results = document.querySelectorAll('.search-item, .history-item');
    
    if (results.length > 0) {
      const currentIndex = Array.from(results).indexOf(focusedElement as Element);
      const prevIndex = (currentIndex - 1 + results.length) % results.length;
      (results[prevIndex] as HTMLElement).focus();
    }
  }

  // Count Loading Methods with Loading States
  loadPendingCount(forceRefresh: boolean = false) {
  if (!this.currentUser) return;

  const now = Date.now();
  
  // Check cache unless force refresh
  if (!forceRefresh && now - this.lastPendingCountFetch < this.CACHE_DURATION) {
    return; // Skip if fetched within cache duration
  }

  this.loadingPendingCount = true;
  this.connectionService
    .getPendingConnections(this.currentUser.id)
    .subscribe({
      next: (response) => {
        this.loadingPendingCount = false;
        if (response.success && response.data) {
          const count = response.data.length;
          this.pendingCount = count;
          this.hasPendingRequests = count > 0;
          this.sharedStateService.updatePendingCount(count);
          this.lastPendingCountFetch = now;
        }
      },
      error: (error) => {
        this.loadingPendingCount = false;
        console.error('Error loading pending connections count:', error);
        this.pendingCount = 0;
        this.hasPendingRequests = false;
        this.sharedStateService.updatePendingCount(0);
      },
    });
}

  loadNotificationCount(forceRefresh: boolean = false) {
  if (!this.currentUser) return;

  const now = Date.now();
  
  // Check cache unless force refresh
  if (!forceRefresh && now - this.lastNotificationCountFetch < this.CACHE_DURATION) {
    return; // Skip if fetched within cache duration
  }

  this.loadingNotificationCount = true;
  this.notificationService.getUnreadCount(this.currentUser.id).subscribe({
    next: (response) => {
      this.loadingNotificationCount = false;
      if (response.success) {
        const count = response.data;
        this.notificationCount = count;
        this.hasUnreadNotifications = count > 0;
        this.sharedStateService.updateNotificationCount(count);
        this.lastNotificationCountFetch = now;
      }
    },
    error: (error) => {
      this.loadingNotificationCount = false;
      console.error('Error loading notification count:', error);
      this.notificationCount = 0;
      this.hasUnreadNotifications = false;
      this.sharedStateService.updateNotificationCount(0);
    },
  });
}

  // KEEP ALL YOUR EXISTING METHODS EXACTLY AS THEY ARE:

  determineCurrentPage(url: string) {
    if (url.includes('/network')) {
      this.currentPage = 'network';
    } else {
      this.currentPage = 'home';
    }
  }

  getSearchPlaceholder(): string {
    return this.currentPage === 'network' ? 'Search' : 'Search';
  }

  handleUserClick(user: any) {
    if (this.currentPage === 'network') {
      // Keep results open for connection in network page
      return;
    } else {
      this.navigateToProfile(user.id);
    }
  }

  sendConnectionRequest(user: any, event: Event) {
    event.stopPropagation();

    if (!this.currentUser) return;

    const request = {
      senderId: this.currentUser.id,
      receiverId: user.id,
    };

    this.connectionService.sendConnectionRequest(request).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove user from search results
          this.searchResults.users = this.searchResults.users.filter(
            (u: any) => u.id !== user.id
          );

          Swal.fire({
            icon: 'success',
            title: 'Request Sent!',
            text: `Connection request sent to ${user.name}`,
            timer: 1500,
            showConfirmButton: false,
          });
        }
      },
      error: (error) => {
        console.error('Error sending connection request:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to send connection request',
        });
      },
    });
  }

  navigateToProfile(userId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/profile', userId]);
    this.clearSearch();
  }

  navigateToPost(postId: number) {
    this.router.navigate(['/dashboard']);
    this.clearSearch();
  }

  hasSearchResults(): boolean {
    return (
      this.searchResults.users.length > 0 ||
      (this.currentPage === 'home' && this.searchResults.posts.length > 0)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = { users: [], posts: [] };
    this.showSearchResults = false;
    this.showSearchHistory = false;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private subscribeToPendingCount() {
    this.pendingCountSubscription =
      this.sharedStateService.pendingCount$.subscribe((count) => {
        this.pendingCount = count;
        this.hasPendingRequests = count > 0;
      });
  }

  private subscribeToNotificationCount() {
    this.notificationCountSubscription =
      this.sharedStateService.notificationCount$.subscribe((count) => {
        this.notificationCount = count;
        this.hasUnreadNotifications = count > 0;
      });
  }

 private startAutoRefresh(): void {
  // Increase interval to 60 seconds instead of 15
  this.refreshInterval = setInterval(() => {
    if (this.currentUser) {
      this.loadNotificationCount(true); // Force refresh
      this.loadPendingCount(true); // Force refresh
    }
  }, 60000); // Every 60 seconds instead of 15
}

  public refreshAllCounts(): void {
  if (this.currentUser) {
    this.loadNotificationCount(true);
    this.loadPendingCount(true);
  }
}
}
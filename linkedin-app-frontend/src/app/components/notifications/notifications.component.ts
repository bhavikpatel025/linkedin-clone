import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { SharedStateService } from '../../services/shared-state.service';
import { Notification } from '../../models/notification';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="notifications-header">
        <div class="container">
          <div class="header-content">
            <div class="d-flex align-items-center">
              <button class="btn btn-back me-3" routerLink="/dashboard">
                <i class="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 class="mb-0 fw-bold">Notifications</h4>
                <small class="text-muted"
                  >Stay updated with your network activity</small
                >
              </div>
            </div>
            <div class="header-actions">
              <div class="unread-badge" *ngIf="unreadCount > 0">
                <span class="badge bg-primary">{{ unreadCount }} unread</span>
              </div>

              <!-- Header dropdown menu for bulk actions -->
              <div class="dropdown" *ngIf="notifications.length > 0">
                <button
                  class="btn btn-action-dropdown"
                  type="button"
                  data-bs-toggle="dropdown"
                  title="More actions"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end action-dropdown">
                  <li *ngIf="unreadCount > 0">
                    <a
                      class="dropdown-item d-flex align-items-center"
                      href="javascript:void(0)"
                      (click)="markAllAsRead()"
                    >
                      <div class="dropdown-icon">
                        <i class="bi bi-check-all"></i>
                      </div>
                      <div class="dropdown-content">
                        <div class="dropdown-title">Mark all as read</div>
                      </div>
                    </a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a
                      class="dropdown-item d-flex align-items-center text-danger"
                      href="javascript:void(0)"
                      (click)="deleteAllNotifications()"
                    >
                      <div class="dropdown-icon">
                        <i class="bi bi-trash"></i>
                      </div>
                      <div class="dropdown-content">
                        <div class="dropdown-title">Delete all notifications</div>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-xl-6">
            <!-- Real-time Notification Alert -->
            <div
              *ngIf="newRealTimeNotification"
              class="alert alert-info alert-dismissible fade show mb-3"
              role="alert"
            >
              <strong>New notification!</strong>
              {{ newRealTimeNotification.title }} -
              {{ newRealTimeNotification.message }}
              <button
                type="button"
                class="btn-close"
                (click)="dismissRealTimeAlert()"
              ></button>
            </div>

            <!-- Filter Tabs -->
            <div class="filter-tabs mb-4" *ngIf="notifications.length > 0">
              <div class="tabs-container">
                <button
                  class="tab-button"
                  [class.active]="activeFilter === 'all'"
                  (click)="setFilter('all')"
                >
                  All
                </button>
                <button
                  class="tab-button"
                  [class.active]="activeFilter === 'unread'"
                  (click)="setFilter('unread')"
                >
                  Unread
                </button>
                <button
                  class="tab-button"
                  [class.active]="activeFilter === 'connections'"
                  (click)="setFilter('connections')"
                >
                  Connections
                </button>
                <button
                  class="tab-button"
                  [class.active]="activeFilter === 'engagement'"
                  (click)="setFilter('engagement')"
                >
                  Engagement
                </button>
              </div>
            </div>

            <!-- Notifications List -->
            <div class="notifications-list">
              <!-- Empty State -->
              <div
                *ngIf="filteredNotifications.length === 0"
                class="empty-state"
              >
                <div class="empty-icon">
                  <i class="bi bi-bell"></i>
                </div>
                <h5>No notifications</h5>
                <p class="text-muted">
                  {{ getEmptyStateMessage() }}
                </p>
                <button class="btn btn-primary" routerLink="/network">
                  <i class="bi bi-people me-2"></i>
                  Build your network
                </button>
              </div>

              <!-- Notifications -->
              <div
                *ngFor="let notification of filteredNotifications"
                class="notification-card"
                [class.unread]="!notification.isRead"
                [class.new-real-time]="isNewRealTimeNotification(notification)"
                (click)="handleNotificationClick(notification)"
              >
                <!-- Notification Avatar -->
                <div class="notification-avatar">
                  <div
                    class="avatar-container"
                    [class]="getAvatarClass(notification.type)"
                  >
                    <i [class]="getNotificationIcon(notification.type)"></i>
                  </div>
                </div>

                <!-- Notification Content -->
                <div class="notification-content">
                  <div class="notification-header">
                    <h6 class="notification-title">{{ notification.title }}</h6>
                    <div class="notification-header-actions">
                      <span class="notification-time">{{
                        notification.timeAgo
                      }}</span>
                      <div class="dropdown notification-dropdown">
                        <button
                          class="btn btn-dropdown"
                          type="button"
                          data-bs-toggle="dropdown"
                          (click)="$event.stopPropagation()"
                        >
                          <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                          <li *ngIf="!notification.isRead">
                            <a
                              class="dropdown-item"
                              href="javascript:void(0)"
                              (click)="markAsRead(notification.id, $event)"
                            >
                              <i class="bi bi-check me-2"></i>
                              Mark as read
                            </a>
                          </li>
                          <li>
                            <a
                              class="dropdown-item text-danger"
                              href="javascript:void(0)"
                              (click)="
                                deleteNotification(notification.id, $event)
                              "
                            >
                              <i class="bi bi-trash me-2"></i>
                              Delete notification
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p class="notification-message">{{ notification.message }}</p>

                  <!-- Sender Info -->
                  <div class="sender-info" *ngIf="notification.senderId">
                    <small class="text-muted">
                      From
                      <strong>{{
                        notification.senderName ||
                          'User #' + notification.senderId
                      }}</strong>
                    </small>
                  </div>

                  <!-- Real-time Badge -->
                  <div
                    *ngIf="isNewRealTimeNotification(notification)"
                    class="real-time-badge"
                  >
                    <span class="badge bg-success">New</span>
                  </div>
                </div>

                <!-- Unread Indicator -->
                <div
                  class="unread-indicator"
                  *ngIf="!notification.isRead"
                ></div>
              </div>

              <!-- Load More -->
              <div
                class="load-more-section"
                *ngIf="hasMoreNotifications && filteredNotifications.length > 0"
              >
                <button class="btn btn-load-more" (click)="loadMore()">
                  <i class="bi bi-arrow-clockwise me-2"></i>
                  Load more notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Right Toast Notifications -->
      <div class="notification-toast-container">
        <div *ngFor="let toast of toasts" 
             [class]="'notification-toast toast-' + toast.type"
             [class.show]="toast.show"
             [class.hiding]="toast.hiding"
             (click)="handleToastClick(toast)">
          <div class="toast-icon">
            <i [class]="getToastIcon(toast.type)"></i>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            <div class="toast-time">{{ toast.time }}</div>
          </div>
          <button class="toast-close" (click)="removeToast(toast)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      min-height: 100vh;
      background-color: #f4f2ee;
      padding: 10px 0 10px 0;
    }

    /* Bottom Right Toast Notifications - Enhanced */
    .notification-toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification-toast {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border-left: 4px solid #0a66c2;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 320px;
      max-width: 400px;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .notification-toast::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #0a66c2, #00a0dc);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 3s linear;
    }

    .notification-toast.show::before {
      transform: scaleX(1);
    }

    .notification-toast.show {
      transform: translateX(0);
      opacity: 1;
    }

    .notification-toast.hiding {
      transform: translateX(100%);
      opacity: 0;
    }

    .notification-toast:hover {
      transform: translateX(-5px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }

    .toast-success {
      border-left-color: #28a745;
    }

    .toast-success::before {
      background: linear-gradient(90deg, #28a745, #20c997);
    }

    .toast-error {
      border-left-color: #dc3545;
    }

    .toast-error::before {
      background: linear-gradient(90deg, #dc3545, #e83e8c);
    }

    .toast-warning {
      border-left-color: #ffc107;
    }

    .toast-warning::before {
      background: linear-gradient(90deg, #ffc107, #fd7e14);
    }

    .toast-info {
      border-left-color: #0a66c2;
    }

    .toast-info::before {
      background: linear-gradient(90deg, #0a66c2, #00a0dc);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .toast-success .toast-icon {
      background: linear-gradient(135deg, #28a745, #20c997);
    }

    .toast-error .toast-icon {
      background: linear-gradient(135deg, #dc3545, #e83e8c);
    }

    .toast-warning .toast-icon {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: #000;
    }

    .toast-info .toast-icon {
      background: linear-gradient(135deg, #0a66c2, #00a0dc);
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
      font-size: 0.95rem;
      line-height: 1.3;
    }

    .toast-message {
      color: #6b7280;
      margin: 0 0 4px 0;
      font-size: 0.875rem;
      line-height: 1.4;
      word-wrap: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .toast-time {
      color: #9ca3af;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .notifications-header {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .unread-badge .badge {
      font-size: 0.75rem;
      padding: 4px 8px;
    }

    .btn-mark-all {
      background: transparent;
      border: 1px solid #0a66c2;
      color: #0a66c2;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .btn-mark-all:hover {
      background: #0a66c2;
      color: white;
    }

    /* Header dropdown styles */
    .header-actions .dropdown-toggle {
      background: transparent;
      border: 1px solid #0a66c2;
      color: #0a66c2;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .header-actions .dropdown-toggle:hover {
      background: #0a66c2;
      color: white;
    }

    .header-actions .dropdown-menu {
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }

    .header-actions .dropdown-item {
      padding: 8px 16px;
      font-size: 0.875rem;
    }

    .header-actions .dropdown-item:hover {
      background-color: #f8f9fa;
    }

    .header-actions .dropdown-item.text-danger:hover {
      background-color: #ffebee;
      color: #dc3545;
    }

    /* Connection Status */
    .connection-status {
      font-size: 0.75rem;
      font-weight: 500;
    }
    .connection-status.connected {
      color: #28a745;
    }
    .connection-status.disconnected {
      color: #dc3545;
    }

    /* Real-time Notification Styles */
    .notification-card.new-real-time {
      border-left: 4px solid #28a745;
      animation: pulse-new 2s ease-in-out;
    }

    .real-time-badge {
      margin-top: 4px;
    }

    @keyframes pulse-new {
      0% {
        background-color: rgba(40, 167, 69, 0.1);
      }
      50% {
        background-color: rgba(40, 167, 69, 0.2);
      }
      100% {
        background-color: rgba(40, 167, 69, 0.1);
      }
    }

    /* Filter Tabs */
    .filter-tabs {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tabs-container {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }

    .tab-button {
      background: transparent;
      border: 1px solid #e0e0e0;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-button:hover {
      background: #f8f9fa;
    }

    .tab-button.active {
      background: #0a66c2;
      color: white;
      border-color: #0a66c2;
    }

    /* Notifications List */
    .notifications-list {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-icon {
      font-size: 4rem;
      color: #e0e0e0;
      margin-bottom: 16px;
    }

    .empty-state h5 {
      color: #333;
      margin-bottom: 8px;
    }

    /* Notification Card - LinkedIn Style */
    .notification-card {
      display: flex;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
      transition: background-color 0.2s ease;
      cursor: pointer;
    }

    .notification-card:hover {
      background-color: #f8f9fa;
    }

    .notification-card.unread {
      background-color: #f0f7ff;
    }

    .notification-card:last-child {
      border-bottom: none;
    }

    /* Notification Avatar */
    .notification-avatar {
      margin-right: 16px;
      flex-shrink: 0;
    }

    .avatar-container {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .avatar-connection {
      background: #e3f2fd;
      color: #1976d2;
    }

    .avatar-like {
      background: #fce4ec;
      color: #c2185b;
    }

    .avatar-comment {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .avatar-message {
      background: #fff3e0;
      color: #ef6c00;
    }

    .avatar-default {
      background: #f3f2ef;
      color: #666;
    }

    /* Notification Content - LinkedIn Style Layout */
    .notification-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .notification-title {
      font-weight: 600;
      color: #333;
      margin: 0;
      font-size: 0.95rem;
      flex: 1;
      margin-right: 12px;
    }

    .notification-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #666;
      white-space: nowrap;
    }

    .notification-message {
      color: #666;
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .sender-info {
      margin-bottom: 8px;
    }

    .sender-info small {
      font-size: 0.75rem;
      color: #666;
    }

    /* Individual notification dropdown styles - LinkedIn Style */
    .btn-dropdown {
      background: transparent;
      border: none;
      color: #666;
      padding: 4px 6px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .notification-card:hover .btn-dropdown {
      opacity: 1;
    }

    .btn-dropdown:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    .notification-dropdown .dropdown-menu {
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      min-width: 180px;
    }

    .notification-dropdown .dropdown-item {
      padding: 8px 12px;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
    }

    .notification-dropdown .dropdown-item:hover {
      background-color: #f8f9fa;
    }

    .notification-dropdown .dropdown-item.text-danger:hover {
      background-color: #ffebee;
      color: #dc3545;
    }

    /* Hide old action buttons since we're using dropdown now */
    .notification-actions {
      display: none;
    }

    /* Delete button hover styles */
    .btn-delete:hover {
      background: #ffebee;
      border-color: #f44336;
      color: #f44336;
    }

    /* Unread Indicator */
    .unread-indicator {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0a66c2;
    }

    /* LinkedIn-style ellipsis for long content */
    .notification-ellipsis {
      color: #666;
      font-size: 1.5rem;
      line-height: 1;
      margin-left: 4px;
    }

    /* Load More */
    .load-more-section {
      padding: 20px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }

    .btn-load-more {
      background: transparent;
      border: 1px solid #0a66c2;
      color: #0a66c2;
      padding: 8px 16px;
      border-radius: 20px;
      transition: all 0.2s ease;
    }

    .btn-load-more:hover {
      background: #0a66c2;
      color: white;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .notifications-container {
        padding: 60px 0 0 0;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .notification-card {
        padding: 12px 16px;
      }

      .avatar-container {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }

      .notification-title {
        font-size: 0.9rem;
      }

      .notification-message {
        font-size: 0.85rem;
        -webkit-line-clamp: 3;
      }

      .notification-header-actions {
        gap: 4px;
      }

      .btn-dropdown {
        opacity: 1;
        padding: 4px;
      }

      .notification-toast-container {
        bottom: 10px;
        right: 10px;
        max-width: 350px;
      }

      .notification-toast {
        min-width: 280px;
        max-width: 350px;
      }
    }

    @media (max-width: 576px) {
      .container {
        padding: 0 12px;
      }

      .tabs-container {
        gap: 4px;
      }

      .tab-button {
        padding: 6px 12px;
        font-size: 0.8rem;
      }

      .notification-dropdown .dropdown-menu {
        min-width: 160px;
      }

      .notification-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .notification-header-actions {
        align-self: flex-end;
      }

      .notification-title {
        margin-right: 0;
      }

      .notification-toast-container {
        bottom: 5px;
        right: 5px;
        max-width: 320px;
      }

      .notification-toast {
        min-width: 260px;
        max-width: 320px;
        padding: 12px;
      }
    }
  `],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount: number = 0;
  currentUserId: number;
  activeFilter: string = 'all';
  hasMoreNotifications: boolean = true;
  toasts: any[] = [];

  // SignalR properties
  private subscriptions = new Subscription();
  isConnected: boolean = false;
  newRealTimeNotification: Notification | null = null;
  recentRealTimeNotificationIds: Set<number> = new Set();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private sharedStateService: SharedStateService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getCurrentUserId() ?? 0;
  }

  ngOnInit() {
    this.loadNotifications();
    this.setupRealTimeListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Enhanced Toast notification methods
  private showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 5000): void {
    const toast = {
      id: Date.now(),
      type,
      title,
      message,
      time: this.getCurrentTime(),
      duration,
      show: false,
      hiding: false
    };

    this.toasts.push(toast);
    
    // Trigger show animation
    setTimeout(() => {
      toast.show = true;
    }, 100);

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  }

  private getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  removeToast(toast: any): void {
    if (toast.hiding) return;
    
    toast.hiding = true;
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== toast.id);
    }, 300);
  }

  // Handle toast click to navigate to relevant page
  handleToastClick(toast: any): void {
    this.removeToast(toast);
    // Navigate to notifications page when toast is clicked
    this.router.navigate(['/notifications']);
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'bi bi-check-lg';
      case 'error':
        return 'bi bi-x-lg';
      case 'warning':
        return 'bi bi-exclamation-triangle';
      case 'info':
        return 'bi bi-info-lg';
      default:
        return 'bi bi-bell';
    }
  }

  // Real-time notification methods
  private setupRealTimeListeners(): void {
    // Listen for real-time notifications
    this.subscriptions.add(
      this.notificationService.realTimeNotifications$.subscribe(
        (notification) => {
          this.handleRealTimeNotification(notification);
        }
      )
    );

    // Listen for unread count updates
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
        this.sharedStateService.updateNotificationCount(count);
      })
    );

    // Listen for connection state
    this.subscriptions.add(
      this.notificationService.connectionState$.subscribe((connected) => {
        this.isConnected = connected;
      })
    );
  }

  private handleRealTimeNotification(notification: Notification): void {
    console.log('Real-time notification received in component:', notification);

    const exists = this.notifications.some((n) => n.id === notification.id);
    if (exists) return;
    
    // Add to recent notifications set for highlighting
    this.recentRealTimeNotificationIds.add(notification.id);

    // Show alert for new notification
    this.newRealTimeNotification = notification;

    // Auto-dismiss alert after 5 seconds
    setTimeout(() => {
      if (this.newRealTimeNotification?.id === notification.id) {
        this.newRealTimeNotification = null;
      }
    }, 5000);

    // Add notification to the top of the list
    this.notifications.unshift(notification);
    this.applyFilter();

    // Update unread count
    if (!notification.isRead) {
      this.unreadCount++;
      this.sharedStateService.updateNotificationCount(this.unreadCount);
    }

    // Show enhanced bottom-right toast notification
    this.showEnhancedToastNotification(notification);
  }

  private showEnhancedToastNotification(notification: Notification): void {
    let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
    
    // Determine toast type based on notification type
    if (notification.type.includes('connection')) {
      toastType = 'success';
    } else if (notification.type.includes('like')) {
      toastType = 'warning';
    } else if (notification.type.includes('comment')) {
      toastType = 'info';
    } else if (notification.type.includes('message')) {
      toastType = 'info';
    }

    this.showToast(
      toastType,
      notification.title,
      notification.message,
      6000 // Longer duration for better visibility
    );
  }

  isNewRealTimeNotification(notification: Notification): boolean {
    return this.recentRealTimeNotificationIds.has(notification.id);
  }

  dismissRealTimeAlert(): void {
    this.newRealTimeNotification = null;
  }

  // Existing methods (keep them as they are)
  loadNotifications() {
    this.notificationService
      .getUserNotifications(this.currentUserId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notifications = response.data || [];
            this.applyFilter();
            this.updateUnreadCount();
          }
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load notifications',
          });
        },
      });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(
          (n) => !n.isRead
        );
        break;
      case 'connections':
        this.filteredNotifications = this.notifications.filter((n) =>
          n.type.includes('connection')
        );
        break;
      case 'engagement':
        this.filteredNotifications = this.notifications.filter(
          (n) => n.type.includes('like') || n.type.includes('comment')
        );
        break;
      default:
        this.filteredNotifications = this.notifications;
    }
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
    this.navigateToNotificationSource(notification);
  }

  navigateToNotificationSource(notification: Notification) {
    switch (notification.type) {
      case 'connection_request':
        this.router.navigate(['/network']);
        break;
      case 'post_like':
      case 'comment':
        if (notification.relatedEntityId) {
          this.router.navigate(['/post', notification.relatedEntityId]);
        }
        break;
      default:
        break;
    }
  }

  markAsRead(notificationId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.notificationService
      .markAsRead(notificationId, this.currentUserId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const notification = this.notifications.find(
              (n) => n.id === notificationId
            );
            if (notification) {
              notification.isRead = true;
              this.applyFilter();
            }

            this.sharedStateService.decrementNotificationCount();
            this.updateUnreadCount();
          }
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        },
      });
  }

  deleteNotification(notificationId: number, event: Event) {
    event.stopPropagation();

    Swal.fire({
      title: 'Delete Notification?',
      text: 'Are you sure you want to delete this notification? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDelete(notificationId);
      }
    });
  }

  deleteAllNotifications(): void {
    if (this.notifications.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No notifications',
        text: 'There are no notifications to delete.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    Swal.fire({
      title: 'Delete All Notifications?',
      text: `Are you sure you want to delete all ${this.notifications.length} notifications? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete all!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      backdrop: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDeleteAll();
      }
    });
  }

  private performDeleteAll(): void {
    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait while we delete all notifications',
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 30000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.notificationService.deleteAllNotifications(this.currentUserId).subscribe({
      next: (response) => {
        const swalInstance = Swal.getPopup();
        if (swalInstance) {
          Swal.close();
        }

        if (response.success) {
          this.notifications = [];
          this.filteredNotifications = [];
          this.unreadCount = 0;
          this.sharedStateService.updateNotificationCount(0);
          this.recentRealTimeNotificationIds.clear();
          
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'All notifications have been deleted successfully.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Failed to delete notifications'
          });
        }
      },
      error: (error) => {
        const swalInstance = Swal.getPopup();
        if (swalInstance) {
          Swal.close();
        }

        console.error('Error deleting all notifications:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete notifications. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  private performDelete(notificationId: number): void {
    this.notificationService
      .deleteNotification(notificationId, this.currentUserId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const deletedNotification = this.notifications.find(
              (n) => n.id === notificationId
            );
            this.notifications = this.notifications.filter(
              (n) => n.id !== notificationId
            );
            this.applyFilter();

            if (deletedNotification && !deletedNotification.isRead) {
              this.unreadCount = Math.max(0, this.unreadCount - 1);
              this.sharedStateService.updateNotificationCount(this.unreadCount);
            }

            this.recentRealTimeNotificationIds.delete(notificationId);

            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Notification has been deleted.',
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.message || 'Failed to delete notification',
            });
          }
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete notification. Please try again.',
          });
        },
      });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(
            (notification) => (notification.isRead = true)
          );
          this.applyFilter();

          this.sharedStateService.resetNotificationCount();
          this.updateUnreadCount();

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'All notifications marked as read',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      },
    });
  }

  loadMore() {
    console.log('Loading more notifications...');
  }

  getEmptyStateMessage(): string {
    switch (this.activeFilter) {
      case 'unread':
        return 'You have no unread notifications';
      case 'connections':
        return 'No connection notifications yet';
      case 'engagement':
        return 'No engagement notifications yet';
      default:
        return 'When you get notifications, they will appear here';
    }
  }

  getAvatarClass(type: string): string {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return 'avatar-connection';
      case 'post_like':
        return 'avatar-like';
      case 'comment':
        return 'avatar-comment';
      case 'message':
        return 'avatar-message';
      default:
        return 'avatar-default';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return 'bi bi-people-fill';
      case 'post_like':
        return 'bi bi-heart-fill';
      case 'comment':
        return 'bi bi-chat-fill';
      case 'message':
        return 'bi bi-envelope-fill';
      default:
        return 'bi bi-bell-fill';
    }
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
    this.sharedStateService.updateNotificationCount(this.unreadCount);
  }
}
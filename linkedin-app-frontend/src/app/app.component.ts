import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { FooterComponent } from "./components/footer/footer.component"; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent ],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="showNavbar"></app-navbar>
      <main class="main-content" [class.with-navbar]="showNavbar">
        <router-outlet></router-outlet>
         <app-footer *ngIf="showFooter"></app-footer>
      </main>

      <!-- Global Bottom Right Toast Notifications -->
      <div class="global-toast-container">
        <div *ngFor="let toast of globalToasts" 
             [class]="'global-toast toast-' + toast.type"
             [class.show]="toast.show"
             [class.hiding]="toast.hiding"
             (click)="handleGlobalToastClick(toast)">
          <div class="toast-icon">
            <i [class]="getGlobalToastIcon(toast.type)"></i>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            <div class="toast-time">{{ toast.time }}</div>
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); removeGlobalToast(toast)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .main-content {
      flex: 1;
    }

    .main-content.with-navbar {
      padding-top: 60px;
    }

    /* Global Toast Notifications */
    .global-toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .global-toast {
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

    .global-toast::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #0a66c2, #00a0dc);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 5s linear;
    }

    .global-toast.show::before {
      transform: scaleX(1);
    }

    .global-toast.show {
      transform: translateX(0);
      opacity: 1;
    }

    .global-toast.hiding {
      transform: translateX(100%);
      opacity: 0;
    }

    .global-toast:hover {
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

    @media (max-width: 768px) {
      .main-content.with-navbar {
        padding-top: 56px;
      }

      .global-toast-container {
        bottom: 10px;
        right: 10px;
        max-width: 350px;
      }

      .global-toast {
        min-width: 280px;
        max-width: 350px;
      }
    }

    @media (max-width: 576px) {
      .global-toast-container {
        bottom: 5px;
        right: 5px;
        max-width: 320px;
      }

      .global-toast {
        min-width: 260px;
        max-width: 320px;
        padding: 12px;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'LinkedIn App';
  showNavbar = false;
  globalToasts: any[] = [];
  private subscriptions = new Subscription();
   showFooter = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    console.log('🔄 AppComponent initialized');

    // Listen to route changes to show/hide navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const hideNavbarRoutes = ['/login', '/register'];
      this.showNavbar = !hideNavbarRoutes.includes(event.url) && this.authService.isLoggedIn();
         this.showFooter = this.shouldShowFooter(event.url);
    });

    // Listen to authentication state changes
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        const currentRoute = this.router.url;
        const hideNavbarRoutes = ['/login', '/register'];
        this.showNavbar = !hideNavbarRoutes.includes(currentRoute) && !!user;
          this.showFooter = this.shouldShowFooter(currentRoute);
        
        this.handleAuthenticationChange(user);
      })
    );

    // Initialize real-time notifications
    this.initializeRealTimeNotifications();
  }

   private shouldShowFooter(url: string): boolean {
    // Show footer only on authenticated pages
    const authenticatedRoutes = [
      '/dashboard', 
      '/network', 
      '/notifications', 
      '/create-post', 
      '/edit-post',
      '/profile'
    ];
    
    const isAuthenticatedRoute = authenticatedRoutes.some(route => 
      url.startsWith(route)
    );
    
    return isAuthenticatedRoute && this.authService.isLoggedIn();
  }

  private async handleAuthenticationChange(user: any): Promise<void> {
    if (user) {
      console.log('👤 User logged in, starting SignalR connection...');
      try {
        await this.notificationService.initializeConnection();
        console.log('✅ SignalR connection started successfully');
      } catch (error) {
        console.error('❌ Failed to start SignalR connection:', error);
        // Retry after 3 seconds
        setTimeout(() => this.handleAuthenticationChange(user), 3000);
      }
    } else {
      console.log('👤 User logged out, stopping SignalR connection...');
      await this.notificationService.stopConnection();
    }
  }

  private initializeRealTimeNotifications(): void {
    console.log('🔔 Setting up global notification listeners');

    // Listen for real-time notifications - THIS SHOULD WORK FROM ANY PAGE
    this.subscriptions.add(
      this.notificationService.realTimeNotifications$.subscribe(notification => {
        console.log('🌍 GLOBAL NOTIFICATION RECEIVED IN APP COMPONENT:', notification);
        this.handleNewNotification(notification);
      })
    );

    // Listen for connection state changes
    this.subscriptions.add(
      this.notificationService.connectionState$.subscribe(connected => {
        console.log('🔌 Global Connection State:', connected ? 'Connected' : 'Disconnected');
      })
    );

    // Listen for unread count updates
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        console.log('🔢 Global Unread Count Update:', count);
      })
    );
  }

  private handleNewNotification(notification: any): void {
    console.log('🆕 Handling new notification globally:', notification);
    
    // Don't show notifications if we're on the notifications page
    const isOnNotificationsPage = this.router.url.includes('/notifications');
    
    if (isOnNotificationsPage) {
      console.log('📱 On notifications page - notification will be handled there');
      return;
    }

    // Show global toast notification
    this.showGlobalToast(notification);
    
    // Show browser notification
    this.showBrowserNotification(notification);
  }

  private showGlobalToast(notification: any): void {
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

    const toast = {
      id: Date.now(),
      type: toastType,
      title: notification.title,
      message: notification.message,
      time: this.getCurrentTime(),
      notification: notification,
      show: false,
      hiding: false
    };

    this.globalToasts.push(toast);
    
    // Trigger show animation
    setTimeout(() => {
      toast.show = true;
    }, 100);

    // Auto remove after 6 seconds
    setTimeout(() => {
      this.removeGlobalToast(toast);
    }, 6000);
  }

  private getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  removeGlobalToast(toast: any): void {
    if (toast.hiding) return;
    
    toast.hiding = true;
    setTimeout(() => {
      this.globalToasts = this.globalToasts.filter(t => t.id !== toast.id);
    }, 300);
  }

handleGlobalToastClick(toast: any): void {
  this.removeGlobalToast(toast);
  
  // ALWAYS navigate to notifications page when toast is clicked
  this.router.navigate(['/notifications']);
}

  private navigateBasedOnNotification(notification: any): void {
    switch (notification.type) {
      case 'connection_request':
        this.router.navigate(['/network']);
        break;
      case 'post_like':
      case 'comment':
        if (notification.relatedEntityId) {
          this.router.navigate(['/post', notification.relatedEntityId]);
        } else {
          this.router.navigate(['/notifications']);
        }
        break;
      default:
        this.router.navigate(['/notifications']);
        break;
    }
  }

  getGlobalToastIcon(type: string): string {
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

  // Show browser notification
  private showBrowserNotification(notification: any): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      this.createBrowserNotification(notification);
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createBrowserNotification(notification);
        }
      });
    }
  }

  private createBrowserNotification(notification: any): void {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/assets/images/logo.png',
      tag: 'linkedin-notification'
    });

    browserNotification.onclick = () => {
      window.focus();
      this.navigateBasedOnNotification(notification);
      browserNotification.close();
    };

    setTimeout(() => browserNotification.close(), 5000);
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up AppComponent subscriptions');
    this.subscriptions.unsubscribe();
    this.notificationService.stopConnection();
  }

  // Test method for notification flow
  async testNotificationFlow(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      // Test creating a notification via API
      const testNotification = {
        userId: userId,
        senderId: userId,
        title: 'Test Notification',
        message: 'This is a test notification from the global handler!',
        type: 'test',
        relatedEntityId: 0
      };

      this.notificationService.createNotification(testNotification).subscribe({
        next: (response) => {
          console.log('✅ Test notification created:', response);
        },
        error: (error) => {
          console.error('❌ Failed to create test notification:', error);
        }
      });
    }
  }
}
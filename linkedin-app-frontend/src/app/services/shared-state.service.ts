import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service'; // ADD THIS

@Injectable({
  providedIn: 'root'
})
export class SharedStateService {
  // BehaviorSubject to hold the current pending count
  private pendingCountSubject = new BehaviorSubject<number>(0);
  
  // Observable that components can subscribe to
  public pendingCount$ = this.pendingCountSubject.asObservable();

  // BehaviorSubject to hold the current notification count
  private notificationCountSubject = new BehaviorSubject<number>(0);
  
  // Observable that components can subscribe to
  public notificationCount$ = this.notificationCountSubject.asObservable();

  // SignalR connection state
  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  public connectionState$ = this.connectionStateSubject.asObservable();

  // Debug mode to track updates
  private debug = true;

  constructor(private notificationService: NotificationService) { // ADD THIS
    // Subscribe to real-time unread count from SignalR
    this.setupSignalRIntegration();
  }

  //  THIS NEW METHOD: Setup SignalR integration
  private setupSignalRIntegration(): void {
    // Listen for real-time unread count updates from SignalR
    this.notificationService.unreadCount$.subscribe(count => {
      if (this.debug) {
        // console.log('SharedStateService: Real-time unread count update from SignalR:', count);
      }
      this.notificationCountSubject.next(count);
    });

    // Listen for connection state changes from SignalR
    this.notificationService.connectionState$.subscribe(connected => {
      if (this.debug) {
        // console.log('SharedStateService: SignalR connection state:', connected ? 'Connected' : 'Disconnected');
      }
      this.connectionStateSubject.next(connected);
    });

    // Listen for new real-time notifications
    this.notificationService.realTimeNotifications$.subscribe(notification => {
      if (this.debug) {
        // console.log('SharedStateService: New real-time notification received:', notification);
      }
      // Auto-increment notification count for new unread notifications
      if (!notification.isRead) {
        this.incrementNotificationCount();
      }
    });
  }

  // KEEP ALL YOUR EXISTING METHODS EXACTLY AS THEY ARE:

  // Method to update the pending count
  updatePendingCount(count: number): void {
    if (this.debug) {
      // console.log('SharedStateService: Updating pending count from', this.pendingCountSubject.value, 'to', count);
    }
    this.pendingCountSubject.next(count);
  }

  // Method to update the notification count
  updateNotificationCount(count: number): void {
    if (this.debug) {
      // console.log('SharedStateService: Updating notification count from', this.notificationCountSubject.value, 'to', count);
    }
    this.notificationCountSubject.next(count);
  }

  // Method to get current pending count value
  getCurrentPendingCount(): number {
    return this.pendingCountSubject.value;
  }

  // Method to get current notification count value
  getCurrentNotificationCount(): number {
    return this.notificationCountSubject.value;
  }

  // Method to increment notification count (when new notification arrives)
  incrementNotificationCount(): void {
    const currentCount = this.notificationCountSubject.value;
    const newCount = currentCount + 1;
    if (this.debug) {
      // console.log('SharedStateService: Incrementing notification count from', currentCount, 'to', newCount);
    }
    this.notificationCountSubject.next(newCount);
  }

  // Method to decrement notification count (when notification is read)
  decrementNotificationCount(): void {
    const currentCount = this.notificationCountSubject.value;
    if (currentCount > 0) {
      const newCount = currentCount - 1;
      if (this.debug) {
        // console.log('SharedStateService: Decrementing notification count from', currentCount, 'to', newCount);
      }
      this.notificationCountSubject.next(newCount);
    }
  }

  // Method to reset notification count (when all are marked as read)
  resetNotificationCount(): void {
    if (this.debug) {
      // console.log('SharedStateService: Resetting notification count to 0');
    }
    this.notificationCountSubject.next(0);
  }

  // Method to increment pending count
  incrementPendingCount(): void {
    const currentCount = this.pendingCountSubject.value;
    const newCount = currentCount + 1;
    if (this.debug) {
      // console.log('SharedStateService: Incrementing pending count from', currentCount, 'to', newCount);
    }
    this.pendingCountSubject.next(newCount);
  }

  // Method to decrement pending count
  decrementPendingCount(): void {
    const currentCount = this.pendingCountSubject.value;
    if (currentCount > 0) {
      const newCount = currentCount - 1;
      if (this.debug) {
        // console.log('SharedStateService: Decrementing pending count from', currentCount, 'to', newCount);
      }
      this.pendingCountSubject.next(newCount);
    }
  }

  // Method to reset pending count
  resetPendingCount(): void {
    if (this.debug) {
      // console.log('SharedStateService: Resetting pending count to 0');
    }
    this.pendingCountSubject.next(0);
  }

  // Method to get connection state
  getConnectionState(): boolean {
    return this.connectionStateSubject.value;
  }

  // Method to get current state (for debugging)
  getCurrentState(): { pendingCount: number, notificationCount: number, connectionState: boolean } { 
    return {
      pendingCount: this.pendingCountSubject.value,
      notificationCount: this.notificationCountSubject.value,
      connectionState: this.connectionStateSubject.value 
    };
  }

  // Method to toggle debug mode
  setDebugMode(enabled: boolean): void {
    this.debug = enabled;
  }
}

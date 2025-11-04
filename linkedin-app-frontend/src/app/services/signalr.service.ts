import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { Notification } from '../models/notification';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection;
  private connectionUrl = 'https://localhost:7068/notificationHub'; 
  
  // Observable for real-time notifications
  private notificationReceived = new Subject<Notification>();
  public notificationReceived$ = this.notificationReceived.asObservable();
  
  // Observable for unread count updates
  private unreadCountUpdated = new BehaviorSubject<number>(0);
  public unreadCountUpdated$ = this.unreadCountUpdated.asObservable();
  
  // Connection state
  private connectionState = new BehaviorSubject<boolean>(false);
  public connectionState$ = this.connectionState.asObservable();

  constructor(private authService: AuthService) {
    this.hubConnection = this.createHubConnection();
  }

  private createHubConnection(): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(this.connectionUrl, {
        withCredentials: true // Important for CORS with credentials
        // Remove accessTokenFactory since you're not using JWT
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Custom retry logic
          if (retryContext.previousRetryCount < 10) {
            return 2000; // 2 seconds
          } else {
            return 5000; // 5 seconds
          }
        }
      })
      .configureLogging(LogLevel.Information)
      .build();
  }

  // Start the connection
  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      await this.hubConnection.start();
      // console.log('SignalR connection started');
      this.connectionState.next(true);
      
      // Join notification group for current user
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        await this.joinNotificationGroup(currentUserId);
      }
      
      this.registerSignalREvents();
      
    } catch (error) {
      // console.error('Error starting SignalR connection:', error);
      this.connectionState.next(false);
      
      // Retry after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  // Stop the connection
  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state === HubConnectionState.Connected) {
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        await this.leaveNotificationGroup(currentUserId);
      }
      
      await this.hubConnection.stop();
      this.connectionState.next(false);
      // console.log('SignalR connection stopped');
    }
  }

  // Join user-specific notification group
  private async joinNotificationGroup(userId: number): Promise<void> {
    try {
      await this.hubConnection.invoke('JoinNotificationGroup', userId);
      // console.log(`Joined notification group for user ${userId}`);
    } catch (error) {
      // console.error('Error joining notification group:', error);
    }
  }

  // Leave user-specific notification group
  private async leaveNotificationGroup(userId: number): Promise<void> {
    try {
      await this.hubConnection.invoke('LeaveNotificationGroup', userId);
      // console.log(`Left notification group for user ${userId}`);
    } catch (error) {
      // console.error('Error leaving notification group:', error);
    }
  }

  // Register SignalR event handlers
  private registerSignalREvents(): void {
    // Listen for new notifications
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      // console.log('New notification received:', notification);
      this.notificationReceived.next(notification);
      
      // Show toast notification (you can implement this)
      this.showToastNotification(notification);
    });

    // Listen for unread count updates
    this.hubConnection.on('UpdateUnreadCount', (count: number) => {
      // console.log('Unread count updated:', count);
      this.unreadCountUpdated.next(count);
    });

    // Connection events
    this.hubConnection.onreconnecting((error) => {
      // console.log('SignalR reconnecting...', error);
      this.connectionState.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      // console.log('SignalR reconnected. Connection ID:', connectionId);
      this.connectionState.next(true);
      
      // Rejoin notification group after reconnection
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        this.joinNotificationGroup(currentUserId);
      }
    });

    this.hubConnection.onclose((error) => {
      // console.log('SignalR connection closed', error);    
      this.connectionState.next(false);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    });
  }

  // Show toast notification (you can customize this)
  private showToastNotification(notification: Notification): void {
    // You can integrate with a toast service here
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/logo.png' // Your app logo
      });
    }
    
    // Or use console for now
    // console.log(`🔔 ${notification.title}: ${notification.message}`);
  }

  // Get current connection state
  public getConnectionState(): HubConnectionState {
    return this.hubConnection.state;
  }

  // Check if connected
  public isConnected(): boolean {
    return this.hubConnection.state === HubConnectionState.Connected;
  }
}


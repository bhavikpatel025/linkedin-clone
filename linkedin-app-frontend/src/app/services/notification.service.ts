import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  Notification, 
  NotificationResponse, 
  UnreadCountResponse, 
  MarkAsReadResponse,
  CreateNotification,
   DeleteNotificationResponse,
   DeleteAllNotificationsResponse 
} from '../models/notification';
import { SignalrService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private apiUrl = 'https://localhost:7068/api/notifications';

  // Add local BehaviorSubject to track unread count
  private currentUnreadCount = new BehaviorSubject<number>(0);
  public currentUnreadCount$ = this.currentUnreadCount.asObservable();

  // Real-time notifications from SignalR
  public realTimeNotifications$ = this.signalrService.notificationReceived$;
  public unreadCount$ = this.signalrService.unreadCountUpdated$;
  public connectionState$ = this.signalrService.connectionState$;

  constructor(
    private http: HttpClient,
    private signalrService: SignalrService
  ) { 
    // Subscribe to SignalR unread count updates
    this.unreadCount$.subscribe(count => {
      this.currentUnreadCount.next(count);
    });
  }

  // Make this async and return promise
  async initializeConnection(): Promise<void> {
    await this.signalrService.startConnection();
  }

  // Make this async and return promise
  async stopConnection(): Promise<void> {
    await this.signalrService.stopConnection();
  }

  // Check if connected to SignalR
  isConnected(): boolean {
    return this.signalrService.isConnected();
  }

  dismissNotification(notificationId: number, currentUserId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}?userId=${currentUserId}`);
  }

  deleteNotification(notificationId: number, currentUserId: number): Observable<DeleteNotificationResponse> {
    return this.http.delete<DeleteNotificationResponse>(
      `${this.apiUrl}/${notificationId}?userId=${currentUserId}`
    );
  }
    deleteAllNotifications(userId: number): Observable<DeleteAllNotificationsResponse> {
    return this.http.delete<DeleteAllNotificationsResponse>(
      `${this.apiUrl}/user/${userId}/all`
    );
  }

  markAsRead(notificationId: number, userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read?userId=${userId}`, {});
  }

  markAllAsRead(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all?userId=${userId}`, {});
  }

  getUnreadCount(userId: number): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count/${userId}`);
  }

  createNotification(notificationData: CreateNotification): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.apiUrl, notificationData);
  }

  getSentNotifications(senderId: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}/sent-by/${senderId}`);
  }

  getNotificationsWithSenders(userId: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}/user/${userId}/with-senders`);
  }
   getUserNotifications(userId: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}/user/${userId}`);
  }

  // Get current unread count from BehaviorSubject
  getCurrentUnreadCount(): number {
    return this.currentUnreadCount.value;
  }

  // Method to manually update unread count (useful for initial load)
  updateUnreadCount(count: number): void {
    this.currentUnreadCount.next(count);
  }
}
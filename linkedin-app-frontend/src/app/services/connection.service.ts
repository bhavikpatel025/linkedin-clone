import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; // REMOVE tap
import { NotificationService } from './notification.service'; 
import { 
  ApiResponse, 
  Connection, 
  ConnectionRequest, 
  ConnectionResponse, 
  UserConnection 
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private baseUrl = 'https://localhost:7068/api'; 

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Get user's accepted connections
  getUserConnections(userId: number): Observable<ApiResponse<UserConnection[]>> {
    return this.http.get<ApiResponse<UserConnection[]>>(`${this.baseUrl}/connections/user/${userId}`);
  }

  // Get pending connection requests for user
  getPendingConnections(userId: number): Observable<ApiResponse<UserConnection[]>> {
    return this.http.get<ApiResponse<UserConnection[]>>(`${this.baseUrl}/connections/pending/${userId}`);
  }

  // Get connection suggestions for user
  getConnectionSuggestions(userId: number): Observable<ApiResponse<UserConnection[]>> {
    return this.http.get<ApiResponse<UserConnection[]>>(`${this.baseUrl}/connections/suggestions/${userId}`);
  }

  // Send connection request - FIXED
  sendConnectionRequest(request: ConnectionRequest): Observable<ApiResponse<Connection>> {
    return this.http.post<ApiResponse<Connection>>(`${this.baseUrl}/connections/send-request`, request);
    // 🚫 REMOVED: tap operator and notification refresh
    // SignalR will handle notifications automatically
  }

  // Respond to connection request (accept/reject) - FIXED
  respondToConnectionRequest(response: ConnectionResponse): Observable<ApiResponse<Connection>> {
    return this.http.post<ApiResponse<Connection>>(`${this.baseUrl}/connections/respond-request`, response);
    // 🚫 REMOVED: tap operator and notification refresh
    // SignalR will handle notifications automatically
  }

  // Remove connection - FIXED
  removeConnection(connectionId: number, userId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/connections/${connectionId}?userId=${userId}`);
    // 🚫 REMOVED: tap operator and notification refresh
    // SignalR will handle notifications automatically
  }

  // Get connection count for user
  getConnectionCount(userId: number): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.baseUrl}/connections/count/${userId}`);
  }

  // Check connection status between two users
  checkConnectionStatus(user1Id: number, user2Id: number): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/connections/check-status?user1Id=${user1Id}&user2Id=${user2Id}`);
  }

  // 🚫 REMOVE THESE PRIVATE METHODS - No longer needed
  // private refreshNotificationCount() and private refreshNotificationCountForConnection()
}
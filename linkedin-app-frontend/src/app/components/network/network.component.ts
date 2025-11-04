import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConnectionService } from '../../services/connection.service';
import { AuthService } from '../../services/auth.service';
import { SharedStateService } from '../../services/shared-state.service';
import { NotificationService } from '../../services/notification.service';
import { UserConnection, ConnectionResponse } from '../../models/models';
import { CreateNotification } from '../../models/notification';
import { Subscription } from 'rxjs'; 
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="network-container">
      <div class="container-fluid">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <!-- ADD: Real-time Status Indicator -->
            <!-- <div class="real-time-status mb-3" *ngIf="showConnectionStatus">
              <div class="alert alert-info d-flex align-items-center py-2" role="alert">
                <i class="bi bi-wifi me-2"></i>
                <small>Real-time updates: {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}</small>
              </div>
            </div> -->

            <!-- Connection Stats -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <h5 class="card-title fw-bold mb-3">My Network</h5>
                <div class="row text-center">
                  <div class="col-4">
                    <div class="fw-bold text-primary fs-4">
                      {{ connectionCount }}
                    </div>
                    <small class="text-muted">Connections</small>
                  </div>
                  <div class="col-4">
                    <div class="fw-bold text-primary fs-4">
                      {{ pendingCount }}
                    </div>
                    <small class="text-muted">Pending</small>
                  </div>
                  <div class="col-4">
                    <div class="fw-bold text-primary fs-4">
                      {{ suggestions.length }}
                    </div>
                    <small class="text-muted">Suggestions</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pending Connections -->
            <div
              *ngIf="pendingConnections.length > 0"
              class="card border-0 shadow-sm mb-4"
            >
              <div class="card-header bg-transparent border-0">
                <h6 class="fw-bold mb-0">Pending Connection Requests</h6>
                <!-- ADD: Real-time indicator for new pending requests -->
                <small class="text-muted" *ngIf="hasNewPendingRequests">
                  <i class="bi bi-star-fill text-warning me-1"></i>
                  New requests available
                </small>
              </div>
              <div class="card-body">
                <div class="row">
                  <div
                    class="col-md-6 mb-3"
                    *ngFor="let connection of pendingConnections"
                  >
                    <div
                      class="d-flex align-items-center justify-content-between p-3 border rounded"
                      [class.new-request]="isNewPendingRequest(connection)"
                    >
                      <div class="d-flex align-items-center">
                       <div class="user-avatar me-3">
  @if (connection.profilePicture) {
    <img [src]="getProfilePictureUrl(connection.profilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle fs-2 text-muted"></i>
  }
</div>
                        <div>
                          <h6 class="mb-1 fw-bold">{{ connection.name }}</h6>
                          <small class="text-muted">{{
                            connection.roleName
                          }}</small>
                          <div *ngIf="connection.headline" class="mt-1">
                            <small class="text-muted">{{
                              connection.headline
                            }}</small>
                          </div>
                          <div
                            *ngIf="connection.mutualConnections > 0"
                            class="mt-1"
                          >
                            <small class="text-primary">
                              {{ connection.mutualConnections }} mutual
                              connection(s)
                            </small>
                          </div>
                          <!-- ADD: New request badge -->
                          <div *ngIf="isNewPendingRequest(connection)" class="mt-1">
                            <span class="badge bg-warning text-dark">New</span>
                          </div>
                        </div>
                      </div>
                      <div class="d-flex gap-2">
                        <button
                          class="btn btn-success btn-sm"
                          (click)="acceptConnection(connection)"
                        >
                          Accept
                        </button>
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          (click)="rejectConnection(connection)"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Connection Suggestions -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-transparent border-0">
                <h6 class="fw-bold mb-0">People you may know</h6>
                <small class="text-muted"
                  >Based on your profile and network</small
                >
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3" *ngFor="let user of suggestions">
                    <div
                      class="d-flex align-items-center justify-content-between p-3 border rounded"
                    >
                      <div class="d-flex align-items-center">                        
  <div class="user-avatar me-3">
  @if (user.profilePicture) {
    <img [src]="getProfilePictureUrl(user.profilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle fs-2 text-muted"></i>
  }
</div>
                        <div>
                          <h6 class="mb-1 fw-bold">{{ user.name }}</h6>
                          <small class="text-muted">{{ user.roleName }}</small>
                          <div *ngIf="user.headline" class="mt-1">
                            <small class="text-muted">{{
                              user.headline
                            }}</small>
                          </div>
                          <div *ngIf="user.mutualConnections > 0" class="mt-1">
                            <small class="text-primary">
                              {{ user.mutualConnections }} mutual connection(s)
                            </small>
                          </div>
                        </div>
                      </div>
                      <button
                        class="btn btn-primary btn-sm"
                        (click)="sendConnectionRequest(user)"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
                <div *ngIf="suggestions.length === 0" class="text-center py-4">
                  <i class="bi bi-people display-4 text-muted mb-3"></i>
                  <h6 class="text-muted">No suggestions available</h6>
                  <p class="text-muted small">
                    We'll suggest people as your network grows
                  </p>
                </div>
              </div>
            </div>

            <!-- My Connections -->
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-transparent border-0">
                <h6 class="fw-bold mb-0">
                  My Connections ({{ connections.length }})
                </h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div
                    class="col-md-6 mb-3"
                    *ngFor="let connection of connections"
                  >
                    <div
                      class="d-flex align-items-center justify-content-between p-3 border rounded"
                    >
                      <div class="d-flex align-items-center">
                       <div class="user-avatar me-3">
  @if (connection.profilePicture) {
    <img [src]="getProfilePictureUrl(connection.profilePicture)" alt="Profile" class="avatar-image">
  } @else {
    <i class="bi bi-person-circle fs-2 text-muted"></i>
  }
</div>
                        <div>
                          <h6 class="mb-1 fw-bold">{{ connection.name }}</h6>
                          <small class="text-muted">{{
                            connection.roleName
                          }}</small>
                          <div *ngIf="connection.headline" class="mt-1">
                            <small class="text-muted">{{
                              connection.headline
                            }}</small>
                          </div>
                          <div class="mt-1">
                            <small class="text-muted">
                              Connected
                              {{ formatDate(connection.connectionDate) }}
                            </small>
                          </div>
                          <div
                            *ngIf="connection.mutualConnections > 0"
                            class="mt-1"
                          >
                            <small class="text-primary">
                              {{ connection.mutualConnections }} mutual
                              connection(s)
                            </small>
                          </div>
                        </div>
                      </div>
                      <button
                        class="btn btn-outline-danger btn-sm"
                        (click)="removeConnection(connection)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div *ngIf="connections.length === 0" class="text-center py-4">
                  <i class="bi bi-people display-4 text-muted mb-3"></i>
                  <h6 class="text-muted">No connections yet</h6>
                  <p class="text-muted small">
                    Start building your network by connecting with others
                  </p>
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
      .network-container {
        min-height: 100vh;
        background-color: #f3f2ef;
        padding: 20px 0 20px 0;
      }

      .user-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #eef3f8;
         overflow: hidden;
      }
      .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

      .card {
        border-radius: 8px;
        border: 1px solid #e0e0e0;
      }

      /* ADD: Real-time status styles */
      .real-time-status .alert {
        border-radius: 8px;
        margin-bottom: 0;
      }

      /* ADD: New request highlighting */
      .new-request {
        border-left: 4px solid #28a745 !important;
        background-color: rgba(40, 167, 69, 0.05);
        animation: pulse-highlight 2s ease-in-out;
      }

      @keyframes pulse-highlight {
        0% { background-color: rgba(40, 167, 69, 0.05); }
        50% { background-color: rgba(40, 167, 69, 0.1); }
        100% { background-color: rgba(40, 167, 69, 0.05); }
      }

      @media (max-width: 768px) {
        .network-container {
          padding: 70px 10px 10px 10px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
        }
      }

      .network-badge-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }

      .network-badge-container .btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
      }

      .network-badge-container .badge {
        font-size: 0.7rem;
        padding: 0.25em 0.4em;
      }

      /* Animation for new requests */
      @keyframes pulse {
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

      .network-badge-container .btn.has-pending {
        animation: pulse 2s infinite;
      }

      @media (max-width: 768px) {
        .network-badge-container {
          bottom: 80px;
          right: 15px;
        }

        .network-badge-container .btn {
          width: 50px;
          height: 50px;
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class NetworkComponent implements OnInit, OnDestroy { // ADD OnDestroy
  connections: UserConnection[] = [];
  pendingConnections: UserConnection[] = [];
  suggestions: UserConnection[] = [];
  connectionCount: number = 0;
  pendingCount: number = 0;
  currentUserId: number;
  hasPendingRequests: boolean = false;
   profilePictureUrl: string = '';

  // ADD: SignalR properties
  private subscriptions = new Subscription();
  isConnected: boolean = false;
  showConnectionStatus: boolean = true;
  hasNewPendingRequests: boolean = false;
  newPendingRequestIds: Set<number> = new Set();

  constructor(
    private connectionService: ConnectionService,
    private authService: AuthService,
    private sharedStateService: SharedStateService,
    private notificationService: NotificationService,
     private apiService: ApiService 
  ) {
    this.currentUserId = this.authService.getCurrentUserId() ?? 0;
  }

  ngOnInit() {
    this.loadNetworkData();
    this.setupRealTimeListeners();
     this.loadCurrentUserProfilePicture();
  }

  // ADD: Clean up subscriptions
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // ADD THIS NEW METHOD: Setup real-time listeners
  private setupRealTimeListeners(): void {
    // Listen for connection state
    this.subscriptions.add(
      this.notificationService.connectionState$.subscribe(connected => {
        this.isConnected = connected;
        console.log('Network Component - SignalR connection:', connected ? 'Connected' : 'Disconnected');
      })
    );

    // Listen for real-time notifications (for new connection requests)
    this.subscriptions.add(
      this.notificationService.realTimeNotifications$.subscribe(notification => {
        if (notification.type === 'connection_request' || notification.type === 'connection_accepted') {
          this.handleRealTimeConnectionNotification(notification);
        }
      })
    );
  }

  // ADD THIS NEW METHOD: Handle real-time connection notifications
  private handleRealTimeConnectionNotification(notification: any): void {
    console.log('Real-time connection notification:', notification);
    
    if (notification.type === 'connection_request') {
      // New connection request received - refresh pending connections
      this.loadPendingConnections();
      this.hasNewPendingRequests = true;
      
      // Show notification
      Swal.fire({
        icon: 'info',
        title: 'New Connection Request',
        text: `You have a new connection request from ${notification.senderName}`,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end'
      });
    } else if (notification.type === 'connection_accepted') {
      // Connection request accepted - refresh connections
      this.loadConnections();
      this.loadConnectionCount();
      
      Swal.fire({
        icon: 'success',
        title: 'Connection Accepted',
        text: `${notification.senderName} accepted your connection request`,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end'
      });
    }
  }

  // ADD THIS NEW METHOD: Check if pending request is new
  isNewPendingRequest(connection: UserConnection): boolean {
    return this.newPendingRequestIds.has(connection.id);
  }

  // KEEP ALL YOUR EXISTING METHODS EXACTLY THE SAME:

  loadNetworkData() {
    this.loadConnections();
    this.loadPendingConnections();
    this.loadConnectionSuggestions();
    this.loadConnectionCount();
  }

  loadConnections() {
    this.connectionService.getUserConnections(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.connections = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.connections = [];
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load connections',
        });
      },
    });
  }

  loadPendingConnections() {
    this.connectionService.getPendingConnections(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingConnections = response.data || [];
          this.pendingCount = this.pendingConnections.length;
          this.hasPendingRequests = this.pendingCount > 0;
          this.sharedStateService.updatePendingCount(this.pendingCount);
          
          // ADD: Track new pending requests for highlighting
          this.pendingConnections.forEach(connection => {
            this.newPendingRequestIds.add(connection.id);
          });
        }
      },
      error: (error) => {
        console.error('Error loading pending connections:', error);
        this.pendingConnections = [];
        this.pendingCount = 0;
        this.hasPendingRequests = false;
        this.sharedStateService.updatePendingCount(0);
      },
    });
  }

  loadConnectionSuggestions() {
    this.connectionService
      .getConnectionSuggestions(this.currentUserId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.suggestions = response.data || [];
          }
        },
        error: (error) => {
          console.error('Error loading suggestions:', error);
          this.suggestions = [];
        },
      });
  }

  loadConnectionCount() {
    this.connectionService.getConnectionCount(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.connectionCount = response.data ?? 0;
        }
      },
      error: (error) => {
        console.error('Error loading connection count:', error);
      },
    });
  }

  sendConnectionRequest(user: any) {
    const userId = user.id;

    if (!userId) {
      console.error('Invalid user object:', user);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid user data',
      });
      return;
    }

    const request = {
      senderId: this.currentUserId,
      receiverId: userId,
    };

    this.connectionService.sendConnectionRequest(request).subscribe({
      next: (response) => {
        if (response.success) {
          if (user.connectionId) {
            this.suggestions = this.suggestions.filter((u) => u.id !== user.id);
          }

          // this.refreshNotificationCount();

          Swal.fire({
            icon: 'success',
            title: 'Request Sent',
            text: 'Connection request sent successfully',
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

  acceptConnection(connection: UserConnection) {
    const response: ConnectionResponse = {
      connectionId: connection.connectionId,
      status: 'accepted',
    };

    this.connectionService.respondToConnectionRequest(response).subscribe({
      next: (apiResponse) => {
        if (apiResponse.success) {
          this.pendingConnections = this.pendingConnections.filter(
            (c) => c.id !== connection.id
          );
          this.connectionCount++;
          this.pendingCount--;
          this.hasPendingRequests = this.pendingCount > 0;
          this.sharedStateService.updatePendingCount(this.pendingCount);
          this.loadConnections();

          // this.refreshNotificationCount();

          Swal.fire({
            icon: 'success',
            title: 'Connected!',
            text: 'You are now connected',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: apiResponse.message || 'Failed to accept connection',
          });
        }
      },
      error: (error) => {
        console.error('Error accepting connection:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to accept connection',
        });
      },
    });
  }

  rejectConnection(connection: UserConnection) {
    const response: ConnectionResponse = {
      connectionId: connection.connectionId,
      status: 'rejected',
    };

    this.connectionService.respondToConnectionRequest(response).subscribe({
      next: (apiResponse) => {
        if (apiResponse.success) {
          this.pendingConnections = this.pendingConnections.filter(
            (c) => c.id !== connection.id
          );
          this.pendingCount--;
          this.hasPendingRequests = this.pendingCount > 0;
          this.sharedStateService.updatePendingCount(this.pendingCount);
          this.addUserToSuggestions(connection);

          // this.refreshNotificationCount();

          Swal.fire({
            icon: 'info',
            title: 'Request Ignored',
            text: 'Connection request ignored',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: apiResponse.message || 'Failed to ignore connection request',
          });
        }
      },
      error: (error) => {
        console.error('Error rejecting connection:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to ignore connection request',
        });
      },
    });
  }

  removeConnection(connection: UserConnection) {
    Swal.fire({
      title: 'Remove Connection?',
      text: `Are you sure you want to remove ${connection.name} from your connections?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.connectionService
          .removeConnection(connection.connectionId, this.currentUserId)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.connections = this.connections.filter(
                  (c) => c.connectionId !== connection.connectionId
                );
                this.connectionCount--;
                this.loadConnectionSuggestions();

                // this.refreshNotificationCount();

                Swal.fire({
                  icon: 'success',
                  title: 'Removed!',
                  text: 'Connection removed successfully',
                  timer: 1500,
                  showConfirmButton: false,
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: response.message || 'Failed to remove connection',
                });
              }
            },
            error: (error) => {
              console.error('Error removing connection:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove connection',
              });
            },
          });
      }
    });
  }

  // private refreshNotificationCount(): void {
  //   if (!this.currentUserId) return;

  //   this.notificationService.getUnreadCount(this.currentUserId).subscribe({
  //     next: (response) => {
  //       if (response.success) {
  //         this.sharedStateService.updateNotificationCount(response.data);
  //         console.log(
  //           'Notification count refreshed after connection request:',
  //           response.data
  //         );
  //       } else {
  //         console.error(
  //           'Failed to refresh notification count:',
  //           response.message
  //         );
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error refreshing notification count:', error);
  //     },
  //   });
  // }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString();
  }

  private getCurrentUserName(): string {
    const userName = this.authService.getCurrentUserName();
    console.log('Current user name:', userName);
    return userName;
  }

  private addUserToSuggestions(user: UserConnection): void {
    const existingUser = this.suggestions.find((u) => u.id === user.id);

    if (!existingUser) {
      const suggestion: UserConnection = {
        id: user.id,
        name: user.name,
        roleName: user.roleName,
        headline: user.headline,
        mutualConnections: user.mutualConnections,
        connectionId: 0,
        connectionDate: '',
         profilePicture: user.profilePicture
      };

      this.suggestions.unshift(suggestion);
    }
  }
  // ✅ ADD THIS METHOD (Same pattern as other components)
loadCurrentUserProfilePicture(): void {
  if (this.currentUserId) {
    this.apiService.getUserById(this.currentUserId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.profilePictureUrl = response.data.profilePicture 
            ? this.apiService.getImageUrl(response.data.profilePicture)
            : '';
          console.log('Current user profile picture loaded:', this.profilePictureUrl);
        }
      },
      error: (error) => {
        console.error('Error loading user profile picture:', error);
      }
    });
  }
}
// ✅ ADD THIS METHOD (Uses your existing ApiService method)
getProfilePictureUrl(profilePicturePath: string | undefined): string {
  if (!profilePicturePath) {
    return '';
  }
  return this.apiService.getImageUrl(profilePicturePath);
}
}

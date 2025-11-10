import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConnectionService } from '../../services/connection.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { SignalrChatService } from '../../services/signalr-chat.service';
import { UserConnection, CreateChat } from '../../models/models';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="new-chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-content">
          <button class="btn-back" routerLink="/chat">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="header-text">
            <h1 class="header-title">New Message</h1>
            <p class="header-subtitle">Select connections to start a conversation</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" (click)="refreshConnections()" [disabled]="loading">
              <i class="bi bi-arrow-clockwise" [class.spinning]="loading"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Search Section -->
        <div class="search-section">
          <div class="search-container">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="search-input"
              placeholder="Search connections by name or role..."
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              #searchInput
            />
            <button *ngIf="searchQuery" class="btn-clear" (click)="clearSearch()">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <!-- Selected Participants -->
        <div class="selected-section" *ngIf="selectedParticipants.length > 0">
          <div class="selected-header">
            <span class="selected-label">To:</span>
            <span class="selected-count">{{ selectedParticipants.length }} selected</span>
          </div>
          <div class="selected-participants">
            <div
              *ngFor="let participant of selectedParticipants"
              class="selected-participant"
            >
              <div class="participant-avatar">
                @if (participant.profilePicture) {
                  <img
                    [src]="getProfilePictureUrl(participant.profilePicture)"
                    [alt]="participant.name"
                    class="avatar-image"
                    (error)="handleImageError($event)"
                  />
                } @else {
                  <div class="avatar-fallback">
                    {{ getInitials(participant.name) }}
                  </div>
                }
              </div>
              <span class="participant-name">{{ getShortName(participant.name) }}</span>
              <button
                class="btn-remove"
                (click)="removeParticipant(participant)"
                (keydown.enter)="removeParticipant(participant)"
                aria-label="Remove participant"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Connections Section -->
        <div class="connections-section">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">Your Connections</h2>
              <span class="connections-count">{{ filteredConnections.length }} connections</span>
            </div>
            <div class="section-actions">
              <button 
                class="btn-select-all" 
                (click)="toggleSelectAll()"
                *ngIf="filteredConnections.length > 0"
              >
                {{ isAllSelected() ? 'Deselect All' : 'Select All' }}
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="loading" class="loading-state">
            <div class="spinner"></div>
            <div class="loading-text">
              <p>Loading your connections</p>
              <small>Finding people you're connected with...</small>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading && filteredConnections.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="bi bi-people"></i>
            </div>
            <div class="empty-content">
              <h3>{{ searchQuery ? 'No matches found' : 'No connections yet' }}</h3>
              <p>
                {{ searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Connect with people to start chatting' 
                }}
              </p>
              <button *ngIf="!searchQuery" class="btn-primary" routerLink="/network">
                <i class="bi bi-person-plus"></i>
                Find Connections
              </button>
              <button *ngIf="searchQuery" class="btn-outline" (click)="clearSearch()">
                Clear Search
              </button>
            </div>
          </div>

          <!-- Connections List -->
          <div *ngIf="!loading && filteredConnections.length > 0" class="connections-list">
            <div
              *ngFor="let connection of filteredConnections"
              class="connection-item"
              [class.selected]="isSelected(connection)"
              [class.online]="isOnline(connection)"
              (click)="toggleParticipant(connection)"
              (keydown.enter)="toggleParticipant(connection)"
              (keydown.space)="toggleParticipant(connection); $event.preventDefault()"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Select ' + connection.name + ' for chat'"
            >
              <div class="connection-avatar" [class.online]="isOnline(connection)">
                @if (connection.profilePicture) {
                  <img
                    [src]="getProfilePictureUrl(connection.profilePicture)"
                    [alt]="connection.name"
                    class="avatar-image"
                    (error)="handleImageError($event)"
                  />
                } @else {
                  <div class="avatar-fallback">
                    {{ getInitials(connection.name) }}
                  </div>
                }
                <div class="online-indicator" *ngIf="isOnline(connection)"></div>
              </div>

              <div class="connection-info">
                <div class="connection-main">
                  <h3 class="connection-name">{{ connection.name }}</h3>
                  <span class="connection-role">{{ connection.roleName }}</span>
                </div>
                <div class="connection-meta">
                  <div *ngIf="connection.mutualConnections > 0" class="mutual-connections">
                    <i class="bi bi-people"></i>
                    <span>{{ connection.mutualConnections }} mutual</span>
                  </div>
                  <div *ngIf="isOnline(connection)" class="online-status">
                    <i class="bi bi-dot"></i>
                    <span>Online</span>
                  </div>
                </div>
              </div>

              <div class="selection-indicator">
                <div class="checkbox" [class.checked]="isSelected(connection)">
                  <i class="bi bi-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Section -->
      <div class="action-section" *ngIf="selectedParticipants.length > 0">
        <div class="action-content">
          <div class="selected-summary">
            <span class="selected-total">{{ selectedParticipants.length }} selected</span>
            <button class="btn-clear-all" (click)="clearSelection()">Clear all</button>
          </div>
          <button
            class="btn-start-chat"
            (click)="startChat()"
            [disabled]="startingChat || selectedParticipants.length === 0"
            [class.loading]="startingChat"
          >
            <span class="btn-content">
              <i class="bi" [class.bi-chat]="!startingChat" [class.bi-arrow-repeat]="startingChat"></i>
              {{ getStartButtonText() }}
            </span>
            <span class="btn-loader" *ngIf="startingChat">
              <div class="spinner-small"></div>
            </span>
          </button>
        </div>
      </div>

      <!-- Connection Status -->
      <div class="connection-status" [class.connected]="isConnected">
        <div class="status-indicator"></div>
        <span class="status-text">
          {{ isConnected ? 'Connected' : 'Connecting...' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .new-chat-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
    }

    .chat-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .btn-back {
      background: rgba(0, 0, 0, 0.05);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-back:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateX(-2px);
    }

    .header-text {
      flex: 1;
      text-align: center;
    }

    .header-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      font-size: 0.9rem;
      color: #666;
    }

    .btn-icon {
      background: transparent;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-icon:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.05);
      color: #1a1a1a;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    .main-content {
      flex: 1;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      width: 100%;
    }

    .search-section {
      margin-bottom: 24px;
    }

    .search-container {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .search-container:focus-within {
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #999;
      font-size: 1.1rem;
    }

    .search-input {
      width: 100%;
      padding: 16px 48px 16px 48px;
      border: none;
      background: transparent;
      font-size: 1rem;
      color: #1a1a1a;
      outline: none;
      border-radius: 16px;
    }

    .search-input::placeholder {
      color: #999;
    }

    .btn-clear {
      position: absolute;
      right: 12px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-clear:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .selected-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .selected-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 12px;
    }

    .selected-label {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 0.95rem;
    }

    .selected-count {
      color: #666;
      font-size: 0.85rem;
    }

    .selected-participants {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .selected-participant {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 8px 12px;
      border-radius: 20px;
      color: white;
      font-size: 0.85rem;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    }

    .participant-avatar {
      margin-right: 8px;
    }

    .avatar-image {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-fallback {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .participant-name {
      margin-right: 4px;
    }

    .btn-remove {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.7rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-remove:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .connections-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .section-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .connections-count {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .btn-select-all {
      background: transparent;
      border: 1px solid #667eea;
      color: #667eea;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-select-all:hover {
      background: #667eea;
      color: white;
    }

    .loading-state {
      padding: 60px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(102, 126, 234, 0.2);
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text p {
      margin: 0 0 4px 0;
      color: #1a1a1a;
      font-weight: 500;
    }

    .loading-text small {
      color: #666;
    }

    .empty-state {
      padding: 80px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 20px;
    }

    .empty-content h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-content p {
      margin: 0 0 20px 0;
      color: #999;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #667eea;
      color: #667eea;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .connections-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .connection-item {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba(0, 0, 0, 0.02);
      position: relative;
    }

    .connection-item:hover {
      background: rgba(102, 126, 234, 0.05);
    }

    .connection-item.selected {
      background: rgba(102, 126, 234, 0.1);
    }

    .connection-item:last-child {
      border-bottom: none;
    }

    .connection-avatar {
      position: relative;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .connection-avatar .avatar-image {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .connection-avatar .avatar-fallback {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.2rem;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      background: #28a745;
      border: 2px solid white;
      border-radius: 50%;
    }

    .connection-info {
      flex: 1;
      min-width: 0;
    }

    .connection-main {
      margin-bottom: 6px;
    }

    .connection-name {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .connection-role {
      color: #666;
      font-size: 0.85rem;
    }

    .connection-meta {
      display: flex;
      gap: 12px;
    }

    .mutual-connections, .online-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #999;
    }

    .online-status {
      color: #28a745;
    }

    .selection-indicator {
      flex-shrink: 0;
      margin-left: 12px;
    }

    .checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid #ddd;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .checkbox.checked {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: #667eea;
    }

    .checkbox i {
      color: white;
      font-size: 0.8rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .checkbox.checked i {
      opacity: 1;
    }

    .action-section {
      position: sticky;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding: 16px 24px;
    }

    .action-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selected-summary {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .selected-total {
      font-weight: 600;
      color: #1a1a1a;
    }

    .btn-clear-all {
      background: transparent;
      border: none;
      color: #666;
      font-size: 0.85rem;
      text-decoration: underline;
      cursor: pointer;
      transition: color 0.3s ease;
    }

    .btn-clear-all:hover {
      color: #1a1a1a;
    }

    .btn-start-chat {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .btn-start-chat:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-start-chat:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-start-chat.loading .btn-content {
      opacity: 0;
    }

    .btn-start-chat.loading .btn-loader {
      opacity: 1;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.3s ease;
    }

    .btn-loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .connection-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 8px 12px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #666;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc3545;
      animation: pulse 2s infinite;
    }

    .connection-status.connected .status-indicator {
      background: #28a745;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }

      .header-content {
        padding: 0 16px;
      }

      .section-header {
        padding: 16px;
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .section-title-group {
        justify-content: space-between;
      }

      .connection-item {
        padding: 12px 16px;
      }

      .action-content {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .selected-summary {
        justify-content: space-between;
      }

      .connection-status {
        bottom: 80px;
        right: 16px;
      }
    }
  `]
})
export class NewChatComponent implements OnInit, OnDestroy {
  connections: UserConnection[] = [];
  filteredConnections: UserConnection[] = [];
  selectedParticipants: UserConnection[] = [];
  searchQuery = '';
  loading = false;
  startingChat = false;
  isConnected = false;

  private searchSubscription?: Subscription;
  private connectionSubscription?: Subscription;

  constructor(
    private connectionService: ConnectionService,
    private chatService: ChatService,
    private signalrChatService: SignalrChatService,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadConnections();
    this.setupConnectionMonitoring();
    this.setupSearchDebounce();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
  }

  setupConnectionMonitoring(): void {
    this.connectionSubscription = this.signalrChatService.connectionState$.subscribe(
      state => {
        this.isConnected = state.isConnected;
      }
    );
  }

  setupSearchDebounce(): void {
    this.searchSubscription = this.chatService.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.filterConnections();
    });
  }

  loadConnections(): void {
    this.loading = true;
    const currentUserId = this.authService.getCurrentUserId();

    this.connectionService.getUserConnections(currentUserId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.connections = response.data;
          this.filteredConnections = this.connections;
          this.updateOnlineStatus();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.loading = false;
        this.showError('Failed to load connections');
      },
    });
  }

  refreshConnections(): void {
    this.loadConnections();
  }

  onSearchChange(): void {
    this.chatService.searchSubject.next(this.searchQuery);
  }

  filterConnections(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConnections = this.connections;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredConnections = this.connections.filter(
      (connection) =>
        connection.name.toLowerCase().includes(query) ||
        connection.roleName.toLowerCase().includes(query) ||
        (connection.headline && connection.headline.toLowerCase().includes(query)) ||
        (connection.industry && connection.industry.toLowerCase().includes(query))
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterConnections();
  }

  toggleParticipant(connection: UserConnection): void {
    const index = this.selectedParticipants.findIndex(
      (p) => p.id === connection.id
    );

    if (index > -1) {
      this.selectedParticipants.splice(index, 1);
    } else {
      this.selectedParticipants.push(connection);
    }
  }

  removeParticipant(participant: UserConnection): void {
    this.selectedParticipants = this.selectedParticipants.filter(
      (p) => p.id !== participant.id
    );
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedParticipants = [];
    } else {
      this.selectedParticipants = [...this.filteredConnections];
    }
  }

  clearSelection(): void {
    this.selectedParticipants = [];
  }

  isSelected(connection: UserConnection): boolean {
    return this.selectedParticipants.some((p) => p.id === connection.id);
  }

  isAllSelected(): boolean {
    return this.filteredConnections.length > 0 && 
           this.selectedParticipants.length === this.filteredConnections.length;
  }

  isOnline(connection: UserConnection): boolean {
    return this.signalrChatService.isUserOnline(connection.id);
  }

  updateOnlineStatus(): void {
    // Online status is handled by the SignalR service
  }

startChat(): void {
  if (this.selectedParticipants.length === 0) return;

  this.startingChat = true;

  const createChatData: CreateChat = {
    participantIds: this.selectedParticipants.map((p) => p.id),
    groupName: this.selectedParticipants.length > 1
      ? `${this.selectedParticipants
        .map((p) => p.name.split(' ')[0])
        .join(', ')}`
      : undefined,
    type: this.selectedParticipants.length > 1 ? 'group' : 'direct'
  };

  this.chatService.createChat(createChatData).subscribe({
    next: (response) => {
      this.startingChat = false;

      if (response.success && response.data) {
        this.showSuccess('Chat created successfully!').then(() => {
          this.router.navigate(['/chat'], { 
            state: { 
              newChat: response.data, // TypeScript knows response.data exists here
              // scrollToChat: response.data.id 
            } 
          });
        });
      } else {
        this.showError(response.message || 'Failed to create chat');
      }
    },
    error: (error) => {
      this.startingChat = false;
      console.error('Error creating chat:', error);
      this.showError('Failed to start chat. Please try again.');
    },
  });
}

  getStartButtonText(): string {
    if (this.startingChat) {
      return 'Creating...';
    }
    return this.selectedParticipants.length > 1 ? 'Start Group Chat' : 'Start Chat';
  }

  getShortName(fullName: string): string {
    return fullName.split(' ')[0];
  }

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  getProfilePictureUrl(profilePicture: string | undefined): string {
    return this.apiService.getImageUrl(profilePicture);
  }

  handleImageError(event: any): void {
    const element = event.target;
    element.style.display = 'none';
    // Show fallback will be handled by the template
  }

  private showSuccess(message: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      timer: 2000,
      showConfirmButton: false,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.1)'
    });
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.1)'
    });
  }

  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.searchQuery) {
      this.clearSearch();
    }
  }
}
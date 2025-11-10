import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { SignalrChatService } from '../../services/signalr-chat.service';
import { AuthService } from '../../services/auth.service';
import { Chat, ChatParticipant, Message } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="chat-list-container">
      <div class="chat-header">
        <div class="header-content">
          <h3 class="header-title">Messaging</h3>
          <div class="header-actions">
            <button class="btn-icon" (click)="refreshChats()" [disabled]="loading">
              <i class="bi bi-arrow-clockwise" [class.spinning]="loading"></i>
            </button>
            <button class="btn-icon btn-new-chat" routerLink="/chat/new">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

        <div class="search-container">
          <i class="bi bi-search search-icon"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search conversations..."
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
          />
          <button *ngIf="searchQuery" class="btn-clear" (click)="clearSearch()">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <div class="chat-list" [class.loading]="loading">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading conversations...</span>
        </div>

        <div *ngIf="!loading && filteredChats.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="bi bi-chat-dots"></i>
          </div>
          <h4>{{ searchQuery ? 'No matches found' : 'No conversations' }}</h4>
          <p>{{ searchQuery ? 'Try adjusting your search' : 'Start a new conversation with your connections' }}</p>
          <button *ngIf="!searchQuery" class="btn-primary" routerLink="/chat/new">
            Start Chat
          </button>
        </div>

        <div *ngIf="!loading && filteredChats.length > 0" class="chat-items">
          <div 
            *ngFor="let chat of filteredChats" 
            class="chat-item"
            [class.active]="selectedChatId === chat.id"
            [class.unread]="chat.unreadCount > 0"
            (click)="selectChat(chat)"
          >
            <div class="chat-avatar" [class.online]="isChatOnline(chat)">
              @if (getOtherParticipant(chat)?.profilePicture) {
                <img 
                  [src]="getProfilePictureUrl(getOtherParticipant(chat)?.profilePicture)" 
                  [alt]="getChatName(chat)"
                  class="avatar-image"
                  (error)="handleImageError($event)"
                >
              } @else {
                <div class="avatar-fallback">
                  {{ getInitials(getChatName(chat)) }}
                </div>
              }
              <div class="online-indicator" *ngIf="isChatOnline(chat)"></div>
            </div>
            
            <div class="chat-content">
              <div class="chat-content-header">
                <h5 class="chat-name">{{ getChatName(chat) }}</h5>
                <span class="chat-time">{{ formatTime(chat.lastMessageAt) }}</span>
              </div>
              
              <div class="chat-preview">
                <p class="last-message">
                  {{ getLastMessagePreview(chat) }}
                </p>
                <div class="chat-meta">
                  <span *ngIf="chat.unreadCount > 0" class="unread-badge">
                    {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="connection-status" [class.connected]="isConnected" [class.reconnecting]="isReconnecting">
        <div class="status-indicator"></div>
        <span class="status-text">
          {{ isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-color: #007bff;
      --primary-color-light: #e3f2fd;
      --primary-color-dark: #0056b3;
      
      --body-bg: #f8f9fa;
      --container-bg: #ffffff;
      --border-color: #f0f0f0;
      
      --text-primary: #1a1a1a;
      --text-secondary: #666;
      --text-tertiary: #999;
      
      --online-color: #28a745;
      --offline-color: #dc3545;
      --reconnecting-color: #ffc107;
      
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 20px;
      --spacing-xl: 24px;
      
      --border-radius: 12px;
      
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --transition-speed: 0.2s;
    }

    .chat-list-container {
      font-family: var(--font-family);
      background: var(--container-bg);
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid var(--border-color);
    }

    /* --- Header & Search --- */
    .chat-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
      background: var(--container-bg);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .header-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .btn-icon {
      background: transparent;
      border: none;
      padding: var(--spacing-sm);
      border-radius: 50%;
      color: var(--text-secondary);
      transition: all var(--transition-speed) ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .btn-icon:hover:not(:disabled) {
      background: var(--body-bg);
      color: var(--text-primary);
    }

    .btn-icon.btn-new-chat {
      background: var(--primary-color-light);
      color: var(--primary-color);
    }
    
    .btn-icon.btn-new-chat:hover {
      background: var(--primary-color);
      color: #fff;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-tertiary);
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 44px;
      border: none;
      border-radius: var(--border-radius);
      font-size: 0.9rem;
      background: var(--body-bg);
      transition: all var(--transition-speed) ease;
      font-family: var(--font-family);
    }

    .search-input:focus {
      outline: none;
      background: var(--container-bg);
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    
    .search-input::placeholder {
      color: var(--text-tertiary);
    }

    .btn-clear {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: 50%;
      transition: all var(--transition-speed) ease;
    }

    .btn-clear:hover {
      background: var(--border-color);
      color: var(--text-secondary);
    }

    /* --- Chat List Area --- */
    .chat-list {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }
    
    /* Custom Scrollbar */
    .chat-list::-webkit-scrollbar {
      width: 6px;
    }
    .chat-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .chat-list::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 10px;
    }
    .chat-list::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }

    .chat-list.loading {
      opacity: 0.6;
    }

    .chat-items {
      padding: var(--spacing-sm) 0;
    }

    /* --- Loading & Empty States --- */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--text-secondary);
      text-align: center;
      height: 100%;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--primary-color-light);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--spacing-md);
    }

    .empty-icon {
      font-size: 3rem;
      color: #ccc;
      margin-bottom: var(--spacing-md);
    }

    .empty-state h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0 0 var(--spacing-lg) 0;
      color: var(--text-secondary);
      max-width: 300px;
    }

    .btn-primary {
      background: var(--primary-color);
      border: none;
      color: white;
      padding: 10px var(--spacing-md);
      border-radius: var(--border-radius);
      font-weight: 600;
      transition: all var(--transition-speed) ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn-primary:hover {
      background: var(--primary-color-dark);
      transform: scale(1.02);
    }

    /* --- Chat Item --- */
    .chat-item {
      display: flex;
      padding: var(--spacing-md) var(--spacing-xl);
      cursor: pointer;
      transition: background-color var(--transition-speed) ease;
      position: relative;
      border-bottom: 1px solid var(--border-color);
    }

    .chat-item:last-child {
      border-bottom: none;
    }

    .chat-item:hover {
      background: var(--body-bg);
    }

    .chat-item.active {
      background: var(--primary-color-light);
    }

    .chat-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 70%;
      background: var(--primary-color);
      border-radius: 0 4px 4px 0;
    }

    .chat-avatar {
      position: relative;
      margin-right: var(--spacing-md);
      flex-shrink: 0;
    }

    .avatar-image, .avatar-fallback {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-fallback {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: var(--online-color);
      border: 2px solid var(--container-bg);
      border-radius: 50%;
    }

    .chat-content {
      flex: 1;
      min-width: 0; /* Important for text truncation */
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .chat-content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .chat-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      flex-shrink: 0;
      margin-left: var(--spacing-sm);
    }

    .chat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }

    .last-message {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .chat-item.unread .chat-name {
      font-weight: 700;
    }
    
    .chat-item.unread .last-message {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .chat-item.unread .chat-time {
      color: var(--primary-color);
      font-weight: 600;
    }

    .chat-meta {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .unread-badge {
      background: var(--primary-color);
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 22px;
      text-align: center;
      line-height: 1.5;
    }

    /* --- Connection Status --- */
    .connection-status {
      padding: 10px var(--spacing-xl);
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.8rem;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--offline-color);
      transition: background-color var(--transition-speed) ease;
    }

    .connection-status.connected {
      color: var(--online-color);
    }
    .connected .status-indicator {
      background: var(--online-color);
      animation: pulse 2s infinite;
    }

    .connection-status.reconnecting {
      color: var(--reconnecting-color);
    }
    .reconnecting .status-indicator {
      background: var(--reconnecting-color);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(var(--pulse-color), 0); }
      100% { box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0); }
    }
    .connected .status-indicator { --pulse-color: 40, 167, 69; }
    .reconnecting .status-indicator { --pulse-color: 255, 193, 7; }

    /* --- Responsive --- */
    @media (max-width: 992px) {
      .chat-header {
        padding: var(--spacing-md);
      }
      .chat-item {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class ChatListComponent implements OnInit, OnDestroy {
  // ---
  // This is your EXACT TypeScript class. 
  // No changes were needed as the logic is excellent.
  // ---

  @Output() chatSelected = new EventEmitter<Chat>();
  
  chats: Chat[] = [];
  filteredChats: Chat[] = [];
  loading = false;
  selectedChatId: number | null = null;
  searchQuery = '';
  isConnected = false;
  isReconnecting = false;

  private subscriptions = new Subscription();

  constructor(
    private chatService: ChatService,
    private signalrChatService: SignalrChatService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadChats();
    this.setupRealTimeListeners();
    this.setupConnectionMonitoring();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadChats(): void {
    this.loading = true;
    this.chatService.getUserChats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.chats = response.data;
          this.filteredChats = this.chats;
          this.updateOnlineStatus();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.loading = false;
      }
    });
  }

  refreshChats(): void {
    this.loadChats();
  }

  setupRealTimeListeners(): void {
    // New messages
    this.subscriptions.add(
      this.signalrChatService.messageReceived$.subscribe((message) => {
        this.updateChatWithNewMessage(message);
      })
    );

    // Message read receipts
    this.subscriptions.add(
      this.signalrChatService.messageRead$.subscribe((data) => {
        this.updateMessageReadStatus(data);
      })
    );

    // User online status
    this.subscriptions.add(
      this.signalrChatService.userOnlineStatus$.subscribe((data) => {
        this.updateUserOnlineStatus(data.userId, data.isOnline);
      })
    );

    // New chat created
    this.subscriptions.add(
      this.signalrChatService.chatCreated$.subscribe((chat) => {
        this.addNewChat(chat);
      })
    );
  }

  setupConnectionMonitoring(): void {
    this.subscriptions.add(
      this.signalrChatService.connectionState$.subscribe((state) => {
        this.isConnected = state.isConnected;
        this.isReconnecting = state.isReconnecting;
      })
    );
  }

  updateChatWithNewMessage(message: Message): void {
    const chatIndex = this.chats.findIndex(chat => chat.id === message.chatId);
    
    if (chatIndex !== -1) {
      const chat = this.chats[chatIndex];
      chat.lastMessage = message.content;
      chat.lastMessageAt = message.createdAt;
      
      if (message.senderId !== this.authService.getCurrentUserId()) {
        chat.unreadCount++;
      }
      
      // Move to top
      this.chats.splice(chatIndex, 1);
      this.chats.unshift(chat);
      this.filterChats();
    } else {
      // Reload chats if chat not found (shouldn't normally happen)
      this.loadChats();
    }
  }

  updateMessageReadStatus(data: any): void {
    const chat = this.chats.find(c => c.id === data.chatId);
    if (chat && data.userId === this.authService.getCurrentUserId()) {
      chat.unreadCount = Math.max(0, chat.unreadCount - 1);
    }
  }

  updateUserOnlineStatus(userId: number, isOnline: boolean): void {
    this.chats.forEach(chat => {
      const participant = chat.participants.find(p => p.userId === userId);
      if (participant) {
        participant.isOnline = isOnline;
        chat.isOnline = isOnline;
      }
    });
  }

  updateOnlineStatus(): void {
    this.chats.forEach(chat => {
      const otherParticipant = this.getOtherParticipant(chat);
      if (otherParticipant) {
        chat.isOnline = this.signalrChatService.isUserOnline(otherParticipant.userId);
      }
    });
  }

  addNewChat(chat: Chat): void {
    // Check if chat already exists
    const existingIndex = this.chats.findIndex(c => c.id === chat.id);
    if (existingIndex === -1) {
      this.chats.unshift(chat);
      this.filterChats();
    }
  }

  onSearchChange(): void {
    this.filterChats();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterChats();
  }

  filterChats(): void {
    if (!this.searchQuery.trim()) {
      this.filteredChats = this.chats;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredChats = this.chats.filter(chat => {
      const chatName = this.getChatName(chat).toLowerCase();
      const lastMessage = chat.lastMessage?.toLowerCase() || '';
      return chatName.includes(query) || lastMessage.includes(query);
    });
  }

  selectChat(chat: Chat): void {
    this.selectedChatId = chat.id;
    this.chatSelected.emit(chat);
    
    // Reset unread count when selecting chat
    if (chat.unreadCount > 0) {
      this.signalrChatService.resetUnreadCount(chat.id);
      chat.unreadCount = 0;
    }
  }

  getProfilePictureUrl(profilePicture: string | undefined): string {
    return this.apiService.getImageUrl(profilePicture);
  }

  getOtherParticipant(chat: Chat): ChatParticipant | null {
    const currentUserId = this.authService.getCurrentUserId();
    return chat.participants.find(p => p.userId !== currentUserId) || null;
  }

  getChatName(chat: Chat): string {
    if (chat.type === 'group' && chat.groupName) {
      return chat.groupName;
    }
    
    const otherParticipant = this.getOtherParticipant(chat);
    return otherParticipant?.userName || 'Unknown User';
  }

  getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) return 'No messages yet';
    
    // Truncate long messages
    return chat.lastMessage.length > 60 
      ? chat.lastMessage.substring(0, 60) + '...' 
      : chat.lastMessage;
  }

  isChatOnline(chat: Chat): boolean {
    return chat.isOnline || false;
  }

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  handleImageError(event: any): void {
    const element = event.target;
    element.style.display = 'none';
    element.nextElementSibling?.style.display?.('flex');
  }

  formatTime(dateString?: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}
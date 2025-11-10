import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { SignalrChatService } from '../../services/signalr-chat.service';
import { AuthService } from '../../services/auth.service';
import { Chat, ChatParticipant, Message, UserTyping } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { Subscription, debounceTime } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-window-container" *ngIf="currentChat">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-info">
          <button class="btn-back" (click)="goBack.emit()" *ngIf="isMobile">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="chat-avatar" [class.online]="isOtherParticipantOnline">
            @if (getOtherParticipant()?.profilePicture) {
              <img 
                [src]="getProfilePictureUrl(getOtherParticipant()!.profilePicture!)" 
                [alt]="getOtherParticipant()?.userName"
                class="avatar-image"
                (error)="handleImageError($event)"
              >
            } @else {
              <div class="avatar-fallback">
                {{ getInitials(getOtherParticipant()?.userName || '') }}
              </div>
            }
            <div class="online-indicator" *ngIf="isOtherParticipantOnline"></div>
          </div>
          <div class="chat-details">
            <h4 class="chat-name">{{ getChatName() }}</h4>
            <div class="chat-status">
              <span *ngIf="isOtherParticipantOnline" class="status-online">Online</span>
              <span *ngIf="!isOtherParticipantOnline && getOtherParticipant()" class="status-offline">
                Last seen {{ getLastSeenTime() }}
              </span>
              <span *ngIf="currentChat.type === 'group'" class="participant-count">
                {{ currentChat.participants.length }} participants
              </span>
            </div>
          </div>
        </div>
        <div class="chat-actions">
          <button class="btn-icon" (click)="toggleInfoPanel()">
            <i class="bi bi-info-circle"></i>
          </button>
          <button class="btn-icon">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" #messagesContainer (scroll)="onScroll()">
        <!-- Loading More Messages -->
        <div *ngIf="loadingMore" class="loading-more">
          <div class="spinner-small"></div>
          <span>Loading earlier messages...</span>
        </div>

        <!-- Messages -->
        <div class="messages" *ngIf="!loadingMessages">
          <div *ngFor="let message of messages" 
               class="message-wrapper"
               [class.sent-message]="isSentByCurrentUser(message)"
               [class.received-message]="!isSentByCurrentUser(message)">
            
            <!-- Message Date Separator -->
            <div *ngIf="shouldShowDateSeparator(message)" class="date-separator">
              <span>{{ formatMessageDate(message.createdAt) }}</span>
            </div>

            <!-- Received Message (Left Side) -->
            <div *ngIf="!isSentByCurrentUser(message)" class="received-message-container">
              <!-- Avatar -->
              <div class="message-avatar" *ngIf="shouldShowAvatar(message)">
                @if (getMessageSender(message)?.profilePicture) {
                  <img 
                    [src]="getProfilePictureUrl(getMessageSender(message)!.profilePicture!)" 
                    [alt]="getMessageSender(message)?.userName"
                    class="avatar-small"
                    (error)="handleImageError($event)"
                  >
                } @else {
                  <div class="avatar-small-fallback">
                    {{ getInitials(getMessageSender(message)?.userName || '') }}
                  </div>
                }
              </div>

              <!-- Message Content -->
              <div class="message-content-wrapper">
                <!-- Sender name for group chats -->
                <div *ngIf="currentChat.type === 'group' && shouldShowAvatar(message)" 
                     class="sender-name">
                  {{ getMessageSender(message)?.userName }}
                </div>

                <div class="message-group">
                  <!-- Message Bubble -->
                  <div class="message-bubble received-bubble" 
                       [class.consecutive]="isConsecutiveMessage(message)"
                       [class.temporary]="isTemporaryMessage(message)">
                    
                    <!-- Reply context -->
                    <div *ngIf="message.replyTo" class="reply-context">
                      <i class="bi bi-reply"></i>
                      <span>Replying to a message</span>
                    </div>

                    <div class="message-text">{{ message.content }}</div>
                    
                    <div class="message-meta">
                      <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sent Message (Right Side) -->
            <div *ngIf="isSentByCurrentUser(message)" class="sent-message-container">
              <!-- Message Content -->
              <div class="message-content-wrapper">
                <div class="message-group">
                  <!-- Message Bubble -->
                  <div class="message-bubble sent-bubble" 
                       [class.consecutive]="isConsecutiveMessage(message)"
                       [class.temporary]="isTemporaryMessage(message)">
                    
                    <!-- Reply context -->
                    <div *ngIf="message.replyTo" class="reply-context">
                      <i class="bi bi-reply"></i>
                      <span>Replying to a message</span>
                    </div>

                    <div class="message-text">{{ message.content }}</div>
                    
                    <div class="message-meta">
                      <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                      
                      <!-- Send status for sent messages -->
                      <div class="send-status">
                        <span *ngIf="isTemporaryMessage(message)" class="sending-indicator">
                          <i class="bi bi-clock"></i>
                        </span>
                        <i *ngIf="!isTemporaryMessage(message) && !message.isRead" 
                           class="bi bi-check2"></i>
                        <i *ngIf="!isTemporaryMessage(message) && message.isRead" 
                           class="bi bi-check2-all read"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loadingMessages" class="loading-messages">
          <div class="spinner"></div>
          <span>Loading messages...</span>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div *ngIf="isTyping" class="typing-indicator">
        <div class="typing-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">{{ typingUser }} is typing...</span>
        </div>
      </div>

      <!-- Message Input -->
      <div class="message-input-container">
        <div class="input-actions">
          <button class="btn-icon">
            <i class="bi bi-plus-lg"></i>
          </button>
          <button class="btn-icon">
            <i class="bi bi-emoji-smile"></i>
          </button>
        </div>
        
        <div class="input-wrapper">
          <textarea
            #messageInput
            rows="1"
            class="message-input"
            placeholder="Type a message..."
            [(ngModel)]="newMessage"
            (keydown.enter)="onEnterKey($event)"
            (input)="onInputChange()"
            (focus)="onInputFocus()"
            [disabled]="!currentChat || sendingMessage"
          ></textarea>
          <button class="btn-icon btn-emoji">
            <i class="bi bi-emoji-smile"></i>
          </button>
        </div>

        <button 
          class="btn-send" 
          (click)="sendMessage()"
          [disabled]="!newMessage.trim() || !currentChat || sendingMessage"
          [class.sending]="sendingMessage"
        >
          <i class="bi bi-send"></i>
        </button>
      </div>
    </div>

    <!-- No Chat Selected -->
    <div *ngIf="!currentChat" class="no-chat-selected">
      <div class="no-chat-content">
        <div class="no-chat-icon">
          <i class="bi bi-chat-dots"></i>
        </div>
        <h3>Select a conversation</h3>
        <p>Choose a chat from the list to start messaging</p>
      </div>
    </div>

    <!-- Chat Info Panel -->
    <div *ngIf="showInfoPanel" class="chat-info-panel" [class.show]="showInfoPanel">
      <div class="info-panel-header">
        <h4>Chat Info</h4>
        <button class="btn-close" (click)="toggleInfoPanel()">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="info-panel-content">
        <!-- Chat info content here -->
      </div>
    </div>
  `,
  styles: [`
    .chat-window-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      border-right: 1px solid var(--border-color);
    }

    .chat-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      z-index: 10;
      flex-shrink: 0;
    }

    .chat-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-back {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: #666;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-back:hover {
      background: #f5f5f5;
    }

    .chat-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-image {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .avatar-fallback {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #28a745;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    .chat-details {
      flex: 1;
    }

    .chat-name {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .chat-status {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-online {
      color: #28a745;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status-offline {
      color: #999;
      font-size: 0.85rem;
    }

    .participant-count {
      color: #666;
      font-size: 0.85rem;
    }

    .chat-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 8px;
      color: #666;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover {
      background: #f5f5f5;
      color: #1a1a1a;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      color: #666;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .message-wrapper {
      display: flex;
      width: 100%;
      margin-bottom: 8px;
    }

    .sent-message {
      justify-content: flex-end;
    }

    .received-message {
      justify-content: flex-start;
    }

    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      position: relative;
      width: 100%;
    }

    .date-separator::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
      z-index: 1;
    }

    .date-separator span {
      background: #f8f9fa;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #999;
      z-index: 2;
      position: relative;
    }

    .received-message-container {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 70%;
      width: fit-content;
    }

    .message-avatar {
      flex-shrink: 0;
      align-self: flex-end;
      margin-bottom: 4px;
    }

    .avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-small-fallback {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.7rem;
    }

    .message-content-wrapper {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .sender-name {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 4px;
      margin-left: 8px;
      font-weight: 500;
    }

    .message-group {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      position: relative;
      max-width: 100%;
      transition: all 0.3s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.4;
      min-width: 0;
    }

    .message-text {
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.4;
      min-width: 0;
    }

    .received-bubble {
      background: white;
      color: #1a1a1a;
      border: 1px solid #e0e0e0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .received-bubble.consecutive {
      border-top-left-radius: 8px;
    }

    .sent-message-container {
      display: flex;
      justify-content: flex-end;
      max-width: 70%;
      width: fit-content;
      margin-left: auto;
    }

    .sent-bubble {
      background: #007bff;
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    }

    .sent-bubble.consecutive {
      border-top-right-radius: 8px;
    }

    .message-bubble.temporary {
      opacity: 0.7;
    }

    .reply-context {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      opacity: 0.7;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      white-space: nowrap;
    }

    .received-bubble .reply-context {
      border-bottom-color: rgba(0, 0, 0, 0.1);
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
    }

    .message-time {
      font-size: 0.7rem;
      opacity: 0.8;
      white-space: nowrap;
    }

    .send-status {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .sending-indicator {
      color: rgba(255, 255, 255, 0.7);
      animation: pulse 1.5s infinite;
    }

    .read-indicator {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .read-indicator.read {
      color: #28a745;
    }

    .loading-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #666;
      flex: 1;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    .typing-indicator {
      padding: 12px 24px;
      background: #f8f9fa;
      border-top: 1px solid #f0f0f0;
      flex-shrink: 0;
    }

    .typing-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: #999;
      border-radius: 50%;
      animation: typing-bounce 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing-bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .typing-text {
      font-size: 0.85rem;
      color: #666;
    }

    .message-input-container {
      padding: 20px 24px;
      border-top: 1px solid #f0f0f0;
      background: white;
      display: flex;
      align-items: flex-end;
      gap: 12px;
      flex-shrink: 0;
    }

    .input-actions {
      display: flex;
      gap: 4px;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      background: #f8f9fa;
      border-radius: 24px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
    }

    .input-wrapper:focus-within {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .message-input {
      width: 100%;
      border: none;
      background: transparent;
      padding: 12px 48px 12px 16px;
      resize: none;
      font-family: inherit;
      font-size: 0.9rem;
      line-height: 1.4;
      max-height: 120px;
      min-height: 20px;
      white-space: pre-wrap;
    }

    .message-input:focus {
      outline: none;
    }

    .message-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-emoji {
      position: absolute;
      right: 8px;
      bottom: 8px;
      padding: 4px;
    }

    .btn-send {
      background: #007bff;
      border: none;
      color: white;
      padding: 12px;
      border-radius: 50%;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-send:hover:not(:disabled) {
      background: #0056b3;
      transform: scale(1.05);
    }

    .btn-send:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .btn-send.sending {
      animation: spin 1s linear infinite;
    }

    .no-chat-selected {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .no-chat-content {
      text-align: center;
      color: #666;
      padding: 40px;
    }

    .no-chat-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 20px;
    }

    .no-chat-content h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .no-chat-content p {
      margin: 0;
      color: #999;
    }

    .chat-info-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 320px;
      background: white;
      border-left: 1px solid #f0f0f0;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
      z-index: 20;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }

    .chat-info-panel.show {
      transform: translateX(0);
    }

    .info-panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-panel-header h4 {
      margin: 0;
      color: #1a1a1a;
    }

    .btn-close {
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 8px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: #f5f5f5;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .chat-window-container {
        border-radius: 0;
      }

      .received-message-container,
      .sent-message-container {
        max-width: 85%;
      }

      .chat-header {
        padding: 16px;
      }

      .message-input-container {
        padding: 16px;
      }

      .messages-container {
        padding: 16px;
      }

      .chat-info-panel {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .received-message-container,
      .sent-message-container {
        max-width: 90%;
      }

      .message-bubble {
        padding: 10px 14px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() currentChat: Chat | null = null;
  @Input() isMobile = false;
  @Output() goBack = new EventEmitter<void>();
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  loadingMessages = false;
  loadingMore = false;
  sendingMessage = false;
  isTyping = false;
  typingUser = '';
  showInfoPanel = false;
  hasMoreMessages = true;
  currentPage = 1;
  pageSize = 50;

  private typingTimeout: any;
  private typingDebounceTimeout: any;
  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;
  private isNearBottom = true;
  
  private pendingMessageIds = new Set<number>();
  private processedMessageIds = new Set<number>();

  constructor(
    private chatService: ChatService,
    private signalrChatService: SignalrChatService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.setupRealTimeListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.clearTimeouts();
    this.pendingMessageIds.clear();
    this.processedMessageIds.clear();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnChanges() {
    if (this.currentChat) {
      this.loadMessages();
      this.joinChatRoom();
      this.resetChatState();
    }
  }

  private resetChatState(): void {
    this.messages = [];
    this.currentPage = 1;
    this.hasMoreMessages = true;
    this.newMessage = '';
    this.isTyping = false;
    this.pendingMessageIds.clear();
    this.processedMessageIds.clear();
  }

  loadMessages(loadMore = false): void {
    if (!this.currentChat) return;

    if (loadMore) {
      this.loadingMore = true;
      this.currentPage++;
    } else {
      this.loadingMessages = true;
      this.currentPage = 1;
    }

    this.chatService.getChatMessages(this.currentChat.id, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newMessages = response.data;
          
          if (loadMore) {
            this.messages = this.deduplicateMessages([...newMessages, ...this.messages]);
          } else {
            this.messages = this.deduplicateMessages(newMessages);
            this.shouldScrollToBottom = true;
          }

          this.hasMoreMessages = newMessages.length === this.pageSize;
          
          if (!loadMore) {
            this.markMessagesAsRead();
          }
        }
        
        this.loadingMessages = false;
        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
        this.loadingMore = false;
      }
    });
  }

  setupRealTimeListeners(): void {
    this.subscriptions.add(
      this.signalrChatService.messageReceived$.subscribe((message) => {
        if (this.currentChat && message.chatId === this.currentChat.id) {
          this.addMessageToChat(message);
        }
      })
    );

    this.subscriptions.add(
      this.signalrChatService.userTyping$.subscribe((data: UserTyping) => {
        if (this.currentChat && data.chatId === this.currentChat.id && 
            data.userId !== this.authService.getCurrentUserId()) {
          
          this.isTyping = data.isTyping;
          this.typingUser = data.userName;
          
          if (this.isTyping) {
            this.clearTimeouts();
            this.typingTimeout = setTimeout(() => {
              this.isTyping = false;
            }, 3000);
          }
        }
      })
    );

    this.subscriptions.add(
      this.signalrChatService.messageRead$.subscribe((data) => {
        if (this.currentChat && data.chatId === this.currentChat.id) {
          this.updateMessageReadStatus(data.messageId);
        }
      })
    );

    this.subscriptions.add(
      this.signalrChatService.userOnlineStatus$.subscribe((data) => {
        if (this.currentChat && this.getOtherParticipant()?.userId === data.userId) {
          this.currentChat = { ...this.currentChat };
        }
      })
    );
  }

  joinChatRoom(): void {
    if (this.currentChat) {
      this.signalrChatService.joinChat(this.currentChat.id);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.currentChat || this.sendingMessage) return;

    this.sendingMessage = true;
    const messageContent = this.newMessage.trim();

    const messageData = {
      chatId: this.currentChat.id,
      content: messageContent,
      messageType: 'text'
    };

    // Create temporary message with current Indian time
    const tempMessage: Message = {
      id: this.generateTempId(),
      chatId: this.currentChat.id,
      senderId: this.authService.getCurrentUserId(),
      content: messageContent,
      messageType: 'text',
      createdAt: new Date().toISOString(), // This will be in UTC
      isRead: false,
      replyTo: undefined
    };

    this.addMessageToChat(tempMessage);
    this.pendingMessageIds.add(tempMessage.id);

    this.chatService.sendMessage(messageData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const realMessage = response.data;
          
          this.removeMessageById(tempMessage.id);
          this.pendingMessageIds.delete(tempMessage.id);
          
          this.addMessageToChat(realMessage);
          
          this.newMessage = '';
          this.shouldScrollToBottom = true;
          this.adjustTextareaHeight();
        }
        this.sendingMessage = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.removeMessageById(tempMessage.id);
        this.pendingMessageIds.delete(tempMessage.id);
        this.sendingMessage = false;
      }
    });
  }

  private addMessageToChat(message: Message): void {
    if (this.processedMessageIds.has(message.id)) {
      return;
    }

    const isDuplicate = this.messages.some(existingMessage => 
      existingMessage.id !== message.id &&
      existingMessage.content === message.content &&
      existingMessage.senderId === message.senderId &&
      Math.abs(new Date(existingMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) < 3000
    );

    if (isDuplicate) {
      return;
    }

    this.messages.push(message);
    this.processedMessageIds.add(message.id);
    
    if (message.senderId !== this.authService.getCurrentUserId() && !this.isTemporaryMessage(message)) {
      this.markMessageAsRead(message.id);
    }

    if (this.isNearBottom) {
      this.shouldScrollToBottom = true;
    }
  }

  private removeMessageById(messageId: number): void {
    const index = this.messages.findIndex(msg => msg.id === messageId);
    if (index > -1) {
      this.messages.splice(index, 1);
    }
  }

  private deduplicateMessages(messages: Message[]): Message[] {
    const seen = new Set<number>();
    return messages.filter(message => {
      if (seen.has(message.id)) {
        return false;
      }
      seen.add(message.id);
      return true;
    });
  }

  private generateTempId(): number {
    return -Date.now();
  }

  isTemporaryMessage(message: Message): boolean {
    return message.id < 0;
  }

  onInputChange(): void {
    this.adjustTextareaHeight();
    
    if (this.currentChat) {
      clearTimeout(this.typingDebounceTimeout);
      this.typingDebounceTimeout = setTimeout(() => {
        this.signalrChatService.sendTypingIndicator(this.currentChat!.id, true);
      }, 300);
    }
  }

  onInputFocus(): void {
    this.scrollToBottom();
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  onScroll(): void {
    if (!this.messagesContainer) return;

    const element = this.messagesContainer.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    this.isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (scrollTop < 100 && this.hasMoreMessages && !this.loadingMore) {
      this.loadMessages(true);
    }
  }

  adjustTextareaHeight(): void {
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  markMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(
      message => !message.isRead && 
      message.senderId !== this.authService.getCurrentUserId() &&
      !this.isTemporaryMessage(message)
    );

    unreadMessages.forEach(message => {
      this.markMessageAsRead(message.id);
    });
  }

  markMessageAsRead(messageId: number): void {
    if (messageId > 0) {
      this.chatService.markMessageAsRead(messageId).subscribe({
        next: (response) => {
          if (response.success) {
            this.updateMessageReadStatus(messageId);
          }
        },
        error: (error) => {
          console.error('Error marking message as read:', error);
        }
      });
    }
  }

  updateMessageReadStatus(messageId: number): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.isRead = true;
    }
  }

  // UI Helper Methods
  isSentByCurrentUser(message: Message): boolean {
    return message.senderId === this.authService.getCurrentUserId();
  }

  getOtherParticipant(): ChatParticipant | null {
    if (!this.currentChat) return null;
    const currentUserId = this.authService.getCurrentUserId();
    return this.currentChat.participants.find(p => p.userId !== currentUserId) || null;
  }

  get isOtherParticipantOnline(): boolean {
    const otherParticipant = this.getOtherParticipant();
    return otherParticipant ? this.signalrChatService.isUserOnline(otherParticipant.userId) : false;
  }

  getMessageSender(message: Message): ChatParticipant | undefined {
    return this.currentChat?.participants.find(p => p.userId === message.senderId);
  }

  shouldShowAvatar(message: Message): boolean {
    const messageIndex = this.messages.indexOf(message);
    if (messageIndex === 0) return true;

    const prevMessage = this.messages[messageIndex - 1];
    return prevMessage.senderId !== message.senderId ||
           new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;
  }

  isConsecutiveMessage(message: Message): boolean {
    const messageIndex = this.messages.indexOf(message);
    if (messageIndex === 0) return false;

    const prevMessage = this.messages[messageIndex - 1];
    return prevMessage.senderId === message.senderId &&
           new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <= 300000;
  }

  shouldShowDateSeparator(message: Message): boolean {
    const messageIndex = this.messages.indexOf(message);
    if (messageIndex === 0) return true;

    const prevMessage = this.messages[messageIndex - 1];
    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(prevMessage.createdAt).toDateString();

    return currentDate !== prevDate;
  }

  getProfilePictureUrl(profilePicture: string | undefined): string {
    return this.apiService.getImageUrl(profilePicture);
  }

  getChatName(): string {
    if (!this.currentChat) return '';
    
    if (this.currentChat.type === 'group' && this.currentChat.groupName) {
      return this.currentChat.groupName;
    }
    
    const otherParticipant = this.getOtherParticipant();
    return otherParticipant?.userName || 'Unknown User';
  }

  getLastSeenTime(): string {
    const otherParticipant = this.getOtherParticipant();
    if (!otherParticipant?.lastSeen) return 'recently';

    const lastSeen = new Date(otherParticipant.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  formatMessageTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Use Indian timezone (Asia/Kolkata) for consistent time display
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
  }

  handleImageError(event: any): void {
    const element = event.target;
    element.style.display = 'none';
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      setTimeout(() => {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 0);
    }
  }

  private clearTimeouts(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
    }
  }
}
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { SignalrChatService } from '../../services/signalr-chat.service';
import { AuthService } from '../../services/auth.service';
import { Chat, ChatParticipant, Message, UserTyping, CreateMessage, FileUploadProgress, MessageAttachment } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { Subscription, debounceTime } from 'rxjs';
import { FileUploadService } from '../../services/file-upload.service';

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

                    <!-- File Attachments -->
                    <div *ngIf="message.attachments && message.attachments.length > 0" class="message-attachments">
                      <div *ngFor="let attachment of message.attachments" class="attachment-item">
                        
                        <!-- Image Attachment -->
                        <div *ngIf="attachment.fileType === 'image'" class="image-attachment" (click)="openAttachmentViewer(attachment)">
                          <img [src]="getAttachmentUrl(attachment)" 
                               [alt]="attachment.fileName"
                               class="attachment-image"
                               (error)="handleAttachmentError($event)">
                          <div class="attachment-overlay">
                            <button class="btn-download" (click)="downloadAttachmentDirect(attachment); $event.stopPropagation()">
                              <i class="bi bi-download"></i>
                            </button>
                          </div>
                        </div>

                        <!-- Video Attachment -->
                        <div *ngIf="attachment.fileType === 'video'" class="video-attachment">
                          <video controls class="attachment-video">
                            <source [src]="getAttachmentUrl(attachment)" [type]="getVideoMimeType(attachment.fileName)">
                          </video>
                          <div class="video-info">
                            <span class="video-name">{{ attachment.fileName }}</span>
                            <button class="btn-download" (click)="downloadAttachment(attachment)">
                              <i class="bi bi-download"></i>
                            </button>
                          </div>
                        </div>

                        <!-- Audio Attachment -->
                        <div *ngIf="attachment.fileType === 'audio'" class="audio-attachment">
                          <div class="audio-player">
                            <audio controls class="attachment-audio">
                              <source [src]="getAttachmentUrl(attachment)" [type]="getAudioMimeType(attachment.fileName)">
                            </audio>
                            <div class="audio-info">
                              <span class="audio-name">{{ attachment.fileName }}</span>
                              <span class="audio-size">{{ formatFileSize(attachment.fileSize) }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Document Attachment -->
                        <div *ngIf="isDocumentType(attachment.fileType)" class="document-attachment">
                          <div class="document-icon">
                            <i [class]="getDocumentIcon(attachment.fileType)"></i>
                          </div>
                          <div class="document-info">
                            <span class="document-name">{{ attachment.fileName }}</span>
                            <span class="document-size">{{ formatFileSize(attachment.fileSize) }}</span>
                          </div>
                          <button class="btn-download" (click)="downloadAttachment(attachment)">
                            <i class="bi bi-download"></i>
                          </button>
                        </div>

                        <!-- Other File Types -->
                        <div *ngIf="isOtherFileType(attachment.fileType)" class="file-attachment">
                          <div class="file-icon">
                            <i class="bi bi-file-earmark"></i>
                          </div>
                          <div class="file-info">
                            <span class="file-name">{{ attachment.fileName }}</span>
                            <span class="file-size">{{ formatFileSize(attachment.fileSize) }}</span>
                          </div>
                          <button class="btn-download" (click)="downloadAttachment(attachment)">
                            <i class="bi bi-download"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Text Content -->
                    <div *ngIf="message.content" class="message-text">{{ message.content }}</div>
                    
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

                    <!-- File Attachments (Same as received but with sent styling) -->
                    <div *ngIf="message.attachments && message.attachments.length > 0" class="message-attachments">
                      <div *ngFor="let attachment of message.attachments" class="attachment-item">
                        
                        <!-- Image Attachment -->
                        <div *ngIf="attachment.fileType === 'image'" class="image-attachment" (click)="openAttachmentViewer(attachment)">
                          <img [src]="getAttachmentUrl(attachment)" 
                               [alt]="attachment.fileName"
                               class="attachment-image"
                               (error)="handleAttachmentError($event)">
                          <div class="attachment-overlay">
                            <button class="btn-download" (click)="downloadAttachment(attachment); $event.stopPropagation()">
                              <i class="bi bi-download"></i>
                            </button>
                          </div>
                        </div>

                        <!-- Video Attachment -->
                        <div *ngIf="attachment.fileType === 'video'" class="video-attachment">
                          <video controls class="attachment-video">
                            <source [src]="getAttachmentUrl(attachment)" [type]="getVideoMimeType(attachment.fileName)">
                          </video>
                          <div class="video-info">
                            <span class="video-name">{{ attachment.fileName }}</span>
                            <button class="btn-download" (click)="downloadAttachment(attachment)">
                              <i class="bi bi-download"></i>
                            </button>
                          </div>
                        </div>

                        <!-- Audio Attachment -->
                        <div *ngIf="attachment.fileType === 'audio'" class="audio-attachment">
                          <div class="audio-player">
                            <audio controls class="attachment-audio">
                              <source [src]="getAttachmentUrl(attachment)" [type]="getAudioMimeType(attachment.fileName)">
                            </audio>
                            <div class="audio-info">
                              <span class="audio-name">{{ attachment.fileName }}</span>
                              <span class="audio-size">{{ formatFileSize(attachment.fileSize) }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Document Attachment -->
                        <div *ngIf="isDocumentType(attachment.fileType)" class="document-attachment">
                          <div class="document-icon">
                            <i [class]="getDocumentIcon(attachment.fileType)"></i>
                          </div>
                          <div class="document-info">
                            <span class="document-name">{{ attachment.fileName }}</span>
                            <span class="document-size">{{ formatFileSize(attachment.fileSize) }}</span>
                          </div>
                          <button class="btn-download" (click)="downloadAttachment(attachment)">
                            <i class="bi bi-download"></i>
                          </button>
                        </div>

                        <!-- Other File Types -->
                        <div *ngIf="isOtherFileType(attachment.fileType)" class="file-attachment">
                          <div class="file-icon">
                            <i class="bi bi-file-earmark"></i>
                          </div>
                          <div class="file-info">
                            <span class="file-name">{{ attachment.fileName }}</span>
                            <span class="file-size">{{ formatFileSize(attachment.fileSize) }}</span>
                          </div>
                          <button class="btn-download" (click)="downloadAttachment(attachment)">
                            <i class="bi bi-download"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Text Content -->
                    <div *ngIf="message.content" class="message-text">{{ message.content }}</div>
                    
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

      <!-- File Upload Progress -->
      <div *ngIf="activeUploads.size > 0" class="upload-progress-container">
        <div *ngFor="let upload of getActiveUploads()" class="upload-progress-item">
          <div class="upload-info">
            <i [class]="getFileIcon(upload.fileName)"></i>
            <span class="upload-filename">{{ upload.fileName }}</span>
          </div>
          <div class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="upload.percentage"></div>
            </div>
            <span class="upload-percentage">{{ upload.percentage }}%</span>
          </div>
          <button *ngIf="upload.status === 'error'" class="btn-retry" (click)="retryUpload(upload.uploadId)">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button class="btn-cancel" (click)="cancelUpload(upload.uploadId)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Selected Files Preview -->
      <div *ngIf="selectedFiles.length > 0" class="selected-files-preview">
        <div *ngFor="let file of selectedFiles; let i = index" class="selected-file-item">
          <div class="file-preview">
            <img *ngIf="fileUploadService.isImageFile(file)" 
                 [src]="filePreviews.get(file.name)" 
                 class="file-preview-image"
                 (error)="handlePreviewError($event)">
            <i *ngIf="!fileUploadService.isImageFile(file)" 
               [class]="getFileIcon(file.name)" 
               class="file-preview-icon"></i>
          </div>
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ fileUploadService.formatFileSize(file.size) }}</span>
          </div>
          <button class="btn-remove-file" (click)="removeSelectedFile(i)">
            <i class="bi bi-x"></i>
          </button>
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
          <!-- File Upload Button -->
          <div class="file-upload-wrapper">
            <input type="file" #fileInput multiple 
                   (change)="onFileSelected($event)"
                   [accept]="allowedFileTypes"
                   style="display: none">
            <button class="btn-icon" (click)="fileInput.click()" title="Attach files">
              <i class="bi bi-paperclip"></i>
            </button>
          </div>
          
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
        </div>

        <button 
          class="btn-send" 
          (click)="sendMessage()"
          [disabled]="(!newMessage.trim() && selectedFiles.length === 0) || !currentChat || sendingMessage"
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

    <!-- File Viewer Modal -->
    <div *ngIf="viewingAttachment" class="file-viewer-modal" (click)="closeAttachmentViewer()">
      <div class="file-viewer-content" (click)="$event.stopPropagation()">
        <button class="btn-close-viewer" (click)="closeAttachmentViewer()">
          <i class="bi bi-x"></i>
        </button>
        
        <div *ngIf="viewingAttachment.fileType === 'image'" class="image-viewer">
          <img [src]="getAttachmentUrl(viewingAttachment)" 
               [alt]="viewingAttachment.fileName"
               class="viewer-image">
        </div>
        
        <div *ngIf="viewingAttachment.fileType === 'video'" class="video-viewer">
          <video controls autoplay class="viewer-video">
            <source [src]="getAttachmentUrl(viewingAttachment)" [type]="getVideoMimeType(viewingAttachment.fileName)">
          </video>
        </div>
        
        <div class="viewer-actions">
          <button class="btn-download-viewer" (click)="downloadAttachment(viewingAttachment)">
            <i class="bi bi-download"></i>
            Download
          </button>
          <span class="viewer-filename">{{ viewingAttachment.fileName }}</span>
        </div>
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

    /* File Upload Progress */
    .upload-progress-container {
      padding: 12px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    .upload-progress-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: white;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .upload-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .upload-filename {
      font-size: 0.85rem;
      color: #495057;
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 2;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #007bff;
      transition: width 0.3s ease;
    }

    .upload-percentage {
      font-size: 0.75rem;
      color: #6c757d;
      min-width: 40px;
    }

    .btn-retry, .btn-cancel {
      background: none;
      border: none;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      color: #6c757d;
    }

    .btn-retry:hover {
      color: #007bff;
    }

    .btn-cancel:hover {
      color: #dc3545;
    }

    /* Selected Files Preview */
    .selected-files-preview {
      padding: 12px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    .selected-file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: white;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .file-preview {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      flex-shrink: 0;
    }

    .file-preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-preview-icon {
      font-size: 1.2rem;
      color: #6c757d;
    }

    .file-info {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      display: block;
      font-size: 0.8rem;
      color: #495057;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.7rem;
      color: #6c757d;
    }

    .btn-remove-file {
      background: none;
      border: none;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      color: #6c757d;
      flex-shrink: 0;
    }

    .btn-remove-file:hover {
      color: #dc3545;
    }

    /* Message Attachments */
    .message-attachments {
      margin-bottom: 8px;
    }

    .attachment-item {
      margin-bottom: 8px;
    }

    .attachment-item:last-child {
      margin-bottom: 0;
    }

    /* Image Attachment */
    .image-attachment {
      position: relative;
      max-width: 300px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
    }

    .attachment-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .image-attachment:hover .attachment-image {
      transform: scale(1.02);
    }

    .attachment-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .image-attachment:hover .attachment-overlay {
      opacity: 1;
    }

    .btn-download {
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Video Attachment */
    .video-attachment {
      max-width: 300px;
    }

    .attachment-video {
      width: 100%;
      border-radius: 8px;
    }

    .video-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 0 0 8px 8px;
    }

    .video-name {
      font-size: 0.8rem;
      color: #495057;
    }

    /* Audio Attachment */
    .audio-attachment {
      max-width: 250px;
    }

    .audio-player {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .attachment-audio {
      flex: 1;
    }

    .audio-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .audio-name {
      font-size: 0.8rem;
      color: #495057;
    }

    .audio-size {
      font-size: 0.7rem;
      color: #6c757d;
    }

    /* Document Attachment */
    .document-attachment, .file-attachment {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      max-width: 300px;
    }

    .document-icon, .file-icon {
      font-size: 1.5rem;
      color: #495057;
      flex-shrink: 0;
    }

    .document-info, .file-info {
      flex: 1;
      min-width: 0;
    }

    .document-name, .file-name {
      display: block;
      font-size: 0.85rem;
      color: #495057;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .document-size, .file-size {
      font-size: 0.75rem;
      color: #6c757d;
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
      padding: 12px 16px;
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

    /* File Viewer Modal */
    .file-viewer-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .file-viewer-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .btn-close-viewer {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
    }

    .image-viewer, .video-viewer {
      max-width: 100%;
      max-height: calc(90vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .viewer-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .viewer-video {
      max-width: 100%;
      max-height: 100%;
    }

    .viewer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    .btn-download-viewer {
      background: #007bff;
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .viewer-filename {
      font-size: 0.9rem;
      color: #495057;
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

      .image-attachment, .video-attachment {
        max-width: 250px;
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

      .image-attachment, .video-attachment {
        max-width: 200px;
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
  @ViewChild('fileInput') private fileInput!: ElementRef;

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

  // File upload properties
  selectedFiles: File[] = [];
  filePreviews = new Map<string, string>();
  activeUploads = new Map<string, FileUploadProgress>();
  viewingAttachment: MessageAttachment | null = null;
  allowedFileTypes = '.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar';

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
    private apiService: ApiService,
    public fileUploadService: FileUploadService
  ) {}

  ngOnInit() {
    this.setupRealTimeListeners();
    this.setupFileUploadListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.clearTimeouts();
    this.pendingMessageIds.clear();
    this.processedMessageIds.clear();
    this.selectedFiles = [];
    this.filePreviews.clear();
    this.activeUploads.clear();
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
    this.selectedFiles = [];
    this.filePreviews.clear();
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

  private setupFileUploadListeners(): void {
    this.subscriptions.add(
      this.fileUploadService.uploadProgress$.subscribe(progressMap => {
        this.activeUploads = progressMap;
      })
    );

    this.subscriptions.add(
      this.fileUploadService.uploadComplete$.subscribe(({ uploadId, response }) => {
        if (response.success) {
          console.log('File upload completed:', response);
        }
      })
    );
  }

  joinChatRoom(): void {
    if (this.currentChat) {
      this.signalrChatService.joinChat(this.currentChat.id);
    }
  }

  // File Upload Methods
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = this.fileUploadService.validateFile(file);
      
      if (validation.valid) {
        this.selectedFiles.push(file);
        this.generateFilePreview(file);
      } else {
        this.showFileError(validation.error!, file.name);
      }
    }

    // Reset file input
    this.fileInput.nativeElement.value = '';
  }

  private async generateFilePreview(file: File): Promise<void> {
    if (this.fileUploadService.isImageFile(file)) {
      try {
        const previewUrl = await this.fileUploadService.generatePreviewUrl(file);
        this.filePreviews.set(file.name, previewUrl);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  }

  removeSelectedFile(index: number): void {
    const file = this.selectedFiles[index];
    this.filePreviews.delete(file.name);
    this.selectedFiles.splice(index, 1);
  }

  // Updated sendMessage to handle files
  // chat-window.component.ts - UPDATED sendMessage method
sendMessage(): void {
  if ((!this.newMessage.trim() && this.selectedFiles.length === 0) || !this.currentChat || this.sendingMessage) return;

  this.sendingMessage = true;

  const messageData: CreateMessage = {
    chatId: this.currentChat.id,
    content: this.newMessage.trim(),
    messageType: this.selectedFiles.length > 0 ? 'file' : 'text',
    files: this.selectedFiles.length > 0 ? this.selectedFiles : undefined
  };

  // Create temporary message for immediate UI feedback
  const tempMessage: Message = {
    id: this.generateTempId(),
    chatId: this.currentChat.id,
    senderId: this.authService.getCurrentUserId(),
    content: this.newMessage.trim() || this.generateFileMessage(this.selectedFiles),
    messageType: this.selectedFiles.length > 0 ? 'file' : 'text',
    createdAt: new Date().toISOString(),
    isRead: false,
    attachments: this.selectedFiles.length > 0 ? this.generateTempAttachments(this.selectedFiles) : []
  };

  this.addMessageToChat(tempMessage);
  this.pendingMessageIds.add(tempMessage.id);

  this.chatService.sendMessage(messageData).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        const realMessage = response.data;
        
        // Replace temporary message with real one
        this.removeMessageById(tempMessage.id);
        this.pendingMessageIds.delete(tempMessage.id);
        this.addMessageToChat(realMessage);
        
        // Clear input and reset state
        this.newMessage = '';
        this.selectedFiles = [];
        this.filePreviews.clear();
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
      
      // Show error to user
      alert('Failed to send message. Please try again.');
    }
  });
}

  private generateFileMessage(files: File[]): string {
    if (files.length === 1) {
      return `[${this.fileUploadService.getFileType(files[0]).toUpperCase()} file]`;
    } else {
      return `[${files.length} files]`;
    }
  }

  private generateTempAttachments(files: File[]): MessageAttachment[] {
    return files.map(file => ({
      id: this.generateTempId(),
      fileName: file.name,
      fileUrl: '',
      fileType: this.fileUploadService.getFileType(file),
      fileSize: file.size,
      thumbnailUrl: this.filePreviews.get(file.name) || ''
    }));
  }

  // File attachment methods
  getAttachmentUrl(attachment: MessageAttachment): string {
    return this.apiService.getImageUrl(attachment.fileUrl);
  }

  openAttachmentViewer(attachment: MessageAttachment): void {
    if (attachment.fileType === 'image' || attachment.fileType === 'video') {
      this.viewingAttachment = attachment;
    }
  }

  closeAttachmentViewer(): void {
    this.viewingAttachment = null;
  }

 downloadAttachment(attachment: MessageAttachment): void {
    const fileUrl = this.getAttachmentUrl(attachment);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = attachment.fileName; // This forces download
    link.target = '_blank'; // Still open in new tab but as download
    
    // For direct download, we need to make a fetch request and create blob
    this.forceDownload(attachment);
}

// NEW METHOD: Force file download
forceDownload(attachment: MessageAttachment): void {
    const fileUrl = this.getAttachmentUrl(attachment);
    
    fetch(fileUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            // Create blob URL
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create temporary link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = attachment.fileName;
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
            console.error('Download error:', error);
            // Fallback: open in new tab
            window.open(fileUrl, '_blank');
        });
}

// Alternative simpler method for direct download
downloadAttachmentDirect(attachment: MessageAttachment): void {
    const fileUrl = this.getAttachmentUrl(attachment);
    
    // Create temporary link with download attribute
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = attachment.fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

  handleAttachmentError(event: any): void {
    console.error('Error loading attachment');
    event.target.style.display = 'none';
  }

  handlePreviewError(event: any): void {
    event.target.style.display = 'none';
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bi bi-file-earmark-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'bi bi-file-earmark-word text-primary';
      case 'xls':
      case 'xlsx':
        return 'bi bi-file-earmark-excel text-success';
      case 'ppt':
      case 'pptx':
        return 'bi bi-file-earmark-ppt text-warning';
      case 'zip':
      case 'rar':
        return 'bi bi-file-earmark-zip text-secondary';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'bi bi-file-earmark-music text-info';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'bi bi-file-earmark-play text-primary';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi bi-file-earmark-image text-success';
      default:
        return 'bi bi-file-earmark text-secondary';
    }
  }

  getDocumentIcon(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return 'bi bi-file-earmark-pdf text-danger';
      case 'word':
        return 'bi bi-file-earmark-word text-primary';
      case 'excel':
        return 'bi bi-file-earmark-excel text-success';
      case 'powerpoint':
        return 'bi bi-file-earmark-ppt text-warning';
      default:
        return 'bi bi-file-earmark text-secondary';
    }
  }

  isDocumentType(fileType: string): boolean {
    return ['pdf', 'word', 'excel', 'powerpoint', 'document'].includes(fileType);
  }

  isOtherFileType(fileType: string): boolean {
    return !['image', 'video', 'audio', 'pdf', 'word', 'excel', 'powerpoint', 'document'].includes(fileType);
  }

  getVideoMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp4': return 'video/mp4';
      case 'avi': return 'video/x-msvideo';
      case 'mov': return 'video/quicktime';
      case 'wmv': return 'video/x-ms-wmv';
      default: return 'video/mp4';
    }
  }

  getAudioMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      default: return 'audio/mpeg';
    }
  }

  getActiveUploads(): FileUploadProgress[] {
    return Array.from(this.activeUploads.values());
  }

  retryUpload(uploadId: string): void {
    console.log('Retry upload:', uploadId);
    // Implement retry logic if needed
  }

  cancelUpload(uploadId: string): void {
    this.fileUploadService.clearProgress(uploadId);
  }

  private showFileError(error: string, filename: string): void {
    alert(`Error with file ${filename}: ${error}`);
  }

  // All your existing methods remain unchanged below...
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
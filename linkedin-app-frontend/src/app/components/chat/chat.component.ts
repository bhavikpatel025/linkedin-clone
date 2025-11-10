import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { SignalrChatService } from '../../services/signalr-chat.service';
import { Chat } from '../../models/models';
import { Subscription } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ChatListComponent, ChatWindowComponent],
  template: `
    <div class="chat-container">
      <div class="chat-layout" [class.mobile]="isMobile" [class.sidebar-hidden]="isMobile && selectedChat">
        <div class="chat-sidebar" *ngIf="!isMobile || !selectedChat">
          <app-chat-list (chatSelected)="onChatSelected($event)"></app-chat-list>
        </div>

        <div class="chat-main" *ngIf="selectedChat">
          <app-chat-window 
            [currentChat]="selectedChat"
            [isMobile]="isMobile"
            (goBack)="onGoBack()">
          </app-chat-window>
        </div>

        <div *ngIf="!selectedChat && !isMobile" class="no-chat-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon"><i class="bi bi-chat-dots"></i></div>
            <h3>Welcome to Messages</h3>
            <p>Select a conversation from the sidebar to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      padding: 20px;
      background: #f3f2ef;
      min-height: calc(100vh - 60px);
    }
    .chat-layout {
      display: flex;
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
      height: calc(100vh - 140px);
      transition: all 0.3s ease;
    }
    .chat-sidebar {
      flex: 0 0 400px;
    }
    .chat-main {
      flex: 1;
      min-width: 0;
    }
    .no-chat-placeholder {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    .placeholder-content {
      text-align: center;
      color: #666;
      padding: 40px;
    }
    .placeholder-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 20px;
    }
    .placeholder-content h3 {
      margin: 0 0 8px 0;
      color: #666;
    }
    .placeholder-content p {
      margin: 0;
      color: #999;
    }
    .chat-layout.mobile {
      height: calc(100vh - 100px);
      gap: 0;
    }
    .chat-layout.mobile .chat-sidebar,
    .chat-layout.mobile .chat-main {
      flex: 0 0 100%;
      transition: transform 0.3s ease;
    }
    .chat-layout.mobile.sidebar-hidden .chat-sidebar {
      transform: translateX(-100%);
    }
    .chat-layout.mobile:not(.sidebar-hidden) .chat-main {
      transform: translateX(100%);
    }
    @media (max-width: 768px) {
      .chat-container { padding: 0; }
      .chat-layout { height: 100vh; }
    }
    @media (max-width: 1200px) {
      .chat-sidebar { flex: 0 0 350px; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  selectedChat: Chat | null = null;
  isMobile = false;
  private subscriptions = new Subscription();
  authService: any;

  constructor(private signalrChatService: SignalrChatService) {}

  ngOnInit() {
    this.checkScreenSize();
    this.startChatConnection();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.signalrChatService.disconnect();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  // In chat.component.ts - improve connection handling
async startChatConnection(): Promise<void> {
  try {
    // Check if user is authenticated first
    if (!this.authService.isLoggedIn()) {
      console.warn('🚫 User not authenticated, skipping chat connection');
      return;
    }

    // Check connection state
    const currentState = this.signalrChatService.getConnectionState();
    if (currentState === HubConnectionState.Connected) {
      console.log('✅ ChatHub already connected');
      return;
    }

    console.log('🔄 Starting ChatHub connection from component...');
    await this.signalrChatService.startConnection();
    
    // Verify connection
    setTimeout(() => {
      if (this.signalrChatService.isConnected()) {
        console.log('✅ ChatHub connection verified');
      } else {
        console.warn('⚠️ ChatHub connection may have failed');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to start chat connection:', error);
  }
}

  onChatSelected(chat: Chat): void {
    this.selectedChat = chat;
    if (this.isMobile) {
      setTimeout(() => {
        const sidebar = document.querySelector('.chat-sidebar') as HTMLElement;
        if (sidebar) sidebar.style.display = 'none';
      }, 300);
    }
  }

  onGoBack(): void {
    this.selectedChat = null;
    if (this.isMobile) {
      setTimeout(() => {
        const sidebar = document.querySelector('.chat-sidebar') as HTMLElement;
        if (sidebar) sidebar.style.display = 'block';
      }, 300);
    }
  }
}
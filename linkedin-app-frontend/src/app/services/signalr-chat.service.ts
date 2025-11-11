import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Message, Chat, UserTyping, MessageRead } from '../models/models';
import { AuthService } from './auth.service';

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastActivity: Date | null;
  connectionId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrChatService {
  private hubConnection: HubConnection;
  private connectionUrl = 'https://localhost:7068/chatHub';
  private isStarting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentionalDisconnect = false;
  
  // Observables
  private messageReceived = new Subject<Message>();
  public messageReceived$ = this.messageReceived.asObservable();
  
  private userTyping = new Subject<UserTyping>();
  public userTyping$ = this.userTyping.asObservable();
  
  private messageRead = new Subject<MessageRead>();
  public messageRead$ = this.messageRead.asObservable();

  private userOnlineStatus = new Subject<{userId: number, isOnline: boolean}>();
  public userOnlineStatus$ = this.userOnlineStatus.asObservable();

  private chatCreated = new Subject<Chat>();
  public chatCreated$ = this.chatCreated.asObservable();

  // New Observables
  private userJoinedChat = new Subject<{chatId: number, userId: number, userName: string}>();
  public userJoinedChat$ = this.userJoinedChat.asObservable();

  private userLeftChat = new Subject<{chatId: number, userId: number, userName: string}>();
  public userLeftChat$ = this.userLeftChat.asObservable();

  private messageDeleted = new Subject<{chatId: number, messageId: number}>();
  public messageDeleted$ = this.messageDeleted.asObservable();

   private fileUploadProgress = new Subject<any>();
  public fileUploadProgress$ = this.fileUploadProgress.asObservable();

  private fileUploadCompleted = new Subject<any>();
  public fileUploadCompleted$ = this.fileUploadCompleted.asObservable();

  // Connection state
  private connectionState = new BehaviorSubject<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastActivity: null,
    connectionId: null
  });
  public connectionState$ = this.connectionState.asObservable();

  // Unread counts
  private unreadCounts = new BehaviorSubject<Map<number, number>>(new Map());
  public unreadCounts$ = this.unreadCounts.asObservable();

  // Online users
  private onlineUsers = new BehaviorSubject<Set<number>>(new Set());
  public onlineUsers$ = this.onlineUsers.asObservable();

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.hubConnection = this.createHubConnection();
    this.loadUnreadCountsFromStorage();
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Reconnect when browser tab becomes active
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !this.isConnected() && !this.isConnecting()) {
          console.log('🔄 Tab became visible, attempting reconnect...');
          this.startConnection();
        }
      });

      // Reconnect when online
      window.addEventListener('online', () => {
        if (!this.isConnected() && !this.isConnecting()) {
          console.log('🔄 Network online, attempting reconnect...');
          this.startConnection();
        }
      });
    }
  }

 private createHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(this.connectionUrl, {
      accessTokenFactory: () => {
        const token = this.authService.getAuthToken();
        console.log('🔑 ChatHub - Using token:', token ? 'Yes' : 'No');
        return token || '';
      },
      withCredentials: true, // Change this to true
      skipNegotiation: false, // Change this to false
      transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
          return null;
        }
        const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        return delay;
      }
    })
    .configureLogging(LogLevel.Warning) // Reduce log level for production
    .build();
}

  public async startConnection(): Promise<void> {
  if (!isPlatformBrowser(this.platformId) || this.isIntentionalDisconnect) {
    return;
  }

  if (this.isStarting) {
    return;
  }

  const currentState = this.hubConnection.state;
  if (currentState === HubConnectionState.Connected || currentState === HubConnectionState.Connecting) {
    return;
  }

  this.isStarting = true;
  
  try {
    console.log(`🔄 Starting ChatHub connection...`);
    await this.hubConnection.start();
    console.log('✅ ChatHub connected successfully');
    
    this.reconnectAttempts = 0;
    this.updateConnectionState({ 
      isConnected: true,
      lastActivity: new Date(),
      connectionId: this.hubConnection.connectionId
    });
    
    this.registerSignalREvents();
    
    // Test connection with ping
    await this.testConnection();
    
  } catch (error) {
    console.error('❌ ChatHub connection failed:', error);
    await this.handleConnectionError(error);
  } finally {
    this.isStarting = false;
  }
}
private async testConnection(): Promise<void> {
  try {
    await this.hubConnection.invoke('Ping');
    console.log('✅ ChatHub ping successful');
  } catch (error) {
    console.error('❌ ChatHub ping failed:', error);
  }
}

  private async delayedNotifyUserOnline(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (this.isConnected()) {
      try {
        await this.hubConnection.invoke('UserOnline');
        console.log('✅ User online status notified');
      } catch (error) {
        if (!this.isConnectionClosedError(error)) {
          console.warn('⚠️ User online notify failed:', error);
        }
      }
    }
  }

  private isConnectionClosedError(error: any): boolean {
    return error?.message?.includes('Connection closed') || 
           error?.message?.includes('Server returned an error on close') ||
           error?.message?.includes('WebSocket closed');
  }

  private registerSignalREvents(): void {
    // Remove existing handlers to prevent duplicates
    this.hubConnection.off('ReceiveMessage');
    this.hubConnection.off('UserTyping');
    this.hubConnection.off('MessageRead');
    this.hubConnection.off('UpdateUnreadCount');
    this.hubConnection.off('UserOnlineStatus');
    this.hubConnection.off('ChatCreated');
    this.hubConnection.off('UserJoinedChat');
    this.hubConnection.off('UserLeftChat');
    this.hubConnection.off('MessageDeleted');

    // Message events
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      console.log('📨 Message received for chat:', message.chatId);
      this.messageReceived.next(message);
      this.updateConnectionState({ lastActivity: new Date() });
      
      if (message.senderId !== this.authService.getCurrentUserId()) {
        this.incrementUnreadCount(message.chatId);
      }
    });

    this.hubConnection.on('UserTyping', (data: UserTyping) => {
      console.log('⌨️ Typing indicator:', data);
      this.userTyping.next(data);
    });

    this.hubConnection.on('MessageRead', (data: MessageRead) => {
      console.log('👀 Message read receipt:', data);
      this.messageRead.next(data);
    });

    this.hubConnection.on('MessageDeleted', (data: {chatId: number, messageId: number}) => {
      console.log('🗑️ Message deleted:', data);
      this.messageDeleted.next(data);
    });

    // Chat events
    this.hubConnection.on('UpdateUnreadCount', (data: {chatId: number, count: number}) => {
      console.log('🔔 Unread count update:', data);
      this.updateUnreadCount(data.chatId, data.count);
    });

    this.hubConnection.on('UserOnlineStatus', (data: {userId: number, isOnline: boolean}) => {
      console.log('🔵 User online status:', data);
      this.updateOnlineUsers(data.userId, data.isOnline);
      this.userOnlineStatus.next(data);
    });

    this.hubConnection.on('ChatCreated', (chat: Chat) => {
      console.log('💬 New chat created:', chat.id);
      this.chatCreated.next(chat);
    });

    this.hubConnection.on('UserJoinedChat', (data: {chatId: number, userId: number, userName: string}) => {
      console.log('👤 User joined chat:', data);
      this.userJoinedChat.next(data);
    });

    this.hubConnection.on('UserLeftChat', (data: {chatId: number, userId: number, userName: string}) => {
      console.log('👤 User left chat:', data);
      this.userLeftChat.next(data);
    });

    // Connection events
    this.hubConnection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting...', error?.message);
      this.updateConnectionState({ 
        isConnected: false, 
        isReconnecting: true,
        connectionId: null
      });
    });

    this.hubConnection.on('FileUploadProgress', (data: any) => {
      this.fileUploadProgress.next(data);
    });

    this.hubConnection.on('FileUploadCompleted', (data: any) => {
      this.fileUploadCompleted.next(data);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected. Connection ID:', connectionId);
      this.reconnectAttempts = 0;
      this.updateConnectionState({ 
        isConnected: true, 
        isReconnecting: false,
        lastActivity: new Date(),
        connectionId
      });
      this.delayedNotifyUserOnline();
    });

    this.hubConnection.onclose((error) => {
      console.log('🔴 SignalR connection closed', error?.message);
      this.updateConnectionState({ 
        isConnected: false, 
        isReconnecting: false,
        connectionId: null
      });
      
      if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(5000 * (this.reconnectAttempts + 1), 30000);
        console.log(`⏳ Will attempt reconnect in ${delay}ms`);
        setTimeout(() => {
          if (!this.isIntentionalDisconnect) {
            this.startConnection();
          }
        }, delay);
      }
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    const currentState = this.connectionState.value;
    this.connectionState.next({ ...currentState, ...updates });
  }

  private updateOnlineUsers(userId: number, isOnline: boolean): void {
    const currentOnlineUsers = new Set(this.onlineUsers.value);
    if (isOnline) {
      currentOnlineUsers.add(userId);
    } else {
      currentOnlineUsers.delete(userId);
    }
    this.onlineUsers.next(currentOnlineUsers);
  }

  // Hub method invocations
  public async joinChat(chatId: number): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Cannot join chat - not connected');
      return false;
    }

    try {
      await this.hubConnection.invoke('JoinChat', chatId);
      console.log(`✅ Joined chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Error joining chat:', error);
      return false;
    }
  }

  public async sendMessage(chatId: number, message: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Cannot send message - not connected');
      return false;
    }

    try {
      await this.hubConnection.invoke('SendMessage', chatId, message);
      this.updateConnectionState({ lastActivity: new Date() });
      console.log(`✅ Message sent to chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Error sending message via SignalR:', error);
      return false;
    }
  }

  public async sendTypingIndicator(chatId: number, isTyping: boolean): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      await this.hubConnection.invoke('Typing', chatId, isTyping);
      return true;
    } catch (error) {
      if (!this.isConnectionClosedError(error)) {
        console.error('Error sending typing indicator:', error);
      }
      return false;
    }
  }

  public async markAsRead(chatId: number, messageId: number): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      await this.hubConnection.invoke('MarkAsRead', chatId, messageId);
      this.updateUnreadCount(chatId, 0);
      console.log(`✅ Marked message ${messageId} as read in chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // New methods for enhanced features
  public async addParticipant(chatId: number, participantId: number): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      await this.hubConnection.invoke('AddParticipant', chatId, participantId);
      console.log(`✅ Added participant ${participantId} to chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Add participant failed:', error);
      return false;
    }
  }

  public async removeParticipant(chatId: number, participantId: number): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      await this.hubConnection.invoke('RemoveParticipant', chatId, participantId);
      console.log(`✅ Removed participant ${participantId} from chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Remove participant failed:', error);
      return false;
    }
  }

  public async deleteMessage(chatId: number, messageId: number): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      await this.hubConnection.invoke('DeleteMessage', chatId, messageId);
      console.log(`✅ Deleted message ${messageId} from chat ${chatId}`);
      return true;
    } catch (error) {
      console.error('Delete message failed:', error);
      return false;
    }
  }

  // Unread count management
  private loadUnreadCountsFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const stored = localStorage.getItem('chat_unread_counts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.unreadCounts.next(new Map(parsed));
          console.log('✅ Loaded unread counts from storage');
        }
      }
    } catch (error) {
      console.error('Error loading unread counts from storage:', error);
      localStorage.removeItem('chat_unread_counts');
    }
  }

  private saveUnreadCountsToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const countsArray = Array.from(this.unreadCounts.value.entries());
      localStorage.setItem('chat_unread_counts', JSON.stringify(countsArray));
    } catch (error) {
      console.error('Error saving unread counts to storage:', error);
    }
  }

  private incrementUnreadCount(chatId: number): void {
    const currentCounts = new Map(this.unreadCounts.value);
    currentCounts.set(chatId, (currentCounts.get(chatId) || 0) + 1);
    this.unreadCounts.next(currentCounts);
    this.saveUnreadCountsToStorage();
  }

  public updateUnreadCount(chatId: number, count: number): void {
    const currentCounts = new Map(this.unreadCounts.value);
    currentCounts.set(chatId, count);
    this.unreadCounts.next(currentCounts);
    this.saveUnreadCountsToStorage();
  }

  public getUnreadCount(chatId: number): number {
    return this.unreadCounts.value.get(chatId) || 0;
  }

  public getTotalUnreadCount(): number {
    return Array.from(this.unreadCounts.value.values()).reduce((total, count) => total + count, 0);
  }

  public resetUnreadCount(chatId: number): void {
    this.updateUnreadCount(chatId, 0);
  }

  public isUserOnline(userId: number): boolean {
    return this.onlineUsers.value.has(userId);
  }

  // Connection state helpers
  public getConnectionState(): HubConnectionState {
    return this.hubConnection.state;
  }

  public isConnected(): boolean {
    return this.hubConnection.state === HubConnectionState.Connected;
  }

  public isConnecting(): boolean {
    return this.hubConnection.state === HubConnectionState.Connecting || this.isStarting;
  }

  public getConnectionStats() {
    return {
      state: this.hubConnection.state,
      connectionId: this.hubConnection.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      lastActivity: this.connectionState.value.lastActivity,
      onlineUsers: this.onlineUsers.value.size,
      unreadChats: this.unreadCounts.value.size
    };
  }

  private async handleConnectionError(error: any): Promise<void> {
    if (!this.isConnectionClosedError(error)) {
      this.reconnectAttempts++;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isIntentionalDisconnect) {
      const delay = Math.min(5000 * this.reconnectAttempts, 30000);
      console.log(`⏳ Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
      setTimeout(() => this.startConnection(), delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🚫 Max reconnection attempts reached');
    }
  }

  public async disconnect(): Promise<void> {
    this.isIntentionalDisconnect = true;
    
    try {
      if (this.isConnected()) {
        // Try to notify offline status, but don't block on it
        this.hubConnection.invoke('UserOffline').catch(error => {
          if (!this.isConnectionClosedError(error)) {
            console.error('Error notifying user offline:', error);
          }
        });
        
        await this.hubConnection.stop();
        console.log('✅ SignalR disconnected successfully');
      }
    } catch (error) {
      if (!this.isConnectionClosedError(error)) {
        console.error('Error during disconnect:', error);
      }
    } finally {
      this.updateConnectionState({ 
        isConnected: false, 
        isReconnecting: false,
        connectionId: null
      });
      this.reconnectAttempts = 0;
      this.isIntentionalDisconnect = false;
    }
  }

   public reportFileUploadProgress(uploadId: string, bytesUploaded: number, totalBytes: number, fileName: string): Promise<boolean> {
    if (!this.isConnected()) return Promise.resolve(false);
    
    return this.hubConnection.invoke('FileUploadProgress', uploadId, bytesUploaded, totalBytes, fileName)
      .then(() => true)
      .catch(error => {
        console.error('Error reporting file upload progress:', error);
        return false;
      });
  }

  public reportFileUploadCompleted(uploadId: string, fileName: string, fileUrl: string, fileType: string): Promise<boolean> {
    if (!this.isConnected()) return Promise.resolve(false);
    
    return this.hubConnection.invoke('FileUploadCompleted', uploadId, fileName, fileUrl, fileType)
      .then(() => true)
      .catch(error => {
        console.error('Error reporting file upload completed:', error);
        return false;
      });
  }

}
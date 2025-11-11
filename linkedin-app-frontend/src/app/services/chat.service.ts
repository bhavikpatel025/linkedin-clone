import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  ApiResponse, 
  Chat, 
  Message, 
  CreateMessage, 
  CreateChat,
   FileUploadResponse
} from '../models/models';
import { FileUploadService } from './file-upload.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'https://localhost:7068/api/chat';
   public searchSubject = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private fileUploadService: FileUploadService
  ) { }

  // Chat endpoints
  createChat(createChatData: CreateChat): Observable<ApiResponse<Chat>> {
    return this.http.post<ApiResponse<Chat>>(`${this.baseUrl}`, createChatData);
  }

  getUserChats(): Observable<ApiResponse<Chat[]>> {
    return this.http.get<ApiResponse<Chat[]>>(`${this.baseUrl}`);
  }

  getChat(chatId: number): Observable<ApiResponse<Chat>> {
    return this.http.get<ApiResponse<Chat>>(`${this.baseUrl}/${chatId}`);
  }

  getChatMessages(chatId: number,number = 1, pageSize: number = 50): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.baseUrl}/${chatId}/messages`);
  }

   // FIXED: Change 'attachments' to 'files'
sendMessage(createMessageData: CreateMessage): Observable<ApiResponse<Message>> {
  // If there are files, use FormData
  if (createMessageData.files && createMessageData.files.length > 0) {
    const formData = this.createMessageFormData(createMessageData);
    return this.http.post<ApiResponse<Message>>(`${this.baseUrl}/message-with-files`, formData);
  } else {
    // Regular text message - send as JSON
    return this.http.post<ApiResponse<Message>>(`${this.baseUrl}/message`, createMessageData);
  }
}
private createMessageFormData(messageData: CreateMessage): FormData {
  const formData = new FormData();
  
  // Add basic message data as JSON string
  const messagePayload = {
    chatId: messageData.chatId,
    content: messageData.content,
    messageType: messageData.messageType,
    replyToMessageId: messageData.replyTo
  };
  
  formData.append('messageData', JSON.stringify(messagePayload));
  
  // Add files
  if (messageData.files && messageData.files.length > 0) {
    messageData.files.forEach((file: File, index: number) => {
      formData.append('files', file, file.name);
    });
  }
  
  return formData;
}

// NEW: Helper to create FormData for file upload
private createFormData(messageData: any): FormData {
  const formData = new FormData();
  
  // Add basic message data
  formData.append('ChatId', messageData.chatId.toString());
  formData.append('Content', messageData.content);
  formData.append('MessageType', messageData.messageType);
  
  // Add files
  if (messageData.files && messageData.files.length > 0) {
    messageData.files.forEach((file: File, index: number) => {
      formData.append(`Files`, file, file.name);
    });
  }
  
  return formData;
}

  private generateFileMessage(files: FileUploadResponse[]): string {
    if (files.length === 1) {
      return `[${files[0].fileType?.toUpperCase()} file]`;
    } else {
      return `[${files.length} files]`;
    }
  }

   private determineMessageType(files: FileUploadResponse[]): string {
    if (files.length === 1) {
      return files[0].fileType || 'file';
    } else {
      const types = new Set(files.map(f => f.fileType));
      return types.size === 1 ? Array.from(types)[0]! : 'files';
    }
  }


  markMessageAsRead(messageId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/message/${messageId}/read`, {});
  }

  markAllMessagesAsRead(chatId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/${chatId}/read-all`, {});
  }

    uploadFile(file: File, chatId?: number): Observable<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (chatId) {
      formData.append('chatId', chatId.toString());
    }

    return this.http.post<ApiResponse<FileUploadResponse>>(`${this.baseUrl}/upload-file`, formData);
  }

  // NEW: Upload multiple files
  uploadFiles(files: File[], chatId?: number): Observable<ApiResponse<FileUploadResponse[]>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (chatId) {
      formData.append('chatId', chatId.toString());
    }

    return this.http.post<ApiResponse<FileUploadResponse[]>>(`${this.baseUrl}/upload-files`, formData);
  }
}
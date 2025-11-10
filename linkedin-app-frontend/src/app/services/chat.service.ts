import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  ApiResponse, 
  Chat, 
  Message, 
  CreateMessage, 
  CreateChat 
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'https://localhost:7068/api/chat';
   public searchSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) { }

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

  sendMessage(createMessageData: CreateMessage): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.baseUrl}/message`, createMessageData);
  }

  markMessageAsRead(messageId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/message/${messageId}/read`, {});
  }

  markAllMessagesAsRead(chatId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/${chatId}/read-all`, {});
  }
}
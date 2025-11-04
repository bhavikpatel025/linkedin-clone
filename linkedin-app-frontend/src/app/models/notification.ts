export interface Notification {
  id: number;
  userId: number;
  senderId: number | null; 
   senderName?: string; 
  title: string;
  message: string;
  type: string;
  relatedEntityId?: number;
  isRead: boolean;
  createdDate: string;
  timeAgo: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification[];
   errors: string[];
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: number;
   errors: string[];
}
export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data: boolean;
  errors: string[];
}

export interface CreateNotification {
  userId: number;          
  senderId: number;        
  title: string;
  message: string;
  type: string;
  relatedEntityId?: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
  data: boolean;
  errors: string[];
}

export interface DeleteAllNotificationsResponse {
  success: boolean;
  message: string;
  data: boolean;
  errors: string[];
}
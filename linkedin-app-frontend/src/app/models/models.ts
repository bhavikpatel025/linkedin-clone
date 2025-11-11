export interface User {
  id: number;
  name: string;
  gender: string;
  email: string;
  phoneNumber: string;
  roleId: number;
  roleName: string;
  profilePicture?: string;
  location?: string; 
  bio?: string; 
  createdDate: string;
  skills: Skill[];
}

export interface UserUpdate {
  id: number;
  name?: string;
  gender?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  profilePicture?: File;
}

export interface ProfilePictureUpdate {
  userId: number;
  profilePicture: File;
}

export interface UserRegistration {
  name: string;
  gender: string;
  password: string;
  email: string;
  phoneNumber: string;
  roleId: number;
  skillIds: number[];
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Skill {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  userId: number;
  userName: string;
  userProfilePicture?: string;
  description: string;
  photoPath?: string;
  createdDate: string;
  updatedDate?: string;
  likesCount: number;
  isSavedByCurrentUser?: boolean;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  comments: Comment[];
}

export interface PostCreate {
  description: string;
  photo?: File;
  userId: number;
}

export interface PostUpdate {
  id: number;
  description: string;
  photo?: File;
  existingPhotoPath?: string;
}

export interface SavedPost {
  id: number;
  userId: number;
  postId: number;
  savedAt: string;
  post?: Post;
}

export interface SavePostResult {
  id: number;
  userId: number;
  postId: number;
  savedAt: string;
}

export interface SavePostRequest {
  userId: number;
  postId: number;
}

export interface SavedPostResponse {
  success: boolean;
  message: string;
  data?: SavedPost;
  errors: string[];
}

export interface UserSavedPostsResponse {
  success: boolean;
  message: string;
  data?: SavedPost[];
  errors: string[];
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  userName: string;
  userProfilePicture?: string;
  content: string;
  createdDate: string;
  canDelete?: boolean;
  replies?: Reply[]; 
  showReplies?: boolean; 
  showReplyForm?: boolean;
}

export interface CommentCreate {
  content: string;
  postId: number;
  userId: number;
}

export interface Like {
  postId: number;
  userId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  profilePicture?: string;
}

export interface Connection {
  id: number;
  senderId: number;
  receiverId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdDate: string;
  updatedDate: string;
  sender?: User;
  receiver?: User;
}

export interface ConnectionRequest {
  senderId: number;
  receiverId: number;
}

export interface ConnectionResponse {
  connectionId: number;
  status: 'accepted' | 'rejected';
}

export interface UserConnection {
  id: number;
  connectionId: number;
  name: string;
  roleName: string;
  profilePicture?: string;
  avatar?: string;
  location?: string;
  connectionDate: string;
  mutualConnections: number;
  headline?: string;
  industry?: string;
}

export interface Reply {
  id: number;
  content: string;
  createdDate: string;
  commentId: number;
  userId: number;
  userName: string;
  userProfilePicture?: string;
  canDelete?: boolean;
}

export interface ReplyCreate {
  content: string;
  commentId: number;
  userId: number;
}

export interface ReplyDeleteResponse {
  success: boolean;
  message: string;
  data?: boolean;
  errors?: string[];
}

// Enhanced Chat Interfaces
export interface Chat {
  id: number;
  type: 'direct' | 'group';
  groupName?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: ChatParticipant[];
  isOnline?: boolean;
  lastSeen?: string;
  isMuted?: boolean;
  isArchived?: boolean;
  groupDescription?: string;
  groupImage?: string;
}

export interface ChatParticipant {
  userId: number;
  userName: string;
  profilePicture?: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
  joinedAt?: string;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  senderName?: string;
  senderProfilePicture?: string;
  content: string;
   messageType: 'text' | 'image' | 'file' | 'system' | 'video' | 'audio'; // UPDATED
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  reactions?: MessageReaction[];
  replyTo?: number;
  isEdited?: boolean;
  editedAt?: string;
  replyToMessage?: Message;
  attachments?: MessageAttachment[];
    filePath?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  thumbnailPath?: string;
}

export interface MessageAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
   mimeType?: string; // NEW
  duration?: number; // NEW for audio/video
  width?: number; // NEW for images/videos
  height?: number;
}

export interface MessageReaction {
  userId: number;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface UserTyping {
  chatId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface MessageRead {
  chatId: number;
  messageId: number;
  userId: number;
  readAt: string;
}

export interface CreateMessage {
  chatId: number;
  content: string;
  messageType: string;
  replyTo?: number;
   attachments?: File[]; // NEW: For file uploads
  files?: File[]; 
}

export interface FileUploadProgress {
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  uploadId: string;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// NEW: File upload response
export interface FileUploadResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
}

export interface CreateChat {
  participantIds: number[];
  groupName?: string;
  type: 'direct' | 'group';
  groupDescription?: string;
  groupImage?: string;
}

export interface ChatAction {
  chatId: number;
  action: 'mute' | 'unmute' | 'archive' | 'unarchive';
  value: boolean;
}
export interface CommentDeleteResponse {
  success: boolean;
  message: string;
  data?: boolean;
  errors?: string[];
}



export interface ChatParticipantAction {
  chatId: number;
  participantId: number;
  action: 'add' | 'remove';
}

export interface ChatSearch {
  query?: string;
  type?: 'direct' | 'group';
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}
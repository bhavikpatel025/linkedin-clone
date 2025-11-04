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
// headline: any;
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

// export interface CommentDto {
//   id: number;
//   content: string;
//   createdDate: string;
//   userId: number;
//   userName: string;
//   canDelete?: boolean; 
// }

export interface CommentDeleteResponse {
  success: boolean;
  message: string;
  data?: boolean;
  errors?: string[];
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
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApiResponse, 
  User, 
  UserRegistration, 
  UserLogin, 
  Role, 
  Skill, 
  Post, 
  PostCreate, 
  PostUpdate, 
  Comment, 
  CommentCreate, 
  Like, 
  CommentDeleteResponse,
  ReplyCreate,
  Reply,
  ReplyDeleteResponse,
  UserUpdate,
  ProfilePictureUpdate,
  SavePostRequest,
  SavedPostResponse,
  UserSavedPostsResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://localhost:7068/api'; 

  constructor(private http: HttpClient) { }

  // User endpoints
    login(loginData: UserLogin): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/login`, loginData);
  }

  register(userData: UserRegistration): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/register`, userData);
  }

  forgotPassword(email: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  verifyResetToken(token: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/auth/verify-reset-token/${token}`);
  }

  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/users/roles`);
  }

  getSkills(): Observable<ApiResponse<Skill[]>> {
    return this.http.get<ApiResponse<Skill[]>>(`${this.baseUrl}/users/skills`);
  }

  getUserById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`);
  }

  //  Profile Picture Methods 
  updateProfilePicture(updateData: ProfilePictureUpdate): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('userId', updateData.userId.toString());
    formData.append('profilePicture', updateData.profilePicture);
    
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/upload-profile-picture`, formData);
  }

  updateUser(userData: UserUpdate): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('id', userData.id.toString());
    
    if (userData.name) formData.append('name', userData.name);
    if (userData.gender) formData.append('gender', userData.gender);
    if (userData.phoneNumber) formData.append('phoneNumber', userData.phoneNumber);
    if (userData.location) formData.append('location', userData.location);
    if (userData.bio) formData.append('bio', userData.bio);
    if (userData.profilePicture) formData.append('profilePicture', userData.profilePicture);
    
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${userData.id}`, formData);
  }

  deleteProfilePicture(userId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/users/${userId}/profile-picture`);
  }

  // Post endpoints
  getAllPosts(currentUserId: number = 0): Observable<ApiResponse<Post[]>> {
    const params = new HttpParams().set('currentUserId', currentUserId.toString());
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/posts`, { params });
  }

  getPostById(id: number, currentUserId: number = 0): Observable<ApiResponse<Post>> {
    const params = new HttpParams().set('currentUserId', currentUserId.toString());
    return this.http.get<ApiResponse<Post>>(`${this.baseUrl}/posts/${id}`, { params });
  }

  getUserPosts(userId: number, currentUserId: number = 0): Observable<ApiResponse<Post[]>> {
    const params = new HttpParams().set('currentUserId', currentUserId.toString());
    return this.http.get<ApiResponse<Post[]>>(`${this.baseUrl}/posts/user/${userId}`, { params });
  }

  createPost(postData: PostCreate): Observable<ApiResponse<Post>> {
    const formData = new FormData();
    formData.append('description', postData.description);
    formData.append('userId', postData.userId.toString());
    if (postData.photo) {
      formData.append('photo', postData.photo);
    }
    
    return this.http.post<ApiResponse<Post>>(`${this.baseUrl}/posts`, formData);
  }

  updatePost(postData: PostUpdate): Observable<ApiResponse<Post>> {
    const formData = new FormData();
    formData.append('id', postData.id.toString());
    formData.append('description', postData.description);
    if (postData.photo) {
      formData.append('photo', postData.photo);
    }
    if (postData.existingPhotoPath) {
      formData.append('existingPhotoPath', postData.existingPhotoPath);
    }
    
    return this.http.put<ApiResponse<Post>>(`${this.baseUrl}/posts/${postData.id}`, formData);
  }

  deletePost(postId: number, userId: number): Observable<ApiResponse<boolean>> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/posts/${postId}`, { params });
  }

   savePost(saveData: SavePostRequest): Observable<SavedPostResponse> {
    return this.http.post<SavedPostResponse>(`${this.baseUrl}/posts/save`, saveData);
  }

  unsavePost(userId: number, postId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/posts/unsave/${userId}/${postId}`);
  }

  getUserSavedPosts(userId: number): Observable<UserSavedPostsResponse> {
    return this.http.get<UserSavedPostsResponse>(`${this.baseUrl}/posts/saved/${userId}`);
  }

  isPostSaved(userId: number, postId: number): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/posts/is-saved/${userId}/${postId}`);
  }

  toggleLike(likeData: Like): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/posts/like`, likeData);
  }

  addComment(commentData: CommentCreate): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${this.baseUrl}/posts/comment`, commentData);
  }

  addReply(replyData: ReplyCreate): Observable<ApiResponse<Reply>> {
    return this.http.post<ApiResponse<Reply>>(`${this.baseUrl}/replies`, replyData);
  }

  deleteReply(replyId: number, userId: number): Observable<ReplyDeleteResponse> {
    return this.http.delete<ReplyDeleteResponse>(
      `${this.baseUrl}/replies/${replyId}?userId=${userId}`
    );
  }

  getRepliesByCommentId(commentId: number): Observable<ApiResponse<Reply[]>> {
    return this.http.get<ApiResponse<Reply[]>>(
      `${this.baseUrl}/replies/comment/${commentId}`
    );
  }
  
  deleteComment(commentId: number, userId: number): Observable<CommentDeleteResponse> {
    return this.http.delete<CommentDeleteResponse>(
      `${this.baseUrl}/comments/${commentId}?userId=${userId}`
    );
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a relative path from backend
    if (imagePath.startsWith('/uploads/')) {
      return `https://localhost:7068${imagePath}`; 
    }
    
    // Default case
    return imagePath;
  }
}
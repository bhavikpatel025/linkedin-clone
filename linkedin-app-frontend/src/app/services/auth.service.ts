import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CurrentUser } from '../models/models';
import { ApiService } from './api.service'; // ADD THIS IMPORT

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<CurrentUser | null>;
  public currentUser: Observable<CurrentUser | null>;

  constructor(private apiService: ApiService) { // ADD ApiService TO CONSTRUCTOR
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<CurrentUser | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  //  ADD THESE NEW METHODS
  forgotPassword(email: string): Observable<any> {
    return this.apiService.forgotPassword(email);
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.resetPassword(token, newPassword);
  }

  verifyResetToken(token: string): Observable<any> {
    return this.apiService.verifyResetToken(token);
  }

  //  UPDATE EXISTING METHODS TO HANDLE JWT TOKENS
  login(loginData: any): Observable<any> {
    return this.apiService.login(loginData).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Store JWT token
          localStorage.setItem('auth_token', response.data.token);
          // Store user data
          this.setCurrentUser(response.data.user);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.apiService.register(userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Store JWT token
          localStorage.setItem('auth_token', response.data.token);
          // Store user data
          this.setCurrentUser(response.data.user);
        }
      })
    );
  }

  //  ADD METHOD TO GET AUTH TOKEN
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  //  UPDATE LOGOUT TO CLEAR TOKEN
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token'); // ADD THIS
    this.currentUserSubject.next(null);
  }

  // KEEP ALL YOUR EXISTING METHODS AS THEY ARE
  setCurrentUser(user: CurrentUser): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUserId(): number {
    const user = this.currentUserValue;
    return user ? user.id : 0;
  }

  getCurrentUserName(): string {
    const user = this.currentUserValue;
    return user?.name || user?.email?.split('@')[0] || 'User';
  }

  getCurrentUserFullName(): string {
    const user = this.currentUserValue;
    if (user) {
      return user.name || 
             (user as any).fullName || 
             (user as any).firstName || 
             user.email?.split('@')[0] || 
             'User';
    }
    return 'User';
  }

  isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }
}
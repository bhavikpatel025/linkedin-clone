import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Skip interception for auth requests
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // Get token from localStorage
  const authToken = localStorage.getItem('auth_token');

  // Clone request and add authorization header
  const authReq = authToken 
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      })
    : req;

  console.log('🔐 AuthInterceptor: Processing request to', req.url);

  return next(authReq).pipe(
    catchError((error) => {
      console.log('🚨 AuthInterceptor: HTTP error', error.status);
      
      if (error.status === 401) {
        console.log('🔒 AuthInterceptor: 401 Unauthorized - Redirecting to login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};
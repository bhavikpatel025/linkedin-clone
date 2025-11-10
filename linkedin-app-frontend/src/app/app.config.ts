import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { ConnectionService } from './services/connection.service';
import { NotificationService } from './services/notification.service';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient( withInterceptors([authInterceptor])), // enables HTTP requests
    ApiService,
    AuthService,
    ConnectionService,
    NotificationService
  ]
};
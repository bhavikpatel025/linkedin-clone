import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { ConnectionService } from './services/connection.service';
import { NotificationService } from './services/notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(), // enables HTTP requests
    ApiService,
    AuthService,
    ConnectionService,
    NotificationService // ADD THIS
  ]
};
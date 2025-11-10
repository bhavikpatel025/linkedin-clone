import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'forgot-password', 
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'network',
    loadComponent: () => import('./components/network/network.component').then(c => c.NetworkComponent),
    canActivate: [authGuard]
  },
  {
  path: 'notifications',
  loadComponent: () => import('./components/notifications/notifications.component').then(c => c.NotificationsComponent),
  canActivate: [authGuard]
},
  {
    path: 'create-post',
    loadComponent: () => import('./components/create-post/create-post.component').then(c => c.CreatePostComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit-post/:id',
    loadComponent: () => import('./components/edit-post/edit-post.component').then(c => c.EditPostComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./components/profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [authGuard]
  },
   {
    path: 'saved-posts',
    loadComponent: () => import('./components/saved-posts/saved-posts.component').then(c => c.SavedPostsComponent),
    canActivate: [authGuard]
  },
  {
  path: 'chat',
  loadComponent: () => import('./components/chat/chat.component').then(c => c.ChatComponent),
  canActivate: [authGuard]
},
{
  path: 'chat/new',
  loadComponent: () => import('./components/new-chat/new-chat.component').then(c => c.NewChatComponent),
  canActivate: [authGuard]
},
  {
    path: '**',
    redirectTo: '/login'
  }
];
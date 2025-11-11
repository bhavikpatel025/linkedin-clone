// services/file-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { FileUploadProgress, FileUploadResponse } from '../models/models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'https://localhost:7068/api/chat';

  // Progress tracking
  private uploadProgress = new BehaviorSubject<Map<string, FileUploadProgress>>(new Map());
  public uploadProgress$ = this.uploadProgress.asObservable();

  // Upload completion
  private uploadComplete = new Subject<{uploadId: string, response: FileUploadResponse}>();
  public uploadComplete$ = this.uploadComplete.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  // Upload single file
  uploadFile(file: File, chatId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (chatId) {
      formData.append('chatId', chatId.toString());
    }

    const uploadId = this.generateUploadId(file);
    
    // Create custom request to track progress
    const req = new HttpRequest('POST', `${this.baseUrl}/upload-file`, formData, {
      reportProgress: true,
    });

    return new Observable(observer => {
      this.http.request(req).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = {
              fileName: file.name,
              bytesUploaded: event.loaded,
              totalBytes: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
              uploadId: uploadId,
              status: 'uploading' as const
            };
            this.updateProgress(uploadId, progress);
          } else if (event instanceof HttpResponse) {
            const response = event.body as FileUploadResponse;
            if (response.success) {
              const progress = {
                fileName: file.name,
                bytesUploaded: file.size,
                totalBytes: file.size,
                percentage: 100,
                uploadId: uploadId,
                status: 'completed' as const
              };
              this.updateProgress(uploadId, progress);
              this.uploadComplete.next({ uploadId, response });
            } else {
              const progress = {
                fileName: file.name,
                bytesUploaded: 0,
                totalBytes: file.size,
                percentage: 0,
                uploadId: uploadId,
                status: 'error' as const,
                error: response.message
              };
              this.updateProgress(uploadId, progress);
            }
            observer.next(event.body);
            observer.complete();
          }
        },
        error: (error) => {
          const progress = {
            fileName: file.name,
            bytesUploaded: 0,
            totalBytes: file.size,
            percentage: 0,
            uploadId: uploadId,
            status: 'error' as const,
            error: error.message
          };
          this.updateProgress(uploadId, progress);
          observer.error(error);
        }
      });
    });
  }

  // Upload multiple files
  uploadFiles(files: File[], chatId?: number): Observable<any> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (chatId) {
      formData.append('chatId', chatId.toString());
    }

    return this.http.post(`${this.baseUrl}/upload-files`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // Get file type
  getFileType(file: File): string {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      default:
        if (file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
          return 'document';
        }
        return 'file';
    }
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is image
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Check if file is video
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  // Check if file is audio
  isAudioFile(file: File): boolean {
    return file.type.startsWith('audio/');
  }

  // Generate preview URL for images/videos
  generatePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e: any) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (this.isVideoFile(file)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL());
          } else {
            resolve('');
          }
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      } else {
        resolve('');
      }
    });
  }

  // Validate file
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
    const allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    const fileType = file.type;
    if (!fileType) {
      return { valid: true }; // Allow files without type
    }

    const isAllowedType = 
      allowedImageTypes.includes(fileType) ||
      allowedVideoTypes.includes(fileType) ||
      allowedAudioTypes.includes(fileType) ||
      allowedDocumentTypes.includes(fileType) ||
      fileType === 'application/octet-stream';

    if (!isAllowedType) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  // Private methods
  private generateUploadId(file: File): string {
    return `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateProgress(uploadId: string, progress: FileUploadProgress): void {
    const currentProgress = new Map(this.uploadProgress.value);
    currentProgress.set(uploadId, progress);
    this.uploadProgress.next(currentProgress);
  }

  // Clear progress
  clearProgress(uploadId: string): void {
    const currentProgress = new Map(this.uploadProgress.value);
    currentProgress.delete(uploadId);
    this.uploadProgress.next(currentProgress);
  }

  // Get progress for specific file
  getProgress(uploadId: string): FileUploadProgress | undefined {
    return this.uploadProgress.value.get(uploadId);
  }
}
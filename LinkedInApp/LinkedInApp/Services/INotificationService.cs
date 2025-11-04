using LinkedInApp.DTOs;
using LinkedInApp.Models;

namespace LinkedInApp.Services
{
    public interface INotificationService
    {
        Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId);
        Task<ApiResponse<NotificationDto>> CreateNotification(NotificationCreateDto notificationDto);
        Task<ApiResponse<bool>> MarkAsRead(int notificationId, int userId);
        Task<ApiResponse<bool>> MarkAllAsRead(int userId);
        Task<ApiResponse<int>> GetUnreadCount(int userId);
        Task<ApiResponse<bool>> DeleteNotification(int notificationId, int userId);
        Task<ApiResponse<bool>> DeleteAllNotifications(int userId);
    }
}
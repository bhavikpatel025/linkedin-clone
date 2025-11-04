using AutoMapper;
using LinkedInApp.Data;
using LinkedInApp.DTOs;
using LinkedInApp.Hubs;
using LinkedInApp.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Services
{
    

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            ApplicationDbContext context,
            IMapper mapper,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        public async Task<ApiResponse<List<NotificationDto>>> GetUserNotifications(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .Include(n => n.Sender)
                    .OrderByDescending(n => n.CreatedDate)
                    .Take(50)
                    .ToListAsync();

                var notificationDtos = notifications.Select(n =>
                {
                    var dto = _mapper.Map<NotificationDto>(n);
                    dto.SenderName = n.Sender?.Name ?? "Unknown User";
                    dto.TimeAgo = GetTimeAgo(n.CreatedDate);
                    return dto;
                }).ToList();

                return new ApiResponse<List<NotificationDto>>
                {
                    Success = true,
                    Message = "Notifications retrieved successfully",
                    Data = notificationDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<NotificationDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve notifications",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        //create notification
        public async Task<ApiResponse<NotificationDto>> CreateNotification(NotificationCreateDto notificationDto)
        {
            try
            {
                var notification = _mapper.Map<Notification>(notificationDto);
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                var createdNotification = await _context.Notifications
                    .Include(n => n.Sender)
                    .FirstOrDefaultAsync(n => n.Id == notification.Id);

                var resultDto = _mapper.Map<NotificationDto>(createdNotification);
                resultDto.SenderName = createdNotification.Sender?.Name ?? "Unknown User";
                resultDto.TimeAgo = GetTimeAgo(createdNotification.CreatedDate);

                // Send real-time notification via SignalR
                await _hubContext.Clients.Group($"user-{notificationDto.UserId}")
                    .SendAsync("ReceiveNotification", resultDto);

                // Update unread count for the user
                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == notificationDto.UserId && !n.IsRead);

                await _hubContext.Clients.Group($"user-{notificationDto.UserId}")
                    .SendAsync("UpdateUnreadCount", unreadCount);

                return new ApiResponse<NotificationDto>
                {
                    Success = true,
                    Message = "Notification created successfully",
                    Data = resultDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<NotificationDto>
                {
                    Success = false,
                    Message = "Failed to create notification",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkAsRead(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Notification not found",
                        Errors = new List<string> { "Notification does not exist" }
                    };
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                // Update unread count via SignalR
                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("UpdateUnreadCount", unreadCount);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Notification marked as read",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to mark notification as read",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkAllAsRead(int userId)
        {
            try
            {
                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();

                // Update unread count via SignalR
                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("UpdateUnreadCount", 0);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "All notifications marked as read",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to mark notifications as read",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<int>> GetUnreadCount(int userId)
        {
            try
            {
                var count = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = "Unread count retrieved successfully",
                    Data = count
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "Failed to get unread count",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteNotification(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Notification not found",
                        Errors = new List<string> { "Notification does not exist or you don't have permission to delete it" }
                    };
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                // Update unread count via SignalR
                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("UpdateUnreadCount", unreadCount);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Notification deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete notification",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteAllNotifications(int userId)
        {
            try
            {
                var userNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();

                if (!userNotifications.Any())
                {
                    return new ApiResponse<bool>
                    {
                        Success = true,
                        Message = "No notifications to delete",
                        Data = true
                    };
                }

                var notificationCount = userNotifications.Count;
                var unreadCount = userNotifications.Count(n => !n.IsRead);

                _context.Notifications.RemoveRange(userNotifications);
                await _context.SaveChangesAsync();

                // Send real-time update via SignalR
                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("UpdateUnreadCount", 0);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"Deleted {notificationCount} notifications",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete notifications",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private string GetTimeAgo(DateTime date)
        {
            var timeSpan = DateTime.UtcNow - date;

            if (timeSpan.TotalMinutes < 1) return "just now";
            if (timeSpan.TotalMinutes < 60) return $"{(int)timeSpan.TotalMinutes}m ago";
            if (timeSpan.TotalHours < 24) return $"{(int)timeSpan.TotalHours}h ago";
            if (timeSpan.TotalDays < 30) return $"{(int)timeSpan.TotalDays}d ago";

            return date.ToString("MMM dd, yyyy");
        }
    }
}
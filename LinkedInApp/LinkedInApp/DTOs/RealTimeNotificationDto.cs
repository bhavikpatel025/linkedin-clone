using LinkedInApp.Models;

namespace LinkedInApp.DTOs
{
    public class RealTimeNotificationDto
    {
        public int UnreadCount { get; set; }
        public NotificationDto? LatestNotification { get; set; }
    }
}
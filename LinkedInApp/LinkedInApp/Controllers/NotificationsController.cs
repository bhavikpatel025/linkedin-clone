using Microsoft.AspNetCore.Mvc;
using LinkedInApp.Services;
using LinkedInApp.DTOs;
//using Microsoft.AspNetCore.Authorization;
using LinkedInApp.Models;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            var response = await _notificationService.GetUserNotifications(userId);
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationCreateDto notificationDto)
        {
            var response = await _notificationService.CreateNotification(notificationDto);
            return Ok(response);
        }

        [HttpPut("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId, [FromQuery] int userId)
        {
            var response = await _notificationService.MarkAsRead(notificationId, userId);
            return Ok(response);
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] int userId)
        {
            var response = await _notificationService.MarkAllAsRead(userId);
            return Ok(response);
        }

        [HttpGet("unread-count/{userId}")]
        public async Task<IActionResult> GetUnreadCount(int userId)
        {
            var response = await _notificationService.GetUnreadCount(userId);
            return Ok(response);
        }

        [HttpDelete("{notificationId}")]
        public async Task<IActionResult> DeleteNotification(int notificationId, [FromQuery] int userId)
        {
            var response = await _notificationService.DeleteNotification(notificationId, userId);
            return Ok(response);
        }

        [HttpDelete("user/{userId}/all")]
        public async Task<IActionResult> DeleteAllUserNotifications(int userId)
        {
            var response = await _notificationService.DeleteAllNotifications(userId);
            return Ok(response);
        }
    }
}
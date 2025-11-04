using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkedInApp.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // "connection_request", "post_like", "comment", "message"

        public int? RelatedEntityId { get; set; } // PostId, ConnectionId, etc.

        public bool IsRead { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("SenderId")] 
        public virtual User? Sender { get; set; }
    }

    public class NotificationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedDate { get; set; }
        public string TimeAgo { get; set; } = string.Empty;
    }

    public class NotificationCreateDto
    {
        public int UserId { get; set; }
        public int SenderId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
    }
}
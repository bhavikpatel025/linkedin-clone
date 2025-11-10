namespace LinkedInApp.Models
{
    // Models/Chat.cs
    public class Chat
    {
        public int Id { get; set; }
        public string Type { get; set; } = "direct"; // direct, group
        public string? GroupName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    // Models/ChatParticipant.cs
    public class ChatParticipant
    {
        public int Id { get; set; }
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public string Role { get; set; } = "member"; // member, admin

        // Navigation properties
        public virtual Chat Chat { get; set; }
        public virtual User User { get; set; }
    }

    // Models/Message.cs
    public class Message
    {
        public int Id { get; set; }
        public int ChatId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "text"; // text, image, file
        public string? FilePath { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }

        // Navigation properties
        public virtual Chat Chat { get; set; }
        public virtual User Sender { get; set; }
    }
}

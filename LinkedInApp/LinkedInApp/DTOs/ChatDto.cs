namespace LinkedInApp.DTOs
{
    public class ChatDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = "direct";
        public string? GroupName { get; set; }
        public string? GroupDescription { get; set; } // NEW: For group chat descriptions
        public string? GroupImage { get; set; } // NEW: For group chat profile images
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string LastMessage { get; set; } = string.Empty;
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public bool IsOnline { get; set; } // NEW: Online status for direct chats
        public DateTime? LastSeen { get; set; } // NEW: Last seen for direct chats
        public List<ChatParticipantDto> Participants { get; set; } = new List<ChatParticipantDto>();
        public bool IsArchived { get; set; } // NEW: Archive functionality
        public bool IsMuted { get; set; } // NEW: Mute notifications
    }

    public class ChatParticipantDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string ProfilePicture { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
        public bool IsOnline { get; set; } // NEW: Individual participant online status
        public DateTime? LastSeen { get; set; } // NEW: Individual last seen
        public DateTime JoinedAt { get; set; } // NEW: When they joined the chat
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int ChatId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderProfilePicture { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "text"; // text, image, file, etc.
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public int? ReplyToMessageId { get; set; } // NEW: Reply functionality
        public MessageDto? ReplyToMessage { get; set; } // NEW: Reply message details
        public bool IsEdited { get; set; } // NEW: Edit functionality
        public DateTime? EditedAt { get; set; } // NEW: When it was edited
        public List<MessageAttachmentDto> Attachments { get; set; } = new List<MessageAttachmentDto>(); // NEW: File attachments
    }

    // NEW: For file attachments
    public class MessageAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty; // image, document, etc.
        public long FileSize { get; set; }
        public string? ThumbnailUrl { get; set; } // For images/videos
    }

    public class CreateMessageDto
    {
        public int ChatId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "text";
        public int? ReplyToMessageId { get; set; } // NEW: Reply to specific message
        public List<MessageAttachmentDto> Attachments { get; set; } = new List<MessageAttachmentDto>(); // NEW: File attachments
    }

    public class CreateChatDto
    {
        public List<int> ParticipantIds { get; set; } = new List<int>();
        public string? GroupName { get; set; }
        public string? GroupDescription { get; set; } // NEW: Group description
        public string? GroupImage { get; set; } // NEW: Group profile image
    }

    public class UpdateChatDto
    {
        public int ChatId { get; set; }
        public string? GroupName { get; set; }
        public string? GroupDescription { get; set; }
        public string? GroupImage { get; set; }
    }

    public class MarkAsReadDto
    {
        public int MessageId { get; set; }
        public int ChatId { get; set; }
    }

    // NEW: For chat actions (mute, archive, etc.)
    public class ChatActionDto
    {
        public int ChatId { get; set; }
        public string Action { get; set; } = string.Empty; // "mute", "unmute", "archive", "unarchive"
        public bool Value { get; set; }
    }

    // NEW: For message reactions
    public class MessageReactionDto
    {
        public int MessageId { get; set; }
        public string Reaction { get; set; } = string.Empty; // "like", "love", "laugh", etc.
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
    }

    // NEW: For adding/removing participants
    public class ChatParticipantActionDto
    {
        public int ChatId { get; set; }
        public int ParticipantId { get; set; }
        public string Action { get; set; } = string.Empty; // "add", "remove"
    }

    // NEW: For search and filtering
    public class ChatSearchDto
    {
        public string? Query { get; set; }
        public string? Type { get; set; } // "direct", "group", or null for all
        public bool? UnreadOnly { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
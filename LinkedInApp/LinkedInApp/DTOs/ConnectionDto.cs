namespace LinkedInApp.DTOs
{
    public class ConnectionDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }

        // User details
        public UserDto Sender { get; set; }
        public UserDto Receiver { get; set; }
    }

    public class ConnectionRequestDto
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
    }

    public class ConnectionResponseDto
    {
        public int ConnectionId { get; set; }
        public string Status { get; set; } // "accepted" or "rejected"
    }

    public class UserConnectionDto
    {
        public int Id { get; set; }
        public int ConnectionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public string ProfilePicture { get; set; } = string.Empty;
        //public string Avatar { get; set; } = string.Empty; // Change to empty string default
        public string Location { get; set; } = string.Empty; // Change to empty string default
        public string? Headline { get; set; } // Add this if needed
        public DateTime ConnectionDate { get; set; }
        public int MutualConnections { get; set; }
    }
}
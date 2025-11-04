namespace LinkedInApp.DTOs
{
    public class ReplyDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string CreatedDate { get; set; } = string.Empty;
        public int CommentId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserProfilePicture { get; set; } = string.Empty;
        public bool CanDelete { get; set; }
    }

    public class ReplyCreateDto
    {
        public string Content { get; set; } = string.Empty;
        public int CommentId { get; set; }
        public int UserId { get; set; }
    }

    public class ReplyDeleteResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string> Errors { get; set; } = new List<string>();
    }
}
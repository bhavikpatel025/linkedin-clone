namespace LinkedInApp.DTOs
{
    public class PostDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string RoleName { get; set; } = "No Role";
        public string UserProfilePicture { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? PhotoPath { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }
}
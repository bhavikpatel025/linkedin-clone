using System.ComponentModel.DataAnnotations;

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
        public bool IsSavedByCurrentUser { get; set; }
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }

    public class SavedPostDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PostId { get; set; }
        public DateTime SavedAt { get; set; }
        public PostDto? Post { get; set; }
    }

    public class SavePostRequestDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int PostId { get; set; }
    }

    // Add this simple DTO for save response
    public class SavePostResultDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PostId { get; set; }
        public DateTime SavedAt { get; set; }
    }

    public class SavePostResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public SavePostResultDto? Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}
using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.DTOs
{
    public class CommentCreateDto
    {
        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public int PostId { get; set; }
        public int UserId { get; set; }
    }
}
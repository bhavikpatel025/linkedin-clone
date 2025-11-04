using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkedInApp.Models
{

    public class Comment
    {
        [Key]
        public int Id { get; set; }

        public int PostId { get; set; }
        public int UserId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [ForeignKey("PostId")]
        public virtual Post Post { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        public ICollection<Reply> Replies { get; set; } = new List<Reply>();
    }
}
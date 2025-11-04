using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkedInApp.Models
{
    public class Like
    {
        [Key]
        public int Id { get; set; }

        public int PostId { get; set; }
        public int UserId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [ForeignKey("PostId")]
        public virtual Post Post { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}
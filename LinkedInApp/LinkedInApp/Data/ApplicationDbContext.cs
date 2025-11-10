using LinkedInApp.Models;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<UserSkill> UserSkills { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<SavedPost> SavedPosts { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Reply> Replies { get; set; }
        public DbSet<Connection> Connections { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<ChatParticipant> ChatParticipants { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.ProfilePicture)
                    .HasMaxLength(500) // Match the [StringLength] attribute
                    .IsRequired(false); // Make it optional

                entity.Property(u => u.ResetToken)
           .HasMaxLength(500)
           .IsRequired(false);

                entity.Property(u => u.ResetTokenExpiry)
                    .IsRequired(false);

                entity.Property(u => u.RefreshToken)
                    .HasMaxLength(500)
                    .IsRequired(false);

                entity.Property(u => u.RefreshTokenExpiry)
                    .IsRequired(false);
            });

            // Configure UserSkill relationships
            modelBuilder.Entity<UserSkill>()
                .HasKey(us => us.Id);

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.User)
                .WithMany(u => u.UserSkills)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.Skill)
                .WithMany(s => s.UserSkills)
                .HasForeignKey(us => us.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Post relationships
            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedPost>(entity =>
            {
                entity.HasKey(sp => sp.Id);

                // Unique constraint to prevent duplicate saves
                entity.HasIndex(sp => new { sp.UserId, sp.PostId })
                      .IsUnique();

                // Relationship: User can save multiple posts - CHANGE TO Restrict or NoAction
                entity.HasOne(sp => sp.User)
                      .WithMany(u => u.SavedPosts)
                      .HasForeignKey(sp => sp.UserId)
                      .OnDelete(DeleteBehavior.Restrict); 

                // Relationship: Post can be saved by multiple users - CHANGE TO Restrict or NoAction
                entity.HasOne(sp => sp.Post)
                      .WithMany(p => p.SavedPosts)
                      .HasForeignKey(sp => sp.PostId)
                      .OnDelete(DeleteBehavior.Restrict); 

                // Configure dates
                entity.Property(sp => sp.SavedAt)
                      .HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Like relationships
            modelBuilder.Entity<Like>()
                .HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Like>()
                .HasOne(l => l.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure Comment relationships
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Reply>(entity =>
            {
                entity.HasKey(r => r.Id);

                // Relationship: Reply belongs to a Comment
                entity.HasOne(r => r.Comment)
                    .WithMany(c => c.Replies)
                    .HasForeignKey(r => r.CommentId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship: Reply belongs to a User
                entity.HasOne(r => r.User)
                    .WithMany(u => u.Replies)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.NoAction);

                // Configure properties
                entity.Property(r => r.Content)
                    .HasMaxLength(1000)
                    .IsRequired();

                entity.Property(r => r.CreatedDate)
                    .HasDefaultValueSql("GETUTCDATE()");
            });


            // Configure Connection relationships
            modelBuilder.Entity<Connection>(entity =>
            {
                entity.HasKey(c => c.Id);

                // Unique constraint to prevent duplicate connections
                entity.HasIndex(c => new { c.SenderId, c.ReceiverId }).IsUnique();

                // Relationship: User can send multiple connection requests
                entity.HasOne(c => c.Sender)
                    .WithMany(u => u.SentConnections)
                    .HasForeignKey(c => c.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: User can receive multiple connection requests
                entity.HasOne(c => c.Receiver)
                    .WithMany(u => u.ReceivedConnections)
                    .HasForeignKey(c => c.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure Status
                entity.Property(c => c.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20)
                    .IsRequired();

                // Configure dates with default values
                entity.Property(c => c.CreatedDate)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(c => c.UpdatedDate)
                    .HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Notification relationships
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);

                // Relationship: User can have multiple notifications (RECEIVER)
                entity.HasOne(n => n.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship: Sender who triggered the notification
                entity.HasOne(n => n.Sender)
                    .WithMany() // No navigation property back to notifications from sender side
                    .HasForeignKey(n => n.SenderId)
                    .OnDelete(DeleteBehavior.NoAction);

                // Configure properties
                entity.Property(n => n.Title)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(n => n.Message)
                    .HasMaxLength(500);

                entity.Property(n => n.Type)
                    .HasMaxLength(50)
                    .IsRequired();

                // Configure SenderId as required
                entity.Property(n => n.SenderId)
                    .IsRequired();

                // Configure dates
                entity.Property(n => n.CreatedDate)
                    .HasDefaultValueSql("GETUTCDATE()");

                // Indexes for better performance
                entity.HasIndex(n => new { n.UserId, n.IsRead });
                entity.HasIndex(n => n.CreatedDate);
                entity.HasIndex(n => n.SenderId);
            });

            modelBuilder.Entity<Chat>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasMaxLength(20);
            });

            // ChatParticipant configurations
            modelBuilder.Entity<ChatParticipant>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(cp => cp.Chat)
                      .WithMany(c => c.Participants)
                      .HasForeignKey(cp => cp.ChatId);
                entity.HasOne(cp => cp.User)
                      .WithMany()
                      .HasForeignKey(cp => cp.UserId);
            });

            // Message configurations
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(m => m.Chat)
                      .WithMany(c => c.Messages)
                      .HasForeignKey(m => m.ChatId);
                entity.HasOne(m => m.Sender)
                      .WithMany()
                      .HasForeignKey(m => m.SenderId);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Student" },
                new Role { Id = 2, Name = "CEO" },
                new Role { Id = 3, Name = "Manager" },
                new Role { Id = 4, Name = "Developer" },
                new Role { Id = 5, Name = "Designer" },
                new Role { Id = 6, Name = "HR" }
            );

            // Seed Skills
            modelBuilder.Entity<Skill>().HasData(
                new Skill { Id = 1, Name = "C#" },
                new Skill { Id = 2, Name = "JavaScript" },
                new Skill { Id = 3, Name = "Angular" },
                new Skill { Id = 4, Name = "React" },
                new Skill { Id = 5, Name = "Node.js" },
                new Skill { Id = 6, Name = "SQL Server" },
                new Skill { Id = 7, Name = "MongoDB" },
                new Skill { Id = 8, Name = "Python" },
                new Skill { Id = 9, Name = "Java" },
                new Skill { Id = 10, Name = "PHP" },
                new Skill { Id = 11, Name = "HTML/CSS" },
                new Skill { Id = 12, Name = "Bootstrap" },
                new Skill { Id = 13, Name = "Azure" },
                new Skill { Id = 14, Name = "AWS" },
                new Skill { Id = 15, Name = "Docker" }
            );
        }
    }
}
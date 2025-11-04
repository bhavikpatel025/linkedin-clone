using AutoMapper;
using LinkedInApp.Data;
using LinkedInApp.DTOs;
using LinkedInApp.Hubs;
using LinkedInApp.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Services
{
    public class PostService : IPostService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _environment;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public PostService(
            ApplicationDbContext context,
            IMapper mapper,
            IWebHostEnvironment environment,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _environment = environment;
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        public async Task<ApiResponse<PostDto>> CreatePostAsync(PostCreateDto postCreateDto)
        {
            try
            {
                // First, verify the user exists
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == postCreateDto.UserId);

                if (user == null)
                {
                    return new ApiResponse<PostDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "Invalid user ID" }
                    };
                }

                var post = _mapper.Map<Post>(postCreateDto);

                // Handle photo upload
                if (postCreateDto.Photo != null && postCreateDto.Photo.Length > 0)
                {
                    var photoPath = await SavePhotoAsync(postCreateDto.Photo);
                    post.PhotoPath = photoPath;
                }

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                // Get post with related data safely
                var createdPost = await _context.Posts
                    .Include(p => p.User)
                        .ThenInclude(u => u.Role)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(p => p.Id == post.Id);

                // Manual mapping with null checks
                var postDto = new PostDto
                {
                    Id = createdPost.Id,
                    UserId = createdPost.UserId,
                    UserName = createdPost.User?.Name ?? "Unknown User",
                    RoleName = createdPost.User?.Role?.Name ?? "User",
                    UserProfilePicture = createdPost.User?.ProfilePicture ?? string.Empty,
                    Description = createdPost.Description ?? string.Empty,
                    PhotoPath = createdPost.PhotoPath,
                    CreatedDate = createdPost.CreatedDate,
                    UpdatedDate = createdPost.UpdatedDate,
                    LikesCount = createdPost.Likes?.Count ?? 0,
                    CommentsCount = createdPost.Comments?.Count ?? 0,
                    IsLikedByCurrentUser = false,
                    Comments = new List<CommentDto>()
                };

                return new ApiResponse<PostDto>
                {
                    Success = true,
                    Message = "Post created successfully",
                    Data = postDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "Failed to create post",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<PostDto>> UpdatePostAsync(PostUpdateDto postUpdateDto)
        {
            try
            {
                var existingPost = await _context.Posts.FindAsync(postUpdateDto.Id);
                if (existingPost == null)
                {
                    return new ApiResponse<PostDto>
                    {
                        Success = false,
                        Message = "Post not found",
                        Errors = new List<string> { "Post does not exist" }
                    };
                }

                // Update post properties
                existingPost.Description = postUpdateDto.Description;
                existingPost.UpdatedDate = DateTime.Now;

                // Handle photo update
                if (postUpdateDto.Photo != null && postUpdateDto.Photo.Length > 0)
                {
                    // Delete old photo if exists
                    if (!string.IsNullOrEmpty(existingPost.PhotoPath))
                    {
                        DeletePhoto(existingPost.PhotoPath);
                    }

                    var photoPath = await SavePhotoAsync(postUpdateDto.Photo);
                    existingPost.PhotoPath = photoPath;
                }

                await _context.SaveChangesAsync();

                // Get updated post with related data
                var updatedPost = await _context.Posts
                    .Include(p => p.User)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(p => p.Id == existingPost.Id);

                var postDto = _mapper.Map<PostDto>(updatedPost);
                postDto.UserProfilePicture = updatedPost.User?.ProfilePicture ?? string.Empty;

                return new ApiResponse<PostDto>
                {
                    Success = true,
                    Message = "Post updated successfully",
                    Data = postDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "Failed to update post",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeletePostAsync(int postId, int userId)
        {
            try
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && p.UserId == userId);
                if (post == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Post not found or unauthorized",
                        Errors = new List<string> { "Post does not exist or you don't have permission to delete it" }
                    };
                }

                // Delete photo if exists
                if (!string.IsNullOrEmpty(post.PhotoPath))
                {
                    DeletePhoto(post.PhotoPath);
                }

                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Post deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete post",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<PostDto>>> GetAllPostsAsync(int currentUserId)
        {
            try
            {
                var posts = await _context.Posts
                    .Include(p => p.User)
                        .ThenInclude(u => u.Role)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .OrderByDescending(p => p.CreatedDate)
                    .ToListAsync();

                var postDtos = new List<PostDto>();

                foreach (var post in posts)
                {
                    var postDto = new PostDto
                    {
                        Id = post.Id,
                        UserId = post.UserId,
                        UserName = post.User?.Name ?? "Unknown User",
                        RoleName = post.User?.Role?.Name ?? "User",
                        UserProfilePicture = post.User?.ProfilePicture ?? string.Empty,
                        Description = post.Description ?? string.Empty,
                        PhotoPath = post.PhotoPath,
                        CreatedDate = post.CreatedDate,
                        UpdatedDate = post.UpdatedDate,
                        LikesCount = post.Likes?.Count ?? 0,
                        CommentsCount = post.Comments?.Count ?? 0,
                        IsLikedByCurrentUser = post.Likes?.Any(l => l.UserId == currentUserId) ?? false,
                        Comments = post.Comments?.Select(c => new CommentDto
                        {
                            Id = c.Id,
                            Content = c.Content ?? string.Empty,
                            CreatedDate = c.CreatedDate,
                            UserId = c.UserId,
                            UserName = c.User?.Name ?? "Unknown User",
                             UserProfilePicture = c.User?.ProfilePicture ?? string.Empty
                        }).ToList() ?? new List<CommentDto>()
                    };

                    postDtos.Add(postDto);
                }

                return new ApiResponse<List<PostDto>>
                {
                    Success = true,
                    Message = "Posts retrieved successfully",
                    Data = postDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<PostDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve posts",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(int postId, int currentUserId)
        {
            try
            {
                var post = await _context.Posts
                    .Include(p => p.User)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    return new ApiResponse<PostDto>
                    {
                        Success = false,
                        Message = "Post not found",
                        Errors = new List<string> { "Post does not exist" }
                    };
                }

                var postDto = _mapper.Map<PostDto>(post);
                postDto.IsLikedByCurrentUser = post.Likes.Any(l => l.UserId == currentUserId);
                postDto.UserProfilePicture = post.User?.ProfilePicture ?? string.Empty;


                return new ApiResponse<PostDto>
                {
                    Success = true,
                    Message = "Post retrieved successfully",
                    Data = postDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "Failed to retrieve post",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> ToggleLikeAsync(LikeDto likeDto)
        {
            try
            {
                var existingLike = await _context.Likes
                    .FirstOrDefaultAsync(l => l.PostId == likeDto.PostId && l.UserId == likeDto.UserId);

                if (existingLike != null)
                {
                    // Unlike
                    _context.Likes.Remove(existingLike);
                    await _context.SaveChangesAsync();

                    return new ApiResponse<bool>
                    {
                        Success = true,
                        Message = "Post unliked successfully",
                        Data = false
                    };
                }
                else
                {
                    // Like
                    var like = _mapper.Map<Like>(likeDto);
                    _context.Likes.Add(like);
                    await _context.SaveChangesAsync();

                    // Get post and user info for notification
                    var post = await _context.Posts
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.Id == likeDto.PostId);

                    var currentUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == likeDto.UserId);

                    // Send notification only if it's not the post owner liking their own post
                    if (post != null && currentUser != null && post.UserId != likeDto.UserId)
                    {
                        var notificationDto = new NotificationCreateDto
                        {
                            UserId = post.UserId, // Notify post owner
                            SenderId = likeDto.UserId,
                            Title = "New Like",
                            Message = $"{currentUser.Name} liked your post",
                            Type = "post_like",
                            RelatedEntityId = post.Id
                        };

                        // This will trigger SignalR notification automatically
                        await _notificationService.CreateNotification(notificationDto);
                    }

                    return new ApiResponse<bool>
                    {
                        Success = true,
                        Message = "Post liked successfully",
                        Data = true
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to toggle like",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<CommentDto>> AddCommentAsync(CommentCreateDto commentCreateDto)
        {
            try
            {
                var comment = _mapper.Map<Comment>(commentCreateDto);
                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                // Get comment with user data
                var createdComment = await _context.Comments
                    .Include(c => c.User)
                    .Include(c => c.Post)
                    .FirstOrDefaultAsync(c => c.Id == comment.Id);

                var commentDto = _mapper.Map<CommentDto>(createdComment);

                // Send notification to post owner if it's not their own comment
                if (createdComment != null && createdComment.Post != null &&
                    createdComment.UserId != createdComment.Post.UserId)
                {
                    var notificationDto = new NotificationCreateDto
                    {
                        UserId = createdComment.Post.UserId,
                        SenderId = createdComment.UserId,
                        Title = "New Comment",
                        Message = $"{createdComment.User.Name} commented on your post: {createdComment.Content.Truncate(50)}",
                        Type = "comment",
                        RelatedEntityId = createdComment.PostId
                    };

                    // This will trigger SignalR notification automatically
                    await _notificationService.CreateNotification(notificationDto);
                }

                return new ApiResponse<CommentDto>
                {
                    Success = true,
                    Message = "Comment added successfully",
                    Data = commentDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CommentDto>
                {
                    Success = false,
                    Message = "Failed to add comment",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<ReplyDto>> AddReplyAsync(ReplyCreateDto replyDto)
        {
            try
            {
                // Check if comment exists
                var comment = await _context.Comments
                    .Include(c => c.User)
                    .Include(c => c.Post)
                    .FirstOrDefaultAsync(c => c.Id == replyDto.CommentId);

                if (comment == null)
                {
                    return new ApiResponse<ReplyDto>
                    {
                        Success = false,
                        Message = "Comment not found",
                        Errors = new List<string> { "The comment you're replying to doesn't exist" }
                    };
                }

                // Check if user exists
                var user = await _context.Users.FindAsync(replyDto.UserId);
                if (user == null)
                {
                    return new ApiResponse<ReplyDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "Invalid user" }
                    };
                }

                // Create reply
                var reply = new Reply
                {
                    Content = replyDto.Content.Trim(),
                    CommentId = replyDto.CommentId,
                    UserId = replyDto.UserId,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Replies.Add(reply);
                await _context.SaveChangesAsync();

                // Send notification to comment owner if it's not the same user
                if (comment.UserId != replyDto.UserId)
                {
                    var notificationDto = new NotificationCreateDto
                    {
                        UserId = comment.UserId,
                        SenderId = replyDto.UserId,
                        Title = "New Reply",
                        Message = $"{user.Name} replied to your comment",
                        Type = "comment_reply",
                        RelatedEntityId = comment.PostId
                    };

                    await _notificationService.CreateNotification(notificationDto);
                }

                // Map to DTO
                var replyDtoResponse = _mapper.Map<ReplyDto>(reply);
                replyDtoResponse.UserName = user.Name;
                replyDtoResponse.UserProfilePicture = user.ProfilePicture ?? string.Empty;

                return new ApiResponse<ReplyDto>
                {
                    Success = true,
                    Message = "Reply added successfully",
                    Data = replyDtoResponse
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ReplyDto>
                {
                    Success = false,
                    Message = "Failed to add reply",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteReplyAsync(int replyId, int userId)
        {
            try
            {
                var reply = await _context.Replies
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == replyId);

                if (reply == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Reply not found",
                        Errors = new List<string> { "Reply does not exist" }
                    };
                }

                // Check if user owns the reply
                if (reply.UserId != userId)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Unauthorized",
                        Errors = new List<string> { "You can only delete your own replies" }
                    };
                }

                _context.Replies.Remove(reply);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Reply deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete reply",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<ReplyDto>>> GetRepliesByCommentIdAsync(int commentId)
        {
            try
            {
                var replies = await _context.Replies
                    .Where(r => r.CommentId == commentId)
                    .Include(r => r.User)
                    .OrderBy(r => r.CreatedDate)
                    .Select(r => new ReplyDto
                    {
                        Id = r.Id,
                        Content = r.Content,
                        CreatedDate = r.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                        CommentId = r.CommentId,
                        UserId = r.UserId,
                        UserName = r.User.Name,
                        UserProfilePicture = r.User.ProfilePicture ?? string.Empty
                    })
                    .ToListAsync();

                return new ApiResponse<List<ReplyDto>>
                {
                    Success = true,
                    Message = "Replies retrieved successfully",
                    Data = replies
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<ReplyDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve replies",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, int userId)
        {
            try
            {
                // Find the comment
                var comment = await _context.Comments
                    .Include(c => c.Post) // Include post to get post owner info
                    .Include(c => c.User) // Include user to get comment owner info
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Comment not found",
                        Errors = new List<string> { "Comment does not exist" }
                    };
                }

                // Check if user has permission to delete (comment owner OR post owner)
                bool isCommentOwner = comment.UserId == userId;
                bool isPostOwner = comment.Post?.UserId == userId;

                if (!isCommentOwner && !isPostOwner)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Unauthorized",
                        Errors = new List<string> { "You don't have permission to delete this comment" }
                    };
                }

                // Store info for notification before deletion
                var postOwnerId = comment.Post?.UserId;
                var commentOwnerName = comment.User?.Name;
                var postId = comment.PostId;

                // Delete the comment
                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                // Send notification to post owner if someone else's comment was deleted by post owner
                if (isPostOwner && !isCommentOwner && postOwnerId.HasValue)
                {
                    var currentUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == userId);

                    if (currentUser != null)
                    {
                        var notificationDto = new NotificationCreateDto
                        {
                            UserId = comment.UserId, // Notify the comment owner
                            SenderId = userId,
                            Title = "Comment Removed",
                            Message = $"{currentUser.Name} removed your comment from their post",
                            Type = "comment_removed",
                            RelatedEntityId = postId
                        };

                        await _notificationService.CreateNotification(notificationDto);
                    }
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Comment deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete comment",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<PostDto>>> GetUserPostsAsync(int userId, int currentUserId)
        {
            try
            {
                var posts = await _context.Posts
                    .Include(p => p.User)
                        .ThenInclude(u => u.Role)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedDate)
                    .ToListAsync();

                var postDtos = new List<PostDto>();

                foreach (var post in posts)
                {
                    var postDto = new PostDto
                    {
                        Id = post.Id,
                        UserId = post.UserId,
                        UserName = post.User?.Name ?? "Unknown User",
                        RoleName = post.User?.Role?.Name ?? "User",
                        UserProfilePicture = post.User?.ProfilePicture ?? string.Empty,
                        Description = post.Description ?? string.Empty,
                        PhotoPath = post.PhotoPath,
                        CreatedDate = post.CreatedDate,
                        UpdatedDate = post.UpdatedDate,
                        LikesCount = post.Likes?.Count ?? 0,
                        CommentsCount = post.Comments?.Count ?? 0,
                        IsLikedByCurrentUser = post.Likes?.Any(l => l.UserId == currentUserId) ?? false,
                        Comments = post.Comments?.Select(c => new CommentDto
                        {
                            Id = c.Id,
                            Content = c.Content ?? string.Empty,
                            CreatedDate = c.CreatedDate,
                            UserId = c.UserId,
                            UserName = c.User?.Name ?? "Unknown User",
                            UserProfilePicture = c.User?.ProfilePicture ?? string.Empty
                        }).ToList() ?? new List<CommentDto>()
                    };

                    postDtos.Add(postDto);
                }

                return new ApiResponse<List<PostDto>>
                {
                    Success = true,
                    Message = "User posts retrieved successfully",
                    Data = postDtos
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<PostDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve user posts",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private async Task<string> SavePhotoAsync(IFormFile photo)
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "posts");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}_{photo.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            return $"/uploads/posts/{fileName}";
        }

        private void DeletePhoto(string photoPath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, photoPath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch
            {
                // Handle file deletion errors silently
            }
        }
    }

    public static class StringExtensions
    {
        public static string Truncate(this string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value)) return value;
            return value.Length <= maxLength ? value : value.Substring(0, maxLength) + "...";
        }
    }
}
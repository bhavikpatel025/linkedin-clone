using LinkedInApp.DTOs;
using LinkedInApp.Models;

namespace LinkedInApp.Services
{
    public interface IPostService
    {
        Task<ApiResponse<PostDto>> CreatePostAsync(PostCreateDto postCreateDto);
        Task<ApiResponse<PostDto>> UpdatePostAsync(PostUpdateDto postUpdateDto);
        Task<ApiResponse<bool>> DeletePostAsync(int postId, int userId);
        Task<ApiResponse<List<PostDto>>> GetAllPostsAsync(int currentUserId);
        Task<ApiResponse<PostDto>> GetPostByIdAsync(int postId, int currentUserId);
        Task<ApiResponse<bool>> ToggleLikeAsync(LikeDto likeDto);
        Task<ApiResponse<CommentDto>> AddCommentAsync(CommentCreateDto commentCreateDto);
        Task<ApiResponse<List<PostDto>>> GetUserPostsAsync(int userId, int currentUserId);
        Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, int userId);
        Task<ApiResponse<ReplyDto>> AddReplyAsync(ReplyCreateDto replyDto);
        Task<ApiResponse<bool>> DeleteReplyAsync(int replyId, int userId);
        Task<ApiResponse<List<ReplyDto>>> GetRepliesByCommentIdAsync(int commentId);

        Task<ApiResponse<SavePostResultDto>> SavePostAsync(SavePostRequestDto saveRequest);
        Task<ApiResponse<bool>> UnsavePostAsync(int userId, int postId);
        Task<ApiResponse<List<SavedPostDto>>> GetUserSavedPostsAsync(int userId);
        Task<ApiResponse<bool>> IsPostSavedAsync(int userId, int postId);
    }
}
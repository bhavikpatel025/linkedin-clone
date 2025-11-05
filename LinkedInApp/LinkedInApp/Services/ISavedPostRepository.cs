using LinkedInApp.Models;

namespace LinkedInApp.Repositories
{
    public interface ISavedPostRepository
    {
        Task<SavedPost> SavePostAsync(SavedPost savedPost);
        Task<bool> UnsavePostAsync(int userId, int postId);
        Task<bool> IsPostSavedByUserAsync(int userId, int postId);
        Task<IEnumerable<SavedPost>> GetUserSavedPostsAsync(int userId);
        Task<int> GetUserSavedPostsCountAsync(int userId);
    }
}
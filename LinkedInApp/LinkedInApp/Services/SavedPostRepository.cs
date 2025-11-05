using LinkedInApp.Data;
using LinkedInApp.Models;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Repositories
{
    public class SavedPostRepository : ISavedPostRepository
    {
        private readonly ApplicationDbContext _context;

        public SavedPostRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SavedPost> SavePostAsync(SavedPost savedPost)
        {
            // Check if already saved
            var existing = await _context.SavedPosts
                .FirstOrDefaultAsync(sp => sp.UserId == savedPost.UserId && sp.PostId == savedPost.PostId);

            if (existing != null)
                return existing;

            _context.SavedPosts.Add(savedPost);
            await _context.SaveChangesAsync();
            return savedPost;
        }

        public async Task<bool> UnsavePostAsync(int userId, int postId)
        {
            var savedPost = await _context.SavedPosts
                .FirstOrDefaultAsync(sp => sp.UserId == userId && sp.PostId == postId);

            if (savedPost == null)
                return false;

            _context.SavedPosts.Remove(savedPost);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsPostSavedByUserAsync(int userId, int postId)
        {
            return await _context.SavedPosts
                .AnyAsync(sp => sp.UserId == userId && sp.PostId == postId);
        }

        public async Task<IEnumerable<SavedPost>> GetUserSavedPostsAsync(int userId)
        {
            return await _context.SavedPosts
                .Include(sp => sp.Post)
                    .ThenInclude(p => p.User)
                        .ThenInclude(u => u.Role)
                .Include(sp => sp.Post)
                    .ThenInclude(p => p.Likes)
                .Include(sp => sp.Post)
                    .ThenInclude(p => p.Comments)
                .Where(sp => sp.UserId == userId)
                .OrderByDescending(sp => sp.SavedAt)
                .ToListAsync();
        }

        public async Task<int> GetUserSavedPostsCountAsync(int userId)
        {
            return await _context.SavedPosts
                .CountAsync(sp => sp.UserId == userId);
        }
    }
}
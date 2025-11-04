using Microsoft.EntityFrameworkCore;
using LinkedInApp.Data;
using LinkedInApp.Models;

namespace LinkedInApp.Services
{
    public class SearchService : ISearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConnectionService _connectionService;

        public SearchService(ApplicationDbContext context, IConnectionService connectionService)
        {
            _context = context;
            _connectionService = connectionService;
        }

        public async Task<SearchResult> SearchAsync(SearchRequest request)
        {
            var result = new SearchResult
            {
                Page = request.Page
            };

            // Different search behavior based on context
            switch (request.SearchContext?.ToLower())
            {
                case "network":
                    // In network page: Only search users for connections
                    result.Users = await SearchUsersForNetworkAsync(request);
                    break;

                case "home":
                default:
                    // In home page: Search both users and posts
                    result.Users = await SearchUsersForHomeAsync(request);
                    result.Posts = await SearchPostsAsync(request);
                    break;
            }

            // Calculate totals
            result.TotalResults = result.Users.Count + result.Posts.Count;
            result.TotalPages = (int)Math.Ceiling((double)result.TotalResults / request.PageSize);

            return result;
        }

        private async Task<List<UserSearchResult>> SearchUsersForHomeAsync(SearchRequest request)
        {
            var searchTerms = request.Query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            var query = _context.Users
                .Where(u => u.Id != request.CurrentUserId) // Exclude current user
                .AsQueryable();

            // Build search condition for each term
            foreach (var term in searchTerms)
            {
                query = query.Where(u =>
                    u.Name.ToLower().Contains(term) ||
                    u.Email.ToLower().Contains(term) ||
                    //(u.Headline != null && u.Headline.ToLower().Contains(term)) ||
                    (u.Location != null && u.Location.ToLower().Contains(term)) ||
                    (u.Role != null && u.Role.Name.ToLower().Contains(term)));
            }

            var users = await query
                .Include(u => u.Role)
                .OrderByDescending(u => u.Name.StartsWith(request.Query)) // Exact matches first
                .ThenBy(u => u.Name)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var results = new List<UserSearchResult>();

            foreach (var user in users)
            {
                var userResult = new UserSearchResult
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    RoleName = user.Role?.Name,
                    //Headline = user.Headline,
                    Location = user.Location,
                    ProfilePicture = user.ProfilePicture,
                    MutualConnections = await GetMutualConnectionsCount(request.CurrentUserId, user.Id),
                    ConnectionStatus = await GetConnectionStatus(request.CurrentUserId, user.Id),
                    CanConnect = await CanSendConnectionRequest(request.CurrentUserId, user.Id)
                };

                results.Add(userResult);
            }

            return results;
        }

        private async Task<List<UserSearchResult>> SearchUsersForNetworkAsync(SearchRequest request)
        {
            var searchTerms = request.Query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            // For network page: Search users who are NOT already connected and NOT current user
            var query = _context.Users
                .Where(u => u.Id != request.CurrentUserId)
                .AsQueryable();

            // Build search condition for each term
            foreach (var term in searchTerms)
            {
                query = query.Where(u =>
                    u.Name.ToLower().Contains(term) ||
                    u.Email.ToLower().Contains(term) ||
                    //(u.Headline != null && u.Headline.ToLower().Contains(term)) ||
                    (u.Location != null && u.Location.ToLower().Contains(term)) ||
                    (u.Role != null && u.Role.Name.ToLower().Contains(term)));
            }

            var users = await query
                .Include(u => u.Role)
                .OrderByDescending(u => u.Name.StartsWith(request.Query)) // Exact matches first
                .ThenBy(u => u.Name)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var results = new List<UserSearchResult>();

            foreach (var user in users)
            {
                var connectionStatus = await GetConnectionStatus(request.CurrentUserId, user.Id);

                // For network page, only include users who are not connected
                if (connectionStatus == "none" || connectionStatus == "rejected")
                {
                    var userResult = new UserSearchResult
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        RoleName = user.Role?.Name,
                        //Headline = user.Headline,
                        Location = user.Location,
                        ProfilePicture = user.ProfilePicture,
                        MutualConnections = await GetMutualConnectionsCount(request.CurrentUserId, user.Id),
                        ConnectionStatus = connectionStatus,
                        CanConnect = await CanSendConnectionRequest(request.CurrentUserId, user.Id)
                    };

                    results.Add(userResult);
                }
            }

            return results;
        }

        private async Task<List<PostSearchResult>> SearchPostsAsync(SearchRequest request)
        {
            // Only search posts in home context
            if (request.SearchContext?.ToLower() != "home")
                return new List<PostSearchResult>();

            var searchTerms = request.Query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            var query = _context.Posts
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .AsQueryable();

            // Build search condition for each term
            foreach (var term in searchTerms)
            {
                query = query.Where(p =>
                    p.Description.ToLower().Contains(term) ||
                    p.User.Name.ToLower().Contains(term));
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedDate)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return posts.Select(p => new PostSearchResult
            {
                Id = p.Id,
                Description = p.Description,
                PhotoPath = p.PhotoPath,
                UserId = p.UserId,
                UserName = p.User.Name,
                CreatedDate = p.CreatedDate,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count,
                IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == request.CurrentUserId)
            }).ToList();
        }

        public async Task<List<SearchSuggestion>> GetSuggestionsAsync(string query, string context = "home", int currentUserId = 0)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return new List<SearchSuggestion>();

            var suggestions = new List<SearchSuggestion>();
            var searchTerm = query.ToLower();

            // User suggestions (available in both contexts)
            var userQuery = _context.Users
                .Where(u =>
                    u.Name.ToLower().Contains(searchTerm));
                    //(u.Headline != null && u.Headline.ToLower().Contains(searchTerm)));

            // For network context, filter out already connected users
            if (context?.ToLower() == "network" && currentUserId > 0)
            {
                var connectedUserIds = await _context.Connections
                    .Where(c => (c.SenderId == currentUserId || c.ReceiverId == currentUserId) && c.Status == "accepted")
                    .Select(c => c.SenderId == currentUserId ? c.ReceiverId : c.SenderId)
                    .ToListAsync();

                userQuery = userQuery.Where(u => !connectedUserIds.Contains(u.Id) && u.Id != currentUserId);
            }

            var userSuggestions = await userQuery
                .Take(5)
                .Select(u => new SearchSuggestion
                {
                    Type = "user",
                    Text = u.Name,
                    Id = u.Id,
                    Context = context ?? "home"
                })
                .ToListAsync();

            suggestions.AddRange(userSuggestions);

            // Post suggestions (only in home context)
            if (context?.ToLower() == "home")
            {
                var postSuggestions = await _context.Posts
                    .Where(p => p.Description.ToLower().Contains(searchTerm))
                    .Take(3)
                    .Select(p => new SearchSuggestion
                    {
                        Type = "post",
                        Text = p.Description.Length > 50 ? p.Description.Substring(0, 50) + "..." : p.Description,
                        Id = p.Id,
                        Context = "home"
                    })
                    .ToListAsync();

                suggestions.AddRange(postSuggestions);
            }

            return suggestions.Take(8).ToList();
        }

        private async Task<int> GetMutualConnectionsCount(int currentUserId, int targetUserId)
        {
            if (currentUserId == 0) return 0;

            var currentUserConnections = await _context.Connections
                .Where(c => (c.SenderId == currentUserId || c.ReceiverId == currentUserId) && c.Status == "accepted")
                .Select(c => c.SenderId == currentUserId ? c.ReceiverId : c.SenderId)
                .ToListAsync();

            var targetUserConnections = await _context.Connections
                .Where(c => (c.SenderId == targetUserId || c.ReceiverId == targetUserId) && c.Status == "accepted")
                .Select(c => c.SenderId == targetUserId ? c.ReceiverId : c.SenderId)
                .ToListAsync();

            return currentUserConnections.Intersect(targetUserConnections).Count();
        }

        private async Task<string> GetConnectionStatus(int currentUserId, int targetUserId)
        {
            if (currentUserId == 0) return "none";

            var connection = await _context.Connections
                .FirstOrDefaultAsync(c =>
                    (c.SenderId == currentUserId && c.ReceiverId == targetUserId) ||
                    (c.SenderId == targetUserId && c.ReceiverId == currentUserId));

            return connection?.Status ?? "none";
        }

        private async Task<bool> CanSendConnectionRequest(int currentUserId, int targetUserId)
        {
            if (currentUserId == 0) return false;

            var existingConnection = await _context.Connections
                .FirstOrDefaultAsync(c =>
                    (c.SenderId == currentUserId && c.ReceiverId == targetUserId) ||
                    (c.SenderId == targetUserId && c.ReceiverId == currentUserId));

            return existingConnection == null || existingConnection.Status == "rejected";
        }
    }
}
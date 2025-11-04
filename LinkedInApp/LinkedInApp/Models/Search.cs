using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.Models
{
    public class SearchRequest
    {
        [Required]
        public string Query { get; set; } = string.Empty;
        public int CurrentUserId { get; set; }
        public string SearchContext { get; set; } = "home"; // "home" or "network"
        public string? Type { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class SearchResult
    {
        public List<UserSearchResult> Users { get; set; } = new();
        public List<PostSearchResult> Posts { get; set; } = new();
        public int TotalResults { get; set; }
        public int Page { get; set; }
        public int TotalPages { get; set; }
    }

    public class UserSearchResult
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? RoleName { get; set; }
        //public string? Headline { get; set; }
        public string? Location { get; set; }
        public string? ProfilePicture { get; set; }
        public int MutualConnections { get; set; }
        public string ConnectionStatus { get; set; } = "none";
        public bool CanConnect { get; set; } // For network page - if user can send connection request
    }

    public class PostSearchResult
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? PhotoPath { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
    }

    public class SearchSuggestion
    {
        public string Type { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public int? Id { get; set; }
        public string Context { get; set; } = "home"; // "home" or "network"
    }
}
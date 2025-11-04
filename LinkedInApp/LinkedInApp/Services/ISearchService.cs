using LinkedInApp.Models;

namespace LinkedInApp.Services
{
    public interface ISearchService
    {
        Task<SearchResult> SearchAsync(SearchRequest request);
        Task<List<SearchSuggestion>> GetSuggestionsAsync(string query, string context = "home", int currentUserId = 0);
    }
}
using Microsoft.AspNetCore.Mvc;
using LinkedInApp.Services;

using LinkedInApp.Models;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;
        private readonly ILogger<SearchController> _logger;

        public SearchController(ISearchService searchService, ILogger<SearchController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string query,
            [FromQuery] int currentUserId = 0,
            [FromQuery] string searchContext = "home", // "home" or "network"
            [FromQuery] string? type = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Search query is required",
                        errors = new[] { "Query parameter is required" }
                    });
                }

                var request = new SearchRequest
                {
                    Query = query.Trim(),
                    CurrentUserId = currentUserId,
                    SearchContext = searchContext,
                    Type = type,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _searchService.SearchAsync(request);

                return Ok(new
                {
                    success = true,
                    message = "Search completed successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during search for query: {Query}", query);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred during search",
                    errors = new[] { ex.Message }
                });
            }
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions(
            [FromQuery] string query,
            [FromQuery] string searchContext = "home",
            [FromQuery] int currentUserId = 0)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Suggestions retrieved",
                        data = new List<SearchSuggestion>()
                    });
                }

                var suggestions = await _searchService.GetSuggestionsAsync(query.Trim(), searchContext, currentUserId);

                return Ok(new
                {
                    success = true,
                    message = "Suggestions retrieved successfully",
                    data = suggestions
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting suggestions for query: {Query}", query);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while getting suggestions",
                    errors = new[] { ex.Message }
                });
            }
        }
    }
}
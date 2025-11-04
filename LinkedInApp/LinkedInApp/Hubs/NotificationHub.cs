using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace LinkedInApp.Hubs
{
    public class NotificationHub : Hub
    {
        private static readonly ConnectionMapping<int> _connections = new();

        public async Task JoinNotificationGroup(int userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            _connections.Add(userId, Context.ConnectionId);
            await Clients.Caller.SendAsync("JoinedGroup", $"Joined notification group for user {userId}");
        }

        public async Task LeaveNotificationGroup(int userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
            _connections.Remove(userId, Context.ConnectionId);
        }

        //  Send notification to specific user
        public async Task SendNotificationToUser(int userId, object notification)
        {
            await Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", notification);
        }

        // Update unread count for specific user
        public async Task UpdateUnreadCountForUser(int userId, int count)
        {
            await Clients.Group($"user-{userId}").SendAsync("UpdateUnreadCount", count);
        }

        // Send notification to all connected clients (optional)
        public async Task SendNotificationToAll(object notification)
        {
            await Clients.All.SendAsync("ReceiveNotification", notification);
        }

        // current connection count (for debugging)
        public async Task<int> GetConnectionCount()
        {
            return _connections.Count;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }

    // Track user connections
    public class ConnectionMapping<T>
    {
        private readonly Dictionary<T, HashSet<string>> _connections = new();

        public int Count => _connections.Count;

        public void Add(T key, string connectionId)
        {
            lock (_connections)
            {
                if (!_connections.TryGetValue(key, out var connections))
                {
                    connections = new HashSet<string>();
                    _connections.Add(key, connections);
                }

                lock (connections)
                {
                    connections.Add(connectionId);
                }
            }
        }

        public void Remove(T key, string connectionId)
        {
            lock (_connections)
            {
                if (!_connections.TryGetValue(key, out var connections))
                {
                    return;
                }

                lock (connections)
                {
                    connections.Remove(connectionId);

                    if (connections.Count == 0)
                    {
                        _connections.Remove(key);
                    }
                }
            }
        }

        public IEnumerable<string> GetConnections(T key)
        {
            if (_connections.TryGetValue(key, out var connections))
            {
                return connections;
            }
            return Enumerable.Empty<string>();
        }
    }
}
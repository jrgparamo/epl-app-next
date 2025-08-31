# Caching Implementation

This document describes the comprehensive caching system implemented for the EPL Prediction App to optimize API usage and improve performance.

## Overview

The app implements a multi-layer caching strategy:

1. **Server-side caching** (Next.js built-in)
2. **Client-side caching** (Custom implementation)
3. **Manual cache management** (Admin controls)

## Server-side Caching

### API Route Caching

Both API routes (`/api/matches` and `/api/matchday`) use Next.js built-in caching:

```javascript
// Cache configuration
export const revalidate = 1800; // 30 minutes for matches
export const revalidate = 3600; // 1 hour for matchday

// Fetch with caching
const response = await fetch(url, {
  next: {
    revalidate: 1800,
    tags: ["matches", "matchday"],
  },
});
```

### Cache Durations

- **Matches data**: 30 minutes (1800 seconds)
- **Current matchday**: 1 hour (3600 seconds)

### Cache Tags

Cache entries are tagged for selective invalidation:

- `matches` - All match data
- `matches-{matchday}` - Specific matchday data
- `matchday` - Current matchday info
- `season-info` - Season information

## Client-side Caching

### Cache Implementation

Custom cache class in `/src/lib/cache.js`:

```javascript
import cache, { CACHE_CONFIG } from "./cache";

// Cache with TTL
cache.set(key, data, ttlSeconds);

// Retrieve from cache
const data = cache.get(key);
```

### Cache Configuration

```javascript
export const CACHE_CONFIG = {
  matches: {
    ttl: 1800, // 30 minutes
    key: "matches",
  },
  matchday: {
    ttl: 3600, // 1 hour
    key: "current-matchday",
  },
  fixtures: {
    ttl: 1800, // 30 minutes
    key: "fixtures",
  },
};
```

### API Functions with Caching

All API functions now include caching:

```javascript
export async function getFixturesByMatchday(matchday) {
  const cacheKey = `${CACHE_CONFIG.matches.key}-${matchday}`;
  const data = await apiRequest(
    `/api/matches?matchday=${matchday}`,
    cacheKey,
    CACHE_CONFIG.matches.ttl
  );
  return data.matches || [];
}
```

## Cache Management

### Debug Interface

Development cache debug panel showing:

- Total cache entries
- Valid vs expired entries
- Cache hit rate
- Age of oldest/newest entries

### Management Functions

```javascript
import { clearCache, clearMatchdayCache, getCacheStats } from "../lib/api";

// Clear all cache
clearCache();

// Clear specific matchday
clearMatchdayCache(15);

// Get statistics
const stats = getCacheStats();
```

### Admin API Endpoint

`/api/cache` provides server-side cache management:

```javascript
// POST /api/cache
{
  "action": "revalidate-all" | "revalidate-matches" | "revalidate-matchday" | "revalidate-specific",
  "tag": "cache-tag-name" // for revalidate-specific
}
```

## Cache Strategies

### Cache Keys

Client-side cache keys follow patterns:

- `matches-{matchday}` - Specific matchday fixtures
- `fixtures-all` - All fixtures
- `current-matchday` - Current matchday number

### Cache Invalidation

**Automatic:**

- TTL expiration (30 min for matches, 1 hour for matchday)
- Cleanup every 5 minutes on client

**Manual:**

- Debug panel controls
- API endpoint for server cache
- Function calls for client cache

### Performance Benefits

1. **Reduced API calls**: Subsequent requests served from cache
2. **Faster load times**: No network delay for cached data
3. **Better UX**: Instant navigation between cached matchdays
4. **API quota preservation**: Fewer external API calls

### Cache Hit Scenarios

- User navigating between recently viewed matchdays
- Multiple users requesting same matchday data
- Rapid successive requests for same data

### Cache Miss Scenarios

- First request for any data
- Cache expiration (TTL reached)
- Manual cache clearing
- Different matchday not yet cached

## Monitoring

### Console Logging

Cache operations are logged:

```
Cache hit for matches-15
Making API request to /api/matches?matchday=16
Cached response for matches-16 (TTL: 1800s)
```

### Visual Indicators

- Cache debug panel (development)
- Cache indicator button showing entry count
- API call counter showing actual external requests

## Best Practices

1. **Cache Duration**: Matches change less frequently, so 30-minute cache is safe
2. **Prefetching**: Consider prefetching adjacent matchdays
3. **Error Handling**: Cache errors don't break functionality
4. **Memory Management**: Automatic cleanup prevents memory leaks
5. **Development**: Debug panel helps understand cache behavior

## Configuration

### Environment Variables

No additional environment variables needed. Caching works with existing API key.

### Customization

Adjust cache TTL in `/src/lib/cache.js`:

```javascript
export const CACHE_CONFIG = {
  matches: {
    ttl: 1800, // Adjust as needed
    key: "matches",
  },
  // ...
};
```

## Troubleshooting

### Cache Not Working

1. Check console for cache hit/miss logs
2. Verify cache debug panel shows entries
3. Check network tab for actual API calls

### Stale Data

1. Use cache management functions to clear specific data
2. Check TTL configuration
3. Use manual revalidation API

### Memory Issues

Cache automatically cleans up expired entries every 5 minutes. For manual cleanup:

```javascript
cache.cleanup(); // Remove expired entries
cache.clear(); // Remove all entries
```

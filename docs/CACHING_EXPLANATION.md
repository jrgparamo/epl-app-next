# Route-Level vs Request-Level Caching in Next.js

## Overview

This document explains the key differences between Route-Level and Request-Level caching in Next.js, specifically in the context of API routes.

## Route-Level Caching

**What it does:** Caches the entire API route response at the Next.js server level.

```javascript
// Route-level caching
export const revalidate = 1800; // Cache entire route response for 30 minutes

export async function GET(request) {
  // This entire function's return value gets cached
  const data = await someAPICall();
  return NextResponse.json(data);
}
```

**Key characteristics:**
- Caches the **final response** that your API route returns
- Same cached response served to **all users** 
- Cache key based on the **route path + query parameters**
- Simpler but less granular control

## Request-Level Caching

**What it does:** Caches individual `fetch()` requests within your route handler.

```javascript
export async function GET(request) {
  // Request-level caching - caches this specific fetch call
  const response = await fetch('https://api.football-data.org/v4/matches', {
    next: {
      revalidate: 1800,
      tags: ['matches']
    }
  });
  
  const data = await response.json();
  
  // You can still process/transform the data
  const transformed = transformData(data);
  
  return NextResponse.json(transformed);
}
```

**Key characteristics:**
- Caches the **external API response** before processing
- Multiple fetch calls can have **different cache durations**
- Supports **cache tags** for selective invalidation
- More granular control over what gets cached

## Practical Example

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");

  // Request-level: Cache the external API call
  const response = await fetch(`${API_BASE_URL}/matches?matchday=${matchday}`, {
    next: {
      revalidate: 1800, // Cache external API response for 30 min
      tags: ['matches', `matchday-${matchday}`]
    }
  });

  const data = await response.json();
  
  // This processing happens every time (not cached)
  const transformed = data.matches.map(match => ({
    id: match.id,
    homeTeam: match.homeTeam.name,
    // ... custom transformation
  }));

  return NextResponse.json({ matches: transformed });
}
```

## When to Use Which?

### Use Route-Level when:
- Simple API routes that don't need processing
- You want to cache the entire response including transformations
- All users should get identical responses

### Use Request-Level when:
- Making multiple external API calls with different cache needs
- You want to cache raw API responses but still process data
- You need selective cache invalidation with tags
- Different parts of your route need different cache strategies

## For Your Football App

**Request-Level caching** is better because:
- You're transforming the API data (team names, etc.)
- Different matchdays can be cached/invalidated independently
- You can use tags to clear specific matchday caches when needed

## Current Implementation

In your matches API route, you have both caching mechanisms:

```javascript
// Route-level (commented out - not being used)
// export const revalidate = 1800;

// Request-level (actively being used)
const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  next: {
    revalidate: 1800,
    tags: ["matches", `matches-${matchday || "all"}`],
  },
});
```

The request-level caching is the appropriate choice for your use case, so the commented-out route-level export can be safely removed.

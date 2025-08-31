# Authentication Setup Guide

## Overview

This application uses NextAuth.js for authentication with Google OAuth provider.

## Setup Steps

### 1. Google OAuth Setup

To enable Google authentication, you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Set authorized JavaScript origins: `http://localhost:3000`
7. Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret

### 2. Environment Variables

Update `.env.local` with your Google OAuth credentials:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=Zq2+PD1xwExeHLf0VF0Q2KkVmtexLy6I3ffiBmWGaSM=
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### 3. Usage Examples

#### Basic Authentication Check

```javascript
import { useAuth } from "@/app/hooks/useAuth";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome {user.name}!</div>;
}
```

#### Protected Route

```javascript
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
}
```

#### Manual Sign In/Out

```javascript
import { signIn, signOut } from "next-auth/react";

// Sign in with Google
await signIn("google");

// Sign out
await signOut();

// Sign in with redirect
await signIn("google", { callbackUrl: "/dashboard" });
```

## File Structure

```
src/app/
├── api/auth/[...nextauth]/route.js  # NextAuth configuration
├── auth/signin/page.js              # Custom sign-in page
├── components/
│   ├── AuthProvider.js              # Session provider wrapper
│   ├── AuthButton.js                # Login/logout button
│   └── ProtectedRoute.js            # Route protection wrapper
└── hooks/
    └── useAuth.js                   # Authentication hook
```

## Features Implemented

✅ Google OAuth authentication
✅ Session management
✅ Login/logout UI components
✅ Protected routes
✅ Custom sign-in page
✅ User profile display
✅ Automatic redirects

## Next Steps

Consider adding:

- Database session storage (currently using JWT)
- Additional OAuth providers (GitHub, Discord, etc.)
- User roles and permissions
- Profile management page
- Remember me functionality
- Email verification

## Security Notes

- The `NEXTAUTH_SECRET` is used to encrypt JWT tokens
- Never commit `.env.local` to version control
- Use HTTPS in production
- Regularly rotate your OAuth secrets

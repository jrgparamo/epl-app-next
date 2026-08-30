# Admin Feature Implementation

I've successfully implemented an admin feature that allows admin-level users to edit predictions for all users.

## What was implemented:

### 1. Server-side admin support

- Updated `/api/predictions/route.js` to allow users with `user.user_metadata.is_admin = true` to manage any user's predictions
- Added admin check endpoints at `/api/admin/check` and `/api/admin/users`
- Maintained existing security for regular users (can only edit their own predictions)

### 2. Admin page UI

- Created `/admin` page with:
  - User list showing all registered users
  - Prediction management interface for selected users
  - Add, edit, and delete prediction functionality
  - Match information display

### 3. Navigation integration

- Added admin tab to bottom navigation (only visible to **global** admins —
  league admins reach `/admin` by URL; see "Authorization tiers" below)
- Updated main page routing to handle admin navigation

## Authorization tiers

> Canonical reference: [`AUTHENTICATION.md`](./AUTHENTICATION.md#admin-authorization-tiers).

Admin power comes in **two tiers**:

1. **Global admin** — `User.isAdmin === true`. Full access, including changing
   match **final scores** (`/api/admin/match-result`, guarded by `requireAdmin`).
2. **League admin ("effective admin")** — `isAdmin` on at least one league
   (`isEffectiveAdmin`). Can open the `/admin` panel (by URL — no nav tab) and
   view/edit/delete **any** user's predictions system-wide, but **cannot**
   change match final scores.

Note: the older Supabase `user.user_metadata.is_admin` flag is legacy; the
current source of truth is the `User.isAdmin` column via Auth.js + Prisma.

## Testing the feature:

1. **Dev server is running** at http://localhost:3000

2. **To test as admin user:**
   - Go to your Supabase dashboard → Authentication → Users
   - Select a user and edit their metadata to add: `{"is_admin": true}`
   - Or make them an admin of any league

3. **Expected behavior:**
   - **Global** admins see the "Admin" tab in bottom navigation; **league**
     admins do not (they open `/admin` by URL)
   - Admin page shows list of all users
   - Global and league admins can view/edit/delete predictions for any user
   - Only global admins can change match final scores; league admins get 403
   - Regular users don't see the tab and get 403 if accessing `/admin` directly

## Files created/modified:

- `src/app/admin/page.js` - Main admin interface
- `src/app/api/admin/check/route.js` - Admin status verification
- `src/app/api/admin/users/route.js` - User listing for admins
- `src/app/api/predictions/route.js` - Enhanced with admin support
- `src/app/components/BottomNavigation.js` - Added admin tab
- `src/app/page.js` - Added admin navigation routing

The implementation is secure, uses your existing patterns, and provides a clean admin interface for managing user predictions.

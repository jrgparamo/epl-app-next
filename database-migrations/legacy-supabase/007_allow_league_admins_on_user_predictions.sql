-- Migration: allow league admins to manage user_predictions
-- Drops the old "Users can manage their own predictions" policy and replaces it
-- with a policy that allows row access when the authenticated user is the owner
-- OR when the authenticated user is an admin of any league (league_members.is_admin = true).

BEGIN;

-- Remove the previous restrictive policy if it exists
DROP POLICY IF EXISTS "Users can manage their own predictions" ON user_predictions;

-- Create a new policy that allows owners and league admins to SELECT/INSERT/UPDATE/DELETE
CREATE POLICY "Owners and league admins can manage predictions" ON user_predictions
FOR ALL
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM league_members lm
    WHERE lm.user_id = auth.uid() AND lm.is_admin = TRUE
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM league_members lm
    WHERE lm.user_id = auth.uid() AND lm.is_admin = TRUE
  )
);

COMMIT;

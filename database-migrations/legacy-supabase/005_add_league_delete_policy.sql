-- Add missing DELETE policy for leagues table

-- League creators and admins can delete their leagues
CREATE POLICY "League creators and admins can delete leagues" ON leagues
FOR DELETE USING (
  created_by = auth.uid() OR
  id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

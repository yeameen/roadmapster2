-- Workspace invites: allows workspace owners to invite users by email
-- If the invited user already has an account, they get added immediately via server action.
-- If not, the invite is resolved when they sign up (ensureWorkspace checks pending invites).

CREATE TABLE workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);

-- RLS
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Workspace members can view invites for their workspace
CREATE POLICY workspace_invites_select ON workspace_invites FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

-- Owner/admin can create invites
CREATE POLICY workspace_invites_insert ON workspace_invites FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Owner/admin can update invites (revoke)
CREATE POLICY workspace_invites_update ON workspace_invites FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Owner/admin can delete invites
CREATE POLICY workspace_invites_delete ON workspace_invites FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Users can also see invites addressed to their email (for the accept-on-signup flow)
CREATE POLICY workspace_invites_select_by_email ON workspace_invites FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RPC: Accept all pending invites for the current user's email.
-- SECURITY DEFINER because the user is not yet a workspace member when accepting.
CREATE OR REPLACE FUNCTION accept_pending_invites()
RETURNS SETOF uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_invite RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  FOR v_invite IN
    SELECT * FROM workspace_invites
    WHERE email = v_email AND status = 'pending' AND expires_at > now()
  LOOP
    -- Check not already a member
    IF NOT EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = v_invite.workspace_id AND user_id = v_user_id
    ) THEN
      INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (v_invite.workspace_id, v_user_id, 'member');
    END IF;

    UPDATE workspace_invites SET status = 'accepted' WHERE id = v_invite.id;

    RETURN NEXT v_invite.workspace_id;
  END LOOP;
END;
$$;

-- RPC: Get workspace members with their emails (needs SECURITY DEFINER to join auth.users)
CREATE OR REPLACE FUNCTION get_workspace_members_with_email(ws_id uuid)
RETURNS TABLE(id uuid, workspace_id uuid, user_id uuid, role text, email text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, u.email, wm.created_at
  FROM workspace_members wm
  JOIN auth.users u ON u.id = wm.user_id
  WHERE wm.workspace_id = ws_id
  AND wm.workspace_id IN (SELECT user_workspace_ids(auth.uid()));
$$;

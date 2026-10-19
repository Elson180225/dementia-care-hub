CREATE TABLE sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now() + interval '12 hours'
);
CREATE TABLE admin_invitations (
 token_hash text PRIMARY KEY, email text NOT NULL, created_by uuid REFERENCES users(id),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours', used_at timestamptz
);

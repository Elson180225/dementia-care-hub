CREATE TABLE password_reset_tokens (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_tokens_user_id
 ON password_reset_tokens(user_id);

CREATE INDEX password_reset_tokens_expiry
 ON password_reset_tokens(expires_at);
CREATE TABLE translation_entries(
 source_key text NOT NULL, language text NOT NULL CHECK(language IN ('ms','zh')),
 source_text text NOT NULL, translated_text text NOT NULL DEFAULT '',
 review_type text NOT NULL CHECK(review_type IN ('standard','medical','professional')),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','needs-review')),
 revision integer NOT NULL DEFAULT 1, edited_by uuid REFERENCES users(id),
 expert_reviewed_by uuid REFERENCES users(id), approved_by uuid REFERENCES users(id),
 expert_reviewed_at timestamptz, approved_at timestamptz,
 review_comment text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(source_key,language)
);
CREATE TABLE translation_experts(
 user_id uuid NOT NULL REFERENCES users(id), scope text NOT NULL CHECK(scope IN ('medical','professional')),
 expertise text NOT NULL, assigned_by uuid NOT NULL REFERENCES users(id), assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,scope)
);
CREATE TABLE translation_history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_key text NOT NULL,language text NOT NULL,action text NOT NULL,
 actor_id uuid NOT NULL REFERENCES users(id),snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);

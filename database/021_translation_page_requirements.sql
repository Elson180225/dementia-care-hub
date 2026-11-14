CREATE TABLE translation_page_requirements(
 page_id text PRIMARY KEY,
 review_type text NOT NULL CHECK(review_type IN ('standard','medical','professional')),
 updated_by uuid NOT NULL REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);

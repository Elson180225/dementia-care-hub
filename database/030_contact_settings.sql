CREATE TABLE website_contact_settings (
 id text PRIMARY KEY CHECK (id='main'),
 project_email text NOT NULL,
 organiser_facebook text NOT NULL DEFAULT '',
 whatsapp_community text NOT NULL DEFAULT '',
 updated_by uuid REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_registration_settings ADD COLUMN general_instructions text NOT NULL DEFAULT '';
-- Keep an existing single route. Legacy dual-route demonstrations prefer the existing Google link.
UPDATE event_registration_settings SET website_enabled=false WHERE google_url<>'';
UPDATE event_registration_settings s SET google_url=a.registration_link,website_enabled=false
FROM activities a WHERE s.activity_id=a.id AND s.google_url='' AND NOT s.website_enabled AND a.registration_link ~ '^https?://';
UPDATE event_registration_settings SET fee='',instructions='' WHERE NOT paid;

CREATE TABLE directory_services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id),
 category text NOT NULL CHECK (category IN ('healthcare','services','financial','equipment','support-group','information')),
 service_type text NOT NULL CHECK (btrim(service_type) <> ''),
 description text,
 group_type text CHECK (group_type IN ('Government-led','NGO / private','Community-led')),
 address text, city text, state text, postcode text,
 languages text[] NOT NULL DEFAULT '{}',
 opening_hours text, eligibility text, fees text,
 accepting_volunteers boolean NOT NULL DEFAULT false, volunteer_details text,
 source text, source_url text, language text NOT NULL DEFAULT 'English',
 last_reviewed_at timestamptz, next_review_at timestamptz, admin_comment text,
 review_status text NOT NULL DEFAULT 'needs review' CHECK (review_status IN ('current','needs review','archived')),
 publication_status text NOT NULL DEFAULT 'unpublished' CHECK (publication_status IN ('unpublished','published')),
 CHECK (review_status <> 'archived' OR publication_status = 'unpublished'),
 CHECK (review_status <> 'current' OR last_reviewed_at IS NOT NULL)
);
CREATE INDEX directory_services_organisation_idx ON directory_services(organisation_id);
CREATE INDEX directory_services_published_idx ON directory_services(category) WHERE publication_status='published';

INSERT INTO directory_services (id, organisation_id, category, service_type, description, languages,
 opening_hours, eligibility, fees, accepting_volunteers, volunteer_details, source, source_url,
 language, last_reviewed_at, next_review_at, admin_comment, review_status, publication_status)
SELECT md5('legacy-directory-service:' || o.id || ':' || service.category || ':' || service.label)::uuid,
 o.id, service.category, service.label, o.specialist_field, o.languages, o.opening_hours,
 o.eligibility, o.fees, o.accepting_volunteers, o.volunteer_details, o.source, o.source_url,
 o.language, o.last_reviewed_at, o.next_review_at, o.admin_comment, o.review_status, o.publication_status
FROM organisations o
CROSS JOIN LATERAL (
 SELECT DISTINCT
  CASE
   WHEN o.category='support-group' OR label ~* 'support[ -]*group' THEN 'support-group'
   WHEN o.category IN ('healthcare','services','financial','equipment') THEN o.category
   ELSE 'information'
  END AS category, btrim(label) AS label
 FROM unnest(CASE WHEN cardinality(o.services)>0 THEN o.services ELSE
  ARRAY[CASE WHEN o.category='support-group' OR o.support_group THEN 'Support Group' ELSE 'Other' END] END) label
 WHERE btrim(label)<>''
 UNION
 SELECT 'support-group', 'Support Group'
 WHERE o.support_group AND o.category<>'support-group'
   AND cardinality(o.services)>0
   AND NOT EXISTS (SELECT 1 FROM unnest(o.services) label WHERE label ~* 'support[ -]*group')
) service;

UPDATE organisations SET category='Unspecified'
 WHERE category IN ('healthcare','services','financial','equipment','support-group');

ALTER TABLE organisations
 ALTER COLUMN category SET DEFAULT 'Other',
 DROP COLUMN services, DROP COLUMN specialist_field, DROP COLUMN languages,
 DROP COLUMN opening_hours, DROP COLUMN eligibility, DROP COLUMN fees,
 DROP COLUMN accepting_volunteers, DROP COLUMN volunteer_details, DROP COLUMN support_group;

CREATE TRIGGER directory_services_audit AFTER INSERT OR UPDATE OR DELETE ON directory_services
 FOR EACH ROW EXECUTE FUNCTION audit_record();

CREATE VIEW published_directory AS
 SELECT s.id, o.id AS organisation_id, o.name, o.category AS organisation_type, s.category, s.service_type,
  ARRAY[s.service_type] AS services, s.group_type, s.description, s.description AS specialist_field,
  coalesce(nullif(s.address,''),o.address) AS address,
  coalesce(nullif(s.city,''),o.city) AS city, coalesce(nullif(s.state,''),o.state) AS state,
  coalesce(nullif(s.postcode,''),o.postcode) AS postcode, o.phone, o.email, o.website,
  s.languages, s.opening_hours, s.eligibility, s.fees, s.accepting_volunteers, s.volunteer_details,
  s.category='support-group' AS support_group, s.source, s.source_url, s.language, s.last_reviewed_at,
  s.review_status, o.is_example
 FROM directory_services s JOIN organisations o ON o.id=s.organisation_id
 WHERE s.publication_status='published' AND s.review_status<>'archived'
  AND o.publication_status='published' AND o.review_status<>'archived' AND NOT o.is_example;

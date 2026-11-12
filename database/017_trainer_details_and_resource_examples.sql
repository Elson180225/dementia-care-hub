ALTER TABLE trainer_profiles
 ADD COLUMN assessment_result text NOT NULL DEFAULT '',
 ADD COLUMN healthcare_professional boolean,
 ADD COLUMN independent_teaching_scope text NOT NULL DEFAULT '';

ALTER TABLE organisations ADD COLUMN is_example boolean NOT NULL DEFAULT false;
INSERT INTO organisations(id,name,category,services,city,state,specialist_field,source,language,status,review_status,publication_status,is_example)
VALUES
 ('e1100000-0000-4000-8000-000000000001','EXAMPLE: Community support service','services',ARRAY['Home / Community Care'],'Bintulu','Sarawak','Demonstration only. This is not a real provider.','Team 11 demonstration data','English','published','needs review','published',true),
 ('e1100000-0000-4000-8000-000000000002','EXAMPLE: Financial support information','financial',ARRAY['Financial Assistance'],'Sibu','Sarawak','Demonstration only. No actual financial assistance is offered.','Team 11 demonstration data','English','published','needs review','published',true),
 ('e1100000-0000-4000-8000-000000000003','EXAMPLE: Practical aids information','equipment',ARRAY['Daily Living Aids'],'Kuching','Sarawak','Demonstration only. No equipment or service is supplied.','Team 11 demonstration data','English','published','needs review','published',true);

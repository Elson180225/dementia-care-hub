ALTER TABLE reminder_deliveries
 ADD COLUMN stage text NOT NULL DEFAULT 'invite' CHECK (stage IN ('invite','last-call')),
 DROP CONSTRAINT reminder_deliveries_pkey,
 ADD PRIMARY KEY (activity_id,starts_at,subscriber_id,stage);

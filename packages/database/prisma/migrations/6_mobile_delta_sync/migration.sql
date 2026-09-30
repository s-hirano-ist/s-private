CREATE TABLE "mobile_sync_versions" (
  "user_id" STRING(128) NOT NULL,
  "version" INT8 NOT NULL DEFAULT 0,
  CONSTRAINT "mobile_sync_versions_pkey" PRIMARY KEY ("user_id")
) WITH (schema_locked = false);

CREATE TABLE "mobile_sync_changes" (
  "user_id" STRING(128) NOT NULL,
  "version" INT8 NOT NULL,
  "domain" STRING(16) NOT NULL,
  "record_id" STRING(36) NOT NULL,
  "action" STRING(8) NOT NULL,
  CONSTRAINT "mobile_sync_changes_pkey" PRIMARY KEY ("user_id", "version")
) WITH (schema_locked = false);

-- Row triggers include writes made by the web app, import scripts, and status
-- transitions. The per-owner counter serializes journal writes in commit order.
CREATE FUNCTION record_mobile_sync_change() RETURNS TRIGGER LANGUAGE PLpgSQL AS $$
DECLARE
  changed_user TEXT;
  changed_id TEXT;
  next_version INT8;
BEGIN
  IF TG_OP = 'DELETE' THEN
    changed_user := (OLD).user_id;
    changed_id := (OLD).id;
  ELSE
    changed_user := (NEW).user_id;
    changed_id := (NEW).id;
  END IF;

  INSERT INTO mobile_sync_versions (user_id, version)
  VALUES (changed_user, 1)
  ON CONFLICT (user_id) DO UPDATE SET version = mobile_sync_versions.version + 1
  RETURNING version INTO next_version;

  INSERT INTO mobile_sync_changes (user_id, version, domain, record_id, action)
  VALUES (changed_user, next_version, TG_TABLE_NAME, changed_id,
    CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Grant wildcard permissions to existing super-admin role (idempotent).
UPDATE "Role"
SET permissions = '[{"entity":"*","actions":["create","read","update","delete"]}]'::jsonb
WHERE (permissions = '[]'::jsonb OR permissions IS NULL)
  AND ("legacyId" = 'admin-role' OR title = 'مدیر کل');

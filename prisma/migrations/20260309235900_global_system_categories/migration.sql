-- DataMigration: deduplicate per-user system categories and make them global (user_id = NULL).
--
-- Before this migration, system categories were duplicated for every user on registration.
-- After this migration, one canonical set of system categories exists with user_id = NULL,
-- shared across all users. The application-layer query already handles this via:
--   OR: [{ userId }, { isSystem: true }]

-- Step 1: Remap transactions.category_id from non-canonical duplicates to canonical system categories.
UPDATE transactions t
SET category_id = can.id
FROM categories c
JOIN (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  WHERE is_system = true
  ORDER BY name, type, created_at ASC
) can ON can.name = c.name AND can.type = c.type
WHERE t.category_id = c.id
  AND c.is_system = true
  AND c.id != can.id;

-- Step 2: Remap recurring_transactions.category_id from non-canonical duplicates.
UPDATE recurring_transactions r
SET category_id = can.id
FROM categories c
JOIN (
  SELECT DISTINCT ON (name, type) id, name, type
  FROM categories
  WHERE is_system = true
  ORDER BY name, type, created_at ASC
) can ON can.name = c.name AND can.type = c.type
WHERE r.category_id = c.id
  AND c.is_system = true
  AND c.id != can.id;

-- Step 3: Delete all non-canonical system category duplicates.
WITH canonical AS (
  SELECT DISTINCT ON (name, type) id
  FROM categories
  WHERE is_system = true
  ORDER BY name, type, created_at ASC
)
DELETE FROM categories
WHERE is_system = true
  AND id NOT IN (SELECT id FROM canonical);

-- Step 4: Set user_id = NULL for the remaining (canonical) system categories.
UPDATE categories
SET user_id = NULL
WHERE is_system = true;

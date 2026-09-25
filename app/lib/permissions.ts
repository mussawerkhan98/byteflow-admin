import "server-only";
import { db } from "./db";
import { getCurrentAdminUser, isAdministrator } from "./auth";

/**
 * Named permissions that can be granted to individual admin users.
 *
 * Administrators hold every permission implicitly — the role already means
 * "can do anything here" — so rows in admin_permissions only ever matter for
 * editors. Adding a permission is a matter of adding it to this list and
 * checking it at the endpoints it guards.
 */
export const PERMISSIONS = [
  {
    key: "marketing.send",
    label: "Create and send promotion emails",
    help: "Access the Marketing screen, manage the contact list, and send or schedule promotions.",
  },
  {
    key: "users.view",
    label: "View admin logins",
    help: "See the list of people who can sign in to this admin panel.",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const isPermissionKey = (value: unknown): value is PermissionKey =>
  PERMISSIONS.some((permission) => permission.key === value);

async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS admin_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(admin_user_id, permission)
  )`);
}

/** Every permission granted to one admin user, by their row id. */
export async function permissionsForUser(adminUserId: number): Promise<string[]> {
  try {
    await ensureTable();
    const result = await db.execute({
      sql: "SELECT permission FROM admin_permissions WHERE admin_user_id = ?",
      args: [adminUserId],
    });
    return result.rows.map((row) => String(row.permission));
  } catch {
    return [];
  }
}

/** Replace one user's grants with exactly the list given. */
export async function setPermissionsForUser(
  adminUserId: number,
  permissions: string[],
): Promise<void> {
  await ensureTable();
  const wanted = [...new Set(permissions.filter(isPermissionKey))];
  await db.execute({
    sql: "DELETE FROM admin_permissions WHERE admin_user_id = ?",
    args: [adminUserId],
  });
  for (const permission of wanted) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO admin_permissions (admin_user_id, permission) VALUES (?, ?)",
      args: [adminUserId, permission],
    });
  }
}

/**
 * Whether the person making this request holds a permission.
 *
 * Administrators always do. The environment-variable account is treated as an
 * administrator, matching how the rest of auth.ts sees it — otherwise the
 * fallback login used before the first migration could lock itself out.
 */
export async function hasPermission(permission: PermissionKey): Promise<boolean> {
  try {
    if (await isAdministrator()) return true;
    const current = await getCurrentAdminUser();
    if (!current) return false;
    await ensureTable();
    const result = await db.execute({
      sql: `SELECT 1 FROM admin_permissions p
            JOIN admin_users u ON u.id = p.admin_user_id
            WHERE lower(u.email) = ? AND u.active = 1 AND p.permission = ?
            LIMIT 1`,
      args: [current.email.trim().toLowerCase(), permission],
    });
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/** A 403 body shaped like the rest of the admin API's errors. */
export const permissionDenied = (permission: PermissionKey) =>
  Response.json(
    {
      error:
        PERMISSIONS.find((entry) => entry.key === permission)?.label
          ? `You do not have permission to ${PERMISSIONS.find((entry) => entry.key === permission)!.label.toLowerCase()}.`
          : "You do not have permission to do that.",
    },
    { status: 403 },
  );

/** Guard for route handlers: returns a 403 Response, or null when allowed. */
export async function requirePermission(
  permission: PermissionKey,
): Promise<Response | null> {
  return (await hasPermission(permission)) ? null : permissionDenied(permission);
}

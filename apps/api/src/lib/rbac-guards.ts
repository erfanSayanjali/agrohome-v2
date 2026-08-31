import { Fa } from "./errors";

export type PermissionRule = {
  entity?: string;
  actions?: string[];
};

export function parsePermissions(raw: unknown): PermissionRule[] {
  if (!Array.isArray(raw)) return [];
  return raw as PermissionRule[];
}

export function actorHasWildcard(permissions: unknown): boolean {
  return parsePermissions(permissions).some(
    (rule) =>
      rule.entity === "*" &&
      Array.isArray(rule.actions) &&
      rule.actions.length > 0
  );
}

export function permissionsIncludeWildcard(permissions: unknown): boolean {
  return parsePermissions(permissions).some((rule) => rule.entity === "*");
}

export function assertCanMutateRolePermissions(
  actorPermissions: unknown,
  nextPermissions: unknown
): { ok: true } | { ok: false; message: string } {
  if (
    permissionsIncludeWildcard(nextPermissions) &&
    !actorHasWildcard(actorPermissions)
  ) {
    return { ok: false, message: Fa.permissionDenied };
  }
  return { ok: true };
}

export function assertCanAssignRole(actorPermissions: unknown): {
  ok: true;
} | { ok: false; message: string } {
  if (!actorHasWildcard(actorPermissions)) {
    return { ok: false, message: Fa.permissionDenied };
  }
  return { ok: true };
}

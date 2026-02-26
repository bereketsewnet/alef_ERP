/**
 * Role-based access for the admin panel.
 * Only these roles can access the staff app; FIELD_STAFF use the member portal.
 */
export const ADMIN_PANEL_ROLES = [
  'OWNER',
  'GM',
  'HR',
  'FINANCE',
  'OPERATIONS',
  'MARKETING',
  'PROCUREMENT',
] as const

export type AdminRole = (typeof ADMIN_PANEL_ROLES)[number]

/** Paths that require specific roles. If not listed, only ADMIN_PANEL_ROLES check applies. */
export const ROLE_PATHS: Record<string, AdminRole[]> = {
  '/dashboard': ADMIN_PANEL_ROLES as unknown as AdminRole[],
  '/jobs': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/jobs/categories': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/vacancies': ['OWNER', 'GM', 'HR'],
  '/job-applications': ['OWNER', 'GM', 'HR'],
  '/crm/leads': ['OWNER', 'GM', 'MARKETING'],
  '/crm/bids': ['OWNER', 'GM', 'MARKETING'],
  '/roster': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/employees': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/attendance': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/clients': ['OWNER', 'GM', 'OPERATIONS'],
  '/assets': ['OWNER', 'GM', 'OPERATIONS', 'PROCUREMENT'],
  '/payroll': ['OWNER', 'GM', 'FINANCE'],
  '/billing': ['OWNER', 'GM', 'FINANCE'],
  '/incidents': ['OWNER', 'GM', 'OPERATIONS'],
  '/reports': ['OWNER', 'GM', 'HR', 'FINANCE', 'OPERATIONS'],
  '/settings/users': ['OWNER', 'GM'],
  '/settings/profile': ADMIN_PANEL_ROLES as unknown as AdminRole[],
}

/** Which roles can see each nav item (by href prefix or exact). */
export const NAV_ROLES: Record<string, AdminRole[]> = {
  '/dashboard': ['OWNER', 'GM', 'HR', 'FINANCE', 'OPERATIONS', 'MARKETING', 'PROCUREMENT'],
  '/jobs': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/vacancies': ['OWNER', 'GM', 'HR'],
  '/job-applications': ['OWNER', 'GM', 'HR'],
  '/crm/leads': ['OWNER', 'GM', 'MARKETING'],
  '/crm/bids': ['OWNER', 'GM', 'MARKETING'],
  '/roster': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/employees': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/attendance': ['OWNER', 'GM', 'HR', 'OPERATIONS'],
  '/clients': ['OWNER', 'GM', 'OPERATIONS'],
  '/assets': ['OWNER', 'GM', 'OPERATIONS', 'PROCUREMENT'],
  '/payroll': ['OWNER', 'GM', 'FINANCE'],
  '/billing': ['OWNER', 'GM', 'FINANCE'],
  '/incidents': ['OWNER', 'GM', 'OPERATIONS'],
  '/reports': ['OWNER', 'GM', 'HR', 'FINANCE', 'OPERATIONS'],
  '/settings/users': ['OWNER', 'GM'],
  '/settings/profile': ['OWNER', 'GM', 'HR', 'FINANCE', 'OPERATIONS', 'MARKETING', 'PROCUREMENT'],
}

export function canAccessPath(role: string, path: string): boolean {
  if (!ADMIN_PANEL_ROLES.includes(role as AdminRole)) return false
  if (ROLE_PATHS[path]) return ROLE_PATHS[path].includes(role as AdminRole)
  const sorted = Object.keys(ROLE_PATHS).sort((a, b) => b.length - a.length)
  for (const p of sorted) {
    if (path === p || path.startsWith(p + '/')) return ROLE_PATHS[p].includes(role as AdminRole)
  }
  return false
}

export function canSeeNav(role: string, href: string): boolean {
  const allowed = NAV_ROLES[href]
  if (!allowed) return false
  return allowed.includes(role as AdminRole)
}

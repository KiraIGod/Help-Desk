export const USER_ROLES = ['admin', 'manager', 'employee'] as const;

export type UserRoleName = (typeof USER_ROLES)[number];

export enum AuditAction {
  // ─── Ticket actions ──────────────────────────────────────────────────────
  CREATE_TICKET = 'ticket.created',
  UPDATE_TICKET = 'ticket.updated',
  ASSIGN_TICKET = 'ticket.assigned',
  CHANGE_TICKET_STATUS = 'ticket.status_updated',
  DELETE_TICKET = 'ticket.deleted',

  // ─── User actions ────────────────────────────────────────────────────────
  CREATE_USER = 'user.created',
  UPDATE_USER = 'user.updated',
  DELETE_USER = 'user.deleted',
  ASSIGN_USER_ROLES = 'user.roles_assigned',

  // ─── Auth actions ────────────────────────────────────────────────────────
  USER_REGISTERED = 'auth.registered',
  USER_LOGGED_IN = 'auth.login',
  USER_LOGGED_OUT = 'auth.logout',
}

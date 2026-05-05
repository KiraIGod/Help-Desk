export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly actorId: string | null,
    public readonly action: string,
    public readonly entityType: string,
    public readonly entityId: string | null,
    public readonly metadata: Record<string, unknown>,
    public readonly createdAt: Date,
  ) {}
}

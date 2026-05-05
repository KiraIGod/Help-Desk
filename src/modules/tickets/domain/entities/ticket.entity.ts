import { TicketPriority } from '../value-objects/ticket-priority';
import { TicketStatus } from '../value-objects/ticket-status';

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly requesterId: string,
    public readonly executorId: string | null,
    public readonly status: TicketStatus,
    public readonly priority: TicketPriority,
    public readonly deadlineAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly resolvedAt: Date | null = null,
    public readonly closedAt: Date | null = null,
    public readonly deletedAt: Date | null = null,
  ) {}

  static create(params: {
    id: string;
    title: string;
    description: string;
    requesterId: string;
    priority: TicketPriority;
    deadlineAt: Date | null;
  }): Ticket {
    const now = new Date();

    return new Ticket(
      params.id,
      params.title,
      params.description,
      params.requesterId,
      null,
      'open',
      params.priority,
      params.deadlineAt,
      now,
      now,
      null,
      null,
      null,
    );
  }

  assignExecutor(executorId: string): Ticket {
    return new Ticket(
      this.id,
      this.title,
      this.description,
      this.requesterId,
      executorId,
      this.status === 'open' ? 'in_progress' : this.status,
      this.priority,
      this.deadlineAt,
      this.createdAt,
      new Date(),
      this.resolvedAt,
      this.closedAt,
      this.deletedAt,
    );
  }

  updateStatus(status: TicketStatus): Ticket {
    const now = new Date();

    return new Ticket(
      this.id,
      this.title,
      this.description,
      this.requesterId,
      this.executorId,
      status,
      this.priority,
      this.deadlineAt,
      this.createdAt,
      now,
      status === 'resolved' ? now : this.resolvedAt,
      status === 'closed' ? now : status === 'resolved' ? null : this.closedAt,
      this.deletedAt,
    );
  }

  updateDetails(input: {
    title?: string;
    description?: string;
    priority?: TicketPriority;
    deadlineAt?: Date | null;
  }): Ticket {
    return new Ticket(
      this.id,
      input.title ?? this.title,
      input.description ?? this.description,
      this.requesterId,
      this.executorId,
      this.status,
      input.priority ?? this.priority,
      input.deadlineAt === undefined ? this.deadlineAt : input.deadlineAt,
      this.createdAt,
      new Date(),
      this.resolvedAt,
      this.closedAt,
      this.deletedAt,
    );
  }

  softDelete(): Ticket {
    return new Ticket(
      this.id,
      this.title,
      this.description,
      this.requesterId,
      this.executorId,
      this.status,
      this.priority,
      this.deadlineAt,
      this.createdAt,
      new Date(),
      this.resolvedAt,
      this.closedAt,
      new Date(),
    );
  }
}

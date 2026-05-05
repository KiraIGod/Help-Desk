import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TicketPriority } from '../../../domain/value-objects/ticket-priority';
import { TicketStatus } from '../../../domain/value-objects/ticket-status';

@Entity('tickets')
@Index(['requesterId'])
@Index(['executorId'])
@Index(['status'])
@Index(['priority'])
export class TicketOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId!: string;

  @Column({ name: 'executor_id', type: 'uuid', nullable: true })
  executorId!: string | null;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'pending', 'resolved', 'closed'],
    default: 'open',
  })
  status!: TicketStatus;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority!: TicketPriority;

  @Column({ name: 'deadline_at', type: 'timestamptz', nullable: true })
  deadlineAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

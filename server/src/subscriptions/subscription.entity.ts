import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Plan } from '../plans/plan.entity';
import { User } from '../users/user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @ManyToOne(
    () => Plan,
    plan => plan.subscribers,
  )
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ManyToOne(
    () => User,
    user => user.subscriptionPlans,
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp with time zone' })
  endTime: Date;

  constructor(params: {
    plan: Plan;
    user: User;
    startTime: Date;
    endTime: Date;
  }) {
    if (params !== undefined) {
      this.user = params.user;
      this.plan = params.plan;
      this.startTime = params.startTime;
      this.endTime = params.endTime;
    }
  }
}

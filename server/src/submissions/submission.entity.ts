import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge } from '../challenges/challenge.entity';
import { User } from '../users/user.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  answer: string;

  @Column({ name: 'is_passed', default: false })
  isPassed: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'challenge_id' })
  challengeId: number;

  @ManyToOne(
    () => Challenge,
    challenge => challenge.submissions,
  )
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @ManyToOne(
    () => User,
    user => user.submissions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  constructor(params: {
    answer: string;
    isPassed: boolean;
    challenge: Challenge;
    user: User;
  }) {
    if (params !== undefined) {
      this.answer = params.answer;
      this.isPassed = params.isPassed;
      this.challenge = params.challenge;
      this.user = params.user;
    }
  }
}

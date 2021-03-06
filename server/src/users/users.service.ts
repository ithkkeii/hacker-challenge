import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { SolvedChallenge } from '../solvedChallenges/solvedChallenge.entity';
import { Challenge } from '../challenges/challenge.entity';
import { UserAccountsService } from '../userAccounts/userAccounts.service';
import { SubmitAnswerInput } from './input/submitAnswerInput.input';
import { ChallengesService } from '../challenges/challenges.service';
import { UserAccount } from '../userAccounts/userAccount.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import * as bcrypt from 'bcrypt';
import { bcryptSaltRound } from '../config/vars';
import {
  CodeEvaluatorService,
  TestResult,
} from '../codeEvaluator/codeEvaluator.service';
import { SolvedChallengesService } from '../solvedChallenges/solvedChallenges.service';
import { Submission } from '../submissions/submission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(UserAccount)
    private readonly userAccountsRepository: Repository<UserAccount>,
    @InjectRepository(Submission)
    private readonly submissionsRepository: Repository<Submission>,

    private readonly userAccountsService: UserAccountsService,
    private readonly challengesService: ChallengesService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly solvedChallengesService: SolvedChallengesService,
    private readonly codeEvaluatorService: CodeEvaluatorService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({});
  }

  findById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ id });
  }

  async findPassedUsersByChallengeId(challengeId: number): Promise<User[]> {
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.solvedChallenges',
        'solvedChallenge',
        'solvedChallenge.challenge.id = :challengeId',
        { challengeId },
      )
      .getMany();
    return result;
  }

  async findLikedUsersByChallengeId(challengeId: number): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.likedChallenges',
        'likedChallenge',
        'likedChallenge.id = :challengeId',
        { challengeId },
      )
      .getMany();
  }

  async findSolvedChallengesByUserId(
    userId: number,
  ): Promise<SolvedChallenge[]> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.solvedChallenges',
        'solvedChallenge',
        'user.id = :userId',
        { userId },
      )
      .innerJoinAndSelect('solvedChallenge.challenge', 'challenge')
      .getOne();

    // const user = await this.usersService.find({
    //   where: { id: userId },
    //   relations: ['solvedChallenges', 'solvedChallenges.challenge'],
    // });

    return user ? user.solvedChallenges : [];
  }

  async findLikedChallengesByUserId(userId: number): Promise<Challenge[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['likedChallenges'],
    });

    return user ? user.likedChallenges : [];
  }

  async findUserAccountByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userAccount', 'account')
      .where('account.email = :email', { email })
      .getOne();
  }

  async findUserAccountByUserId(userId: number): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userAccount', 'account')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  async findUserBySocialId(
    socialId: string,
    providerName: 'google' | 'facebook' | 'github',
  ): Promise<User | undefined> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userExternalLogins', 'userExternalLogin')
      .leftJoinAndSelect(
        'userExternalLogin.externalAuthenticationProvider',
        'externalAuthenticationProvider',
      )
      .where('userExternalLogin.externalUserId = :socialId', { socialId })
      .andWhere('externalAuthenticationProvider.name = :name', {
        name: providerName,
      })
      .getOne();
  }

  async submitAnswer(
    submitAnswerInput: SubmitAnswerInput,
  ): Promise<TestResult[]> {
    const { userId, answer, challengeId, onlyRunCode } = submitAnswerInput;

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.solvedChallenges', 'solvedChallenge')
      .leftJoinAndSelect('user.submissions', 'submission')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) throw new NotFoundException(`Invalid user's id`);

    const challenge = await this.challengesService.findById(challengeId);
    if (!challenge) throw new NotFoundException(`Invalid challenge's id`);

    const { testCases } = challenge;

    const tests = testCases.map(tc => ({
      text: tc.text,
      testString: tc.testString,
    }));

    const testResults = await this.codeEvaluatorService.executeChallenge(
      answer,
      tests,
    );

    if (!onlyRunCode) {
      // User already pass challenge
      const userWasPassed = await this.solvedChallengesService.isUserPassedChallenge(
        userId,
        challengeId,
      );
      if (userWasPassed) return testResults;

      const isPassed =
        testResults.filter(tr => tr.pass).length === tests.length;
      if (isPassed) {
        const solvedChallenge = new SolvedChallenge({ challenge });
        user.solvedChallenges.push(solvedChallenge);
        // Save 1 time below
      }

      let newSubmission = new Submission({
        answer,
        challenge,
        user,
        isPassed,
      });
      newSubmission = await this.submissionsRepository.save(newSubmission);

      user.submissions.push(newSubmission);
      await this.usersRepository.save(user);
    }

    return testResults;
  }

  /**
   * @usageNotes
   * Totaly remove user `cannot recovered`. It will remove any persist data such as:
   * - Delete userAccount data.
   * - Delete userExternalLogins data.
   * - Delete subscriptions data. (Try to delete account not expired yet will cause Error).
   * - Delete solvedChallenges data.
   * - Delete likedChallenges data.
   * - Delete submissions data.
   * @param userId a number stand for user's id in database
   */
  async completelyRemoveUserById(userId: number): Promise<User> {
    let user = await this.findById(userId);
    if (!user) throw new NotFoundException(`Invalid user's id`);

    const isInSubscriptionTime = await this.subscriptionsService.isInSubscriptionTime(
      userId,
    );
    if (isInSubscriptionTime)
      throw new BadRequestException(`User still in subscription time`);
    else await this.subscriptionsService.removeByUserId(userId);

    user = await this.usersRepository.remove(user);

    const userAccount = await this.userAccountsService.findById(
      user.userAccountId,
    );
    if (userAccount) await this.userAccountsRepository.remove(userAccount);

    return user;
  }

  async activateUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`Invalid user's id`);

    user.isActivated = true;
    await this.usersRepository.save(user);
  }

  /**
   * @usageNotes Find all accounts that inactive for 24h
   */
  async findInactiveAccounts(): Promise<User[]> {
    // a day ago
    const limitTime = new Date(Date.now() - 1000 * 60 * 60 * 24);

    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.isActivated = false')
      .leftJoinAndSelect('user.userAccount', 'userAccount')
      .where('userAccount.registrationTime <= :limitTime', {
        limitTime,
      })
      .getMany();
  }

  async removeUserWithUserAccountByUserId(userId: number): Promise<User> {
    let user = await this.findById(userId);
    if (!user) throw new NotFoundException(`Invalid user's id`);

    user = await this.usersRepository.remove(user);

    const userAccount = await this.userAccountsService.findById(
      user.userAccountId,
    );
    if (userAccount) await this.userAccountsRepository.remove(userAccount);

    return user;
  }

  async removeInactiveAccounts(): Promise<void> {
    const inactiveAccounts = await this.findInactiveAccounts();
    await Promise.all(
      inactiveAccounts
        .map(u => u.id)
        .map(userId => this.removeUserWithUserAccountByUserId(userId)),
    );
  }

  async changeAccountPassword(
    userId: number,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user || !user.userAccountId)
      throw new NotFoundException(`Invalid user's id`);

    const account = await this.userAccountsService.findById(user.userAccountId);
    if (!account) throw new NotFoundException(`Invalid user's id`);

    const hashedPassword = await bcrypt.hash(newPassword, bcryptSaltRound);

    account.password = hashedPassword;
    await this.userAccountsRepository.save(account);
  }

  async isUserAccountActivated(userId: number): Promise<boolean>;
  async isUserAccountActivated(email: string): Promise<boolean>;
  async isUserAccountActivated(x: number | string): Promise<boolean> {
    if (typeof x === 'number') {
      const user = await this.findUserAccountByUserId(x);
      if (!user || !user.isActivated) return false;

      return true;
    }

    // x is a string
    const user = await this.findUserAccountByEmail(x);
    if (!user || !user.isActivated) return false;

    return true;
  }
}

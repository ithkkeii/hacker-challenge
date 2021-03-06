import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserAccountsService } from '../userAccounts/userAccounts.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { UserAccount } from '../userAccounts/userAccount.entity';
import { JwtService } from '@nestjs/jwt';
import { UserExternalLogin } from '../userExternalLogins/userExternalLogin.entity';
import { ExternalAuthenticationProvidersService } from '../externalAuthenticationProviders/externalAuthenticationProviders.service';
import { AuthProvider } from '../externalAuthenticationProviders/externalAuthenticationProvider.entity';
import { SignUpDto } from './dto/signUpDto.dto';
import { SignInDto } from './dto/signInDto.dto';
import { Challenge } from '../challenges/challenge.entity';
import { TestCase } from '../testCases/testCase.entity';
import { MailService } from '../mail/mail.service';
import {
  bcryptSaltRound,
  clientUrl,
  blacklistJwtExpirationTime,
} from '../config/vars';
import { RedisCacheService } from '../redisCache/redisCache.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(TestCase)
    private readonly testCasesRepository: Repository<TestCase>,

    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly userAccountsService: UserAccountsService,
    private readonly externalAuthenticationProvidersService: ExternalAuthenticationProvidersService,
    private readonly mailService: MailService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async generateToken(user: User): Promise<{ accessToken: string }> {
    const payload = {
      sub: user.id,
      totalPoints: user.totalPoints,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return {
      accessToken: `Bearer ${this.jwtService.sign(payload)}`,
    };
  }

  async validateUser(account: SignInDto): Promise<User> {
    const { email, password } = account;

    const user = await this.usersService.findUserAccountByEmail(email);
    if (!user || !user.userAccount)
      throw new BadRequestException('Invalid email or password');

    const isValidPassword = await bcrypt.compare(
      password,
      user.userAccount.password,
    );
    if (!isValidPassword)
      throw new BadRequestException('Invalid email or password');

    return user;
  }

  /**
   *
   * @param externalId
   * *Return exist account with social'id
   * *Or return new account with social'id
   */
  async signInWithExternalProvider(
    externalId: string,
    providerName: AuthProvider,
    payload?: { email: string | undefined; name: string | undefined },
  ): Promise<User> {
    let user = await this.usersService.findUserBySocialId(
      externalId,
      providerName,
    );

    if (!user) {
      const provider = await this.externalAuthenticationProvidersService.findByName(
        providerName,
      );
      if (!provider)
        throw new NotFoundException(
          `External provider(${providerName}) not found`,
        );

      user = new User({
        totalPoints: 0,
        firstName: payload?.name,
        isActivated: true,
      });
      user.userExternalLogins = [
        new UserExternalLogin({
          externalUserId: externalId,
          externalAuthenticationProviderId: provider.id,
          email: payload?.email,
          firstName: payload?.name,
        }),
      ];
      user = await this.usersRepository.save(user);
    }

    return user;
  }

  async mergeExternalProvider(
    currentUserId: number,
    mergeUserId: number,
  ): Promise<void> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: ['userExternalLogins', 'likedChallenges'],
    });
    if (!currentUser) throw new NotFoundException(`Invalid current user id`);

    const mergeUser = await this.usersRepository.findOne({
      where: { id: mergeUserId },
      relations: ['userExternalLogins', 'likedChallenges'],
    });
    if (!mergeUser) throw new NotFoundException(`Invalid merge user id`);

    // If mergeUser is currentUser (malicious request)
    if (mergeUser === currentUser)
      throw new BadRequestException('Invalid userId & provider');

    const notUndefined = <T>(x: T | undefined): x is T => x !== undefined;
    const combinedChallenges = [
      ...currentUser.likedChallenges,
      ...mergeUser.likedChallenges,
    ];
    const combinedUniqueChallenges = combinedChallenges
      .map(c => c.id)
      .filter(
        (challengeId, index, arrChallengeId) =>
          arrChallengeId.indexOf(challengeId) === index,
      )
      .map(challengeId => combinedChallenges.find(c => c.id === challengeId))
      .filter(notUndefined);

    // Already use guard to ensure that account dont have multiple provider
    const [provider] = mergeUser.userExternalLogins;

    currentUser.likedChallenges = combinedUniqueChallenges;
    currentUser.userExternalLogins.push(provider);

    // await this.usersRepository.remove(mergeUser);
    await this.usersService.completelyRemoveUserById(mergeUser.id);
    await this.usersRepository.save(currentUser);
  }

  async signIn(account: SignInDto): Promise<User> {
    const { email, password } = account;

    const user = await this.usersService.findUserAccountByEmail(email);
    if (!user || !user.userAccount)
      throw new BadRequestException('Invalid email or password');

    const isValidPassword = await bcrypt.compare(
      password,
      user.userAccount.password,
    );
    console.log(isValidPassword);
    if (!isValidPassword)
      throw new BadRequestException('Invalid email or password');

    return user;
  }

  async signUp(accountDetails: SignUpDto): Promise<User> {
    const { email, firstName, lastName, password } = accountDetails;

    let userAccount = await this.userAccountsService.findByEmail(email);
    if (userAccount) throw new BadRequestException('Email is already exist');

    const hashedPassword = await bcrypt.hash(password, bcryptSaltRound);
    userAccount = new UserAccount({
      email,
      password: hashedPassword,
    });

    let user = new User({
      totalPoints: 0,
      firstName,
      lastName,
      isActivated: false,
      userAccount,
    });
    user = await this.usersRepository.save(user);

    await this.mailService.sendActivateEmail(clientUrl, {
      userId: user.id,
      email,
      name: `${user.firstName} ${user.lastName}`,
    });

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findUserAccountByEmail(email);
    // return success we dont care user provide right email or not.
    // we also dont need to alert user that email is not valid.
    if (!user || !user.userAccount) return;

    const isActivated = this.usersService.isUserAccountActivated(email);
    if (!isActivated) return;

    await this.mailService.sendResetPasswordEmail(clientUrl, {
      email: user.userAccount.email,
      name: `${user.firstName} ${user.lastName}`,
      userId: user.id,
    });
  }

  /**
   * @param token resetPasswordToken
   * @usageNotes
   * - token is a key in redis storage,
   * this func will return value of the key.
   */
  async findResetPasswordTokenValue(token: string): Promise<number | null> {
    const result = await this.redisCacheService.getCacheManager().get(token);

    if (result === null) return result;

    if (typeof result !== 'number')
      throw new BadRequestException('Invalid token');

    return result;
  }

  async isInBlacklist(token: string): Promise<boolean> {
    const result = await this.redisCacheService.getCacheManager().get(token);
    if (typeof result === 'string') return true;
    return false;
  }

  private extractBearerToken(bearerToken: string): string {
    const [, token] = bearerToken.split(' ');
    return token;
  }

  async isTokenRevoked(bearerToken: string): Promise<boolean> {
    const token = this.extractBearerToken(bearerToken);
    const isRevoked = await this.isInBlacklist(token);
    return isRevoked;
  }

  async signOut(bearerToken: string): Promise<void> {
    const token = this.extractBearerToken(bearerToken);
    await this.redisCacheService
      .getCacheManager()
      .set(token, '', { ttl: blacklistJwtExpirationTime });
  }
}

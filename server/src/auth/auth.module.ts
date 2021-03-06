import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
  forwardRef,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { UserAccountsModule } from '../userAccounts/userAccounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { GithubStrategy } from './strategies/github.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ExternalAuthenticationProvidersModule } from '../externalAuthenticationProviders/externalAuthenticationProviders.module';
import { jwtExpirationTime, jwtPrivateKey } from '../config/vars';
import { authenticate, AuthenticateOptions } from 'passport';
import { Request, Response } from 'express';
import { UserExternalLoginsModule } from '../userExternalLogins/userExternalLogins.module';
import { Challenge } from '../challenges/challenge.entity';
import { TestCase } from '../testCases/testCase.entity';
import { MailService } from '../mail/mail.service';
import { RedisCacheModule } from '../redisCache/redisCache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Challenge, TestCase]),
    // PassportModule.register({
    //   defaultStrategy: 'jwt',
    //   property: 'user',
    //   session: false,
    // }),
    JwtModule.register({
      secret: jwtPrivateKey,
      signOptions: { expiresIn: jwtExpirationTime },
    }),
    forwardRef(() => UsersModule),
    UserAccountsModule,
    UserExternalLoginsModule,
    ExternalAuthenticationProvidersModule,
    RedisCacheModule,
  ],
  controllers: [AuthController],
  providers: [
    MailService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GithubStrategy,
    FacebookStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    const githubOptions: AuthenticateOptions = {
      scope: ['user:email'],
      state: undefined,
      session: false,
    };
    consumer
      .apply((req: Request, res: Response, next: () => void) => {
        githubOptions.state = JSON.stringify([
          req.query.type,
          req.query.userId,
        ]);
        next();
      }, authenticate('github', githubOptions))
      .forRoutes(
        { path: 'api/auth/github', method: RequestMethod.GET },
        { path: 'api/auth/github/callback', method: RequestMethod.GET },
      );

    const googleOptions: AuthenticateOptions = {
      state: undefined,
      session: false,
    };
    consumer
      .apply((req: Request, res: Response, next: () => void) => {
        googleOptions.state = JSON.stringify([
          req.query.type,
          req.query.userId,
        ]);
        next();
      }, authenticate('google', googleOptions))
      .forRoutes(
        { path: 'api/auth/google', method: RequestMethod.GET },
        { path: 'api/auth/google/callback', method: RequestMethod.GET },
      );

    const facebookOptions: AuthenticateOptions = {
      state: undefined,
      session: false,
    };
    consumer
      .apply((req: Request, res: Response, next: () => void) => {
        facebookOptions.state = JSON.stringify([
          req.query.type,
          req.query.userId,
        ]);
        next();
      }, authenticate('facebook', facebookOptions))
      .forRoutes(
        { path: 'api/auth/facebook', method: RequestMethod.GET },
        { path: 'api/auth/facebook/callback', method: RequestMethod.GET },
      );
  }
}

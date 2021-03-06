import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from '../config/config.service';
import { UserExternalLogin } from './userExternalLogin.entity';
import { UserExternalLoginsService } from './userExternalLogins.service';

describe('UserExternalLoginsService', () => {
  let app: INestApplication;
  let userExternalLoginsService: UserExternalLoginsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(configService.getTypeOrmTestConfig()),
        TypeOrmModule.forFeature([UserExternalLogin]),
      ],
      providers: [UserExternalLoginsService],
    }).compile();

    userExternalLoginsService = module.get<UserExternalLoginsService>(
      UserExternalLoginsService,
    );

    app = module.createNestApplication();
    await app.init();
  });

  it('should be defined', () => {
    expect(userExternalLoginsService).toBeDefined();
  });

  afterEach(async () => await app.close());
});

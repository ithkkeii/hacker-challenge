import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExternalAuthenticationProvider,
  AuthProvider,
} from './externalAuthenticationProvider.entity';
import { ExternalAuthenticationProvidersRepository } from './externalAuthenticationProviders.repository';

@Injectable()
export class ExternalAuthenticationProvidersService {
  constructor(
    private readonly externalAuthenticationProvidersRepository: ExternalAuthenticationProvidersRepository,
  ) {}
  // constructor(
  //   @InjectRepository(ExternalAuthenticationProvider)
  //   private readonly externalAuthenticationProviderRepository: Repository<
  //     ExternalAuthenticationProvider
  //   >,
  // ) {}

  async findById(
    id: number,
  ): Promise<ExternalAuthenticationProvider | undefined> {
    return this.externalAuthenticationProvidersRepository.findOne({ id });
  }

  async findByName(
    name: AuthProvider,
  ): Promise<ExternalAuthenticationProvider | undefined> {
    return this.externalAuthenticationProvidersRepository.findOne({ name });
  }
}

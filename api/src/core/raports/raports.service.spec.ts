import { Test, TestingModule } from '@nestjs/testing';
import { RaportsService } from './raports.service';

describe('RaportsService', () => {
  let service: RaportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RaportsService],
    }).compile();

    service = module.get<RaportsService>(RaportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

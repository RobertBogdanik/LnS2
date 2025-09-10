import { Test, TestingModule } from '@nestjs/testing';
import { SheetTsService } from './sheet.ts.service';

describe('SheetTsService', () => {
  let service: SheetTsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SheetTsService],
    }).compile();

    service = module.get<SheetTsService>(SheetTsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

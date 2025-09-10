import { Test, TestingModule } from '@nestjs/testing';
import { RaportsController } from './raports.controller';

describe('RaportsController', () => {
  let controller: RaportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaportsController],
    }).compile();

    controller = module.get<RaportsController>(RaportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

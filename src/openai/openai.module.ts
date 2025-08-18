import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { UserContextService } from 'src/user-context/user-context.service';

@Module({
  providers: [OpenaiService, UserContextService],
  exports: [OpenaiService],
})
export class OpenaiModule {}

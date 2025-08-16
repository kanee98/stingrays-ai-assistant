import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [WhatsappController],
  providers: [WhatsappService]
})
export class WhatsappModule {}

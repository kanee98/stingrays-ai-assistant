import { Body, Controller, Get, HttpCode, Post, Query, Logger } from '@nestjs/common';
import * as process from 'node:process';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);
  private processedMessages = new Set<string>(); // dedupe messages

  constructor(private readonly whatsAppService: WhatsappService) {}

  // GET endpoint for WhatsApp verification
  @Get('webhook')
  verifyWebhook(@Query() query: any): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verificationToken =
      process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;

    if (!mode || !token) {
      this.logger.warn('Webhook verification failed: missing token or mode');
      return 'Error verifying token';
    }

    if (mode === 'subscribe' && token === verificationToken) {
      this.logger.log(`Webhook verified successfully: ${challenge}`);
      return challenge?.toString();
    }

    this.logger.warn('Webhook verification failed: invalid token');
    return 'Error verifying token';
  }

  // POST endpoint for incoming WhatsApp messages
  @Post('webhook')
  @HttpCode(200)
  async handleIncomingWhatsappMessage(@Body() request: any) {
    const messages =
      request?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
    if (!messages.length) return;

    const message = messages[0];
    const messageSender = message.from;
    const messageID = message.id;

    // Deduplicate
    if (this.processedMessages.has(messageID)) return;
    this.processedMessages.add(messageID);

    this.logger.log(`Incoming message from ${messageSender}: ${JSON.stringify(message)}`);

    await this.whatsAppService.markMessageAsRead(messageID);

    switch (message.type) {
      case 'text':
        const userText = message.text.body;

        // Generate a proper reply (replace with OpenAI or your logic)
        const replyText = await this.generateReply(userText);

        // Send reply to user
        await this.whatsAppService.sendWhatsAppMessage(messageSender, replyText, messageID);

        this.logger.log(`Replied to ${messageSender}: ${replyText}`);
        break;

      default:
        this.logger.warn(`Unsupported message type: ${message.type}`);
        break;
    }
  }

  // Example reply generator (replace with OpenAI API call if needed)
  private async generateReply(userMessage: string): Promise<string> {
    if (!userMessage) return 'Hello! How can I assist you today?';

    if (userMessage.toLowerCase().includes('kandy')) {
      return 'Our Kandy location is at 123 River Rd, Kandy. 🏊‍♂️';
    }

    return 'Hey there! 🌊🏊‍♂️ How can I help you with Stingrays Swim School today?';
  }
}
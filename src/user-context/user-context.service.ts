import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class UserContextService {
    private readonly logger = new Logger(UserContextService.name);
    private readonly redis = new Redis(process.env.REDIS_URL || '');
    private readonly salt = process.env.HASHING_SALT || '';
    private readonly contextExpirationTime = 10800;
    
    hashPhoneNumber(phoneNumber: string){
        const hashedPhoneNumber = crypto
            .createHmac('sha256', this.salt)
            .update(phoneNumber)
            .digest('hex');
        return hashedPhoneNumber;
    }

    async saveToContext(
        content:string, 
        role:'user' | 'assistant' | 'system', 
        userID: string
    ){
        try{
            const value = JSON.stringify({ role, content});
            const hashedUserID = this.hashPhoneNumber(userID);
            await this.redis.rpush(hashedUserID, value);
            await this.redis.expire(hashedUserID, this.contextExpirationTime);

            return 'Context Saved';
        } catch(error){
            this.logger.error('Error Saving Context', error);
            return 'Error Saving Context';
        }
    } 

    async saveAndFetchContext(
        content: string,
        role: 'user' | 'assistant' | 'system',
        userID: string,
    ){
        try{
            const pipeline = this.redis.pipeline();
            const value = JSON.stringify({ role, content});
            
            const hashedUserID = this.hashPhoneNumber(userID);

            pipeline.rpush(hashedUserID, value);

            pipeline.lrange(hashedUserID, 0, -1);

            pipeline.expire(hashedUserID, this.contextExpirationTime);

            const results = await pipeline.exec();

            if (!results) {
                this.logger.error('Pipeline execution returned null');
                return [];
            }

            const conversationContext = results[1][1] as string[];

            return conversationContext.map((item)=>JSON.parse(item));
        }catch(error){
            this.logger.error('Error Saving Context', error);
            return [];
        }
    }

    async getConversationHistory(userID: string){
        try{
            const hashedUserID = this.hashPhoneNumber(userID);
            const conversation = await this.redis.lrange(hashedUserID, 0, -1);

            return conversation.map((item)=>JSON.parse(item));
        }catch(error){
            this.logger.error(error);
            return[];
        }
    }
}
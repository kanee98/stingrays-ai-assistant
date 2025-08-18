import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class UserContextService {
    private readonly logger = new Logger(UserContextService.name);
    private readonly redis = new Redis(process.env.REDIS_URL || '');
    
    async saveToContext(
        content:string, 
        role:'user' | 'assistant' | 'system', 
        userID: string
    ){
        try{
            const value = JSON.stringify({ role, content});
            await this.redis.rpush(userID, value);
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
            
            pipeline.rpush(userID, value);
            pipeline.lrange(userID, 0, -1);

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
            const conversation = await this.redis.lrange(userID, 0, -1);

            return conversation.map((item)=>JSON.parse(item));
        }catch(error){
            this.logger.error(error);
            return[];
        }
    }
}
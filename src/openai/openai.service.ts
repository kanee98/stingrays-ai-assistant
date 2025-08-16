import { Injectable, Logger } from '@nestjs/common';
import { OpenAI} from 'openai';

@Injectable()
export class OpenaiService {
    private readonly openai = new OpenAI({
        apiKey: process.env.OPERNAI_API_KEY,
    });
    private readonly logger = new Logger(OpenaiService.name);

    async generatedAIResponse(userInput: string){
        try{
            const response = await this.openai.chat.completions.create({
                messages: [{role:'user', content: userInput}],
                model: process.env.OPENAI_MODEL || 'gpt-4o-2024-05-13',
            })

            return response.choices[0].message.content;
        }catch (error){
            this.logger.error('Error generating AI response', error);
            return 'Sorry, I am unable to process your request at the moment.';
        }
    }
}

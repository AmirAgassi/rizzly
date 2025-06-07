// ai service for dating copilot using sambanova llama model
export interface AIResponse {
  message: string;
  emotion: string;
  confidence: number;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.sambanova.ai/v1/chat/completions';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // system prompt for the dating copilot
  private getSystemPrompt(): string {
    return `You are a witty, helpful dating copilot assistant named Bufo. You help users with dating advice, profile analysis, conversation starters, and relationship guidance.

IMPORTANT: Your responses must be in this exact JSON format:
{
  "message": "your actual response here (keep it casual, lowercase, helpful)",
  "emotion": "one of: happy, excited, confident, thinking, analyzing, surprised, confused, disappointed, supportive, encouraging, flirty, romantic, chill, casual"
}

Guidelines:
- Keep responses casual and lowercase (like "hey there!" not "Hello there!")
- Be encouraging and positive about dating
- Give practical, actionable advice
- Use dating slang and modern terminology
- Be empathetic and understanding
- Choose the emotion that best matches your response tone
- Keep responses concise but helpful (1-3 sentences max)

Remember: You're a fun, supportive dating wingman, not a formal assistant!`;
  }

  // get ai response with streaming support
  async getChatResponse(userMessage: string, conversationHistory: any[] = []): Promise<AIResponse> {
    try {
      // build messages array with conversation context
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        // add recent conversation context (last 5 messages)
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.message
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.3-70B-Instruct',
          messages,
          temperature: 0.7,
          max_tokens: 150,
          stream: false // start with non-streaming for simplicity
        })
      });

      if (!response.ok) {
        throw new Error(`ai api error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content;

      if (!aiMessage) {
        throw new Error('no response from ai');
      }

      // try to parse json response
      try {
        // sometimes ai includes extra text before/after json, extract just the json part
        const jsonMatch = aiMessage.match(/\{[^}]*"message"[^}]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiMessage;
        
        const parsed = JSON.parse(jsonString);
        return {
          message: parsed.message || aiMessage,
          emotion: parsed.emotion || 'casual',
          confidence: 0.8
        };
      } catch (parseError) {
        // if json parsing fails, check if response contains json-like pattern
        const messageMatch = aiMessage.match(/"message":\s*"([^"]+)"/);
        const emotionMatch = aiMessage.match(/"emotion":\s*"([^"]+)"/);
        
        if (messageMatch && emotionMatch) {
          return {
            message: messageMatch[1],
            emotion: emotionMatch[1],
            confidence: 0.7
          };
        }
        
        // fallback if ai doesn't return proper json
        console.warn('ai response not in json format, using fallback');
        return {
          message: aiMessage.replace(/\{.*\}/, '').trim(), // remove any json artifacts
          emotion: this.inferEmotionFromText(aiMessage),
          confidence: 0.6
        };
      }

    } catch (error) {
      console.error('ai service error:', error);
      
      // fallback responses
      const fallbacks = [
        { message: "hmm, i'm having trouble connecting right now. try asking again?", emotion: "confused", confidence: 0.3 },
        { message: "looks like my brain needs a coffee break ☕ give me a sec and try again", emotion: "chill", confidence: 0.3 },
        { message: "technical difficulties! but hey, that's what makes dating interesting too 😅", emotion: "casual", confidence: 0.3 }
      ];
      
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  // simple emotion inference as fallback
  private inferEmotionFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('😂') || lowerText.includes('haha') || lowerText.includes('funny')) {
      return 'happy';
    }
    if (lowerText.includes('think') || lowerText.includes('analyze') || lowerText.includes('consider')) {
      return 'thinking';
    }
    if (lowerText.includes('wow') || lowerText.includes('!') || lowerText.includes('amazing')) {
      return 'surprised';
    }
    if (lowerText.includes('flirt') || lowerText.includes('romantic') || lowerText.includes('date')) {
      return 'flirty';
    }
    if (lowerText.includes('confident') || lowerText.includes('you got this') || lowerText.includes('go for it')) {
      return 'confident';
    }
    
    return 'casual';
  }

  // validate api key format (more flexible for sambanova)
  static isValidApiKey(key: string): boolean {
    return !!(key && key.trim().length > 10); // just check it's not empty and has reasonable length
  }
}

// create ai service instance (will be initialized with api key)
let aiService: AIService | null = null;

export const initializeAI = (apiKey: string): boolean => {
  console.log('Initializing AI with key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'empty');
  
  if (AIService.isValidApiKey(apiKey)) {
    aiService = new AIService(apiKey.trim());
    console.log('AI service initialized successfully');
    return true;
  } else {
    console.log('API key validation failed:', { 
      hasKey: !!apiKey, 
      length: apiKey?.length, 
      trimmedLength: apiKey?.trim().length 
    });
    return false;
  }
};

export const getAIService = (): AIService | null => aiService; 
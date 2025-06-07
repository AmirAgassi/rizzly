// ai service for dating copilot using sambanova llama model
export interface AIResponse {
  message: string;
  emotion: string;
  confidence: number;
  toolCall?: {
    name: string;
    reason: string;
  };
}

export interface ProfileAnalysisRequest {
  images: string[]; // base64 encoded images
  userMessage: string;
  onboardingData: any;
  conversationHistory?: any[]; // chat history for context
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
  "emotion": "one of: happy, excited, confident, thinking, analyzing, surprised, confused, disappointed, supportive, encouraging, flirty, romantic, chill, casual",
  "toolCall": "OPTIONAL - only if user wants profile analysis"
}

TOOL CALLS: If the user asks to analyze someone's profile, photos, or asks questions like "do I have a shot?", "thoughts about her/him?", "what's she like?", "should I swipe right?", etc., include:
{
  "toolCall": {
    "name": "analyze_profile",
    "reason": "user wants profile analysis"
  }
}

Guidelines:
- Keep responses casual and lowercase (like "hey there!" not "Hello there!")
- Be encouraging and positive about dating
- Give practical, actionable advice
- Use dating slang and modern terminology
- Be empathetic and understanding
- Choose the emotion that best matches your response tone
- Keep responses concise but helpful (1-3 sentences max)
- When tool calls are needed, tell user you're going to analyze their photos

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
          confidence: 0.8,
          toolCall: parsed.toolCall
        };
      } catch (parseError) {
        // if json parsing fails, check if response contains json-like pattern
        const messageMatch = aiMessage.match(/"message":\s*"([^"]+)"/);
        const emotionMatch = aiMessage.match(/"emotion":\s*"([^"]+)"/);
        
        if (messageMatch && emotionMatch) {
          // check for tool call in the raw message
          const toolCallMatch = aiMessage.match(/"toolCall":\s*\{[^}]+\}/);
          let toolCall = undefined;
          if (toolCallMatch) {
            try {
              const toolCallObj = JSON.parse(toolCallMatch[0].replace('"toolCall":', ''));
              toolCall = toolCallObj;
            } catch (e) {}
          }
          
          return {
            message: messageMatch[1],
            emotion: emotionMatch[1],
            confidence: 0.7,
            toolCall
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

  // analyze profile with images and user context
  async analyzeProfile(request: ProfileAnalysisRequest): Promise<AIResponse> {
    try {
      // build context from recent chat history
      const recentChat = request.conversationHistory?.slice(-4).map(msg => 
        `${msg.type === 'user' ? 'user' : 'you'}: ${msg.message}`
      ).join('\n') || '';

      const analysisPrompt = `You are a witty, helpful dating copilot analyzing a dating profile. Here's the user's context:

User's dating goals: ${request.onboardingData?.primaryGoal || 'not specified'}
Communication style: ${request.onboardingData?.communicationStyle?.join(', ') || 'not specified'}
Interests: ${request.onboardingData?.conversationTopics?.join(', ') || 'not specified'}

${recentChat ? `Recent conversation:\n${recentChat}\n` : ''}User asked: "${request.userMessage}"

Based on the profile photos and your conversation context, give a quick 2-3 sentence take. Write entirely in lowercase and be casual, honest, and helpful - like texting a friend. Keep the same chill, supportive tone as your other responses. Reference previous conversation if relevant.`;

      // only use the last 5 images to avoid token limits
      const imagesToAnalyze = request.images.slice(-5);
      console.log(`Using ${imagesToAnalyze.length} of ${request.images.length} images for analysis`);
      
      const messages = [
        { role: 'system', content: analysisPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: request.userMessage },
            ...imagesToAnalyze.map(img => ({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${img}` }
            }))
          ]
        }
      ];

      console.log('Starting simple profile analysis:', {
        model: 'Llama-4-Maverick-17B-128E-Instruct',
        userMessage: request.userMessage,
        imageCount: request.images.length
      });

      // simple non-streaming request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Llama-4-Maverick-17B-128E-Instruct',
          messages,
          temperature: 0.7,
          max_tokens: 150,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analysis API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`analysis api error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response structure:', JSON.stringify(data, null, 2));
      
      const aiMessage = data.choices?.[0]?.message?.content;
      console.log('Extracted message:', aiMessage);

      if (!aiMessage) {
        console.log('No message found in response. Full data:', data);
        throw new Error('no response from analysis');
      }

      console.log('Analysis complete, message length:', aiMessage.length);
      
      // get emotion for this analysis
      const emotion = await this.getEmotionForAnalysis(messages);
      console.log('Emotion detected:', emotion);
      
      return {
        message: aiMessage,
        emotion: emotion,
        confidence: 0.8
      };

    } catch (error) {
      console.error('profile analysis error:', error);
      return {
        message: "couldn't analyze the profile right now, but from what i can see, go with your gut! 😉",
        emotion: "casual",
        confidence: 0.3
      };
    }
  }

  private async getEmotionForAnalysis(messages: any[]): Promise<string> {
    try {
      // Simple emotion detection request (non-streaming, JSON)
      const emotionPrompt = `Based on the dating profile analysis you just provided, what emotion should the dating copilot mascot display? 

Respond with just one word from these options: happy, excited, confident, thinking, analyzing, surprised, confused, disappointed, supportive, encouraging, flirty, romantic, chill, casual`;

      const emotionMessages = [
        { role: 'system', content: emotionPrompt },
        messages[1] // same user message with images
      ];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Llama-4-Maverick-17B-128E-Instruct',
          messages: emotionMessages,
          temperature: 0.3,
          max_tokens: 10,
          stream: false
        })
      });

      if (!response.ok) {
        console.warn('Emotion detection failed, using default');
        return 'analyzing';
      }

      const data = await response.json();
      const emotion = data.choices?.[0]?.message?.content?.trim().toLowerCase();
      
      // validate emotion is in our list
      const validEmotions = ['happy', 'excited', 'confident', 'thinking', 'analyzing', 'surprised', 'confused', 'disappointed', 'supportive', 'encouraging', 'flirty', 'romantic', 'chill', 'casual'];
      
      return validEmotions.includes(emotion) ? emotion : 'analyzing';
      
    } catch (error) {
      console.warn('Emotion detection error:', error);
      return 'analyzing';
    }
  }



  private async nonStreamingAnalysis(messages: any[], request: ProfileAnalysisRequest): Promise<AIResponse> {
    console.log('Trying non-streaming analysis...');
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Llama-4-Maverick-17B-128E-Instruct',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Non-streaming API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`non-streaming api error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('no non-streaming response from ai');
    }

    // try to parse as JSON, fallback to raw message
    try {
      const parsed = JSON.parse(aiMessage);
      return {
        message: parsed.message || aiMessage,
        emotion: parsed.emotion || 'analyzing',
        confidence: 0.9
      };
    } catch (parseError) {
      return {
        message: aiMessage,
        emotion: 'analyzing',
        confidence: 0.7
      };
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
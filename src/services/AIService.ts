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
  private getSystemPrompt(onboardingData?: any): string {
    const userContext = onboardingData ? `

USER CONTEXT:
- Dating goals: ${onboardingData.primaryGoal || 'not specified'}
- Communication style: ${onboardingData.communicationStyle?.join(', ') || 'not specified'}  
- Interests: ${onboardingData.conversationTopics?.join(', ') || 'not specified'}
- Relationship type: ${onboardingData.relationshipType || 
  'not specified'}` : '';

    return `You are a witty, helpful dating copilot assistant named Bufo. You help users with dating advice, profile analysis, conversation starters, and relationship guidance.${userContext}

IMPORTANT: Your responses must be in this exact JSON format:
{
  "message": "your actual response here (keep it casual, lowercase, helpful)",
  "emotion": "one of: happy, excited, confident, thinking, analyzing, surprised, confused, disappointed, supportive, encouraging, flirty, romantic, chill, casual",
  "toolCall": "OPTIONAL - only if user wants profile analysis"
}

TOOL CALLS: Use tool calls for two specific scenarios:

1. PROFILE ANALYSIS: If user EXPLICITLY mentions photos, images, or profile pictures:
- "check her photos", "analyze her pics", "what do you think of her pictures?"
- "thoughts on her photos?", "analyze this profile"

2. MESSAGE ASSISTANCE: If user asks for help with messaging/texting:
- "how do i rephrase this", "what should i say instead", "help me rewrite this"
- "make this sound better", "how can i improve this message", "what's a better way to say this"

DO NOT use tool calls for general questions like "do I have a shot?", "thoughts about her?", "what's she like?"

When triggered, include:
Profile Analysis: {"toolCall": {"name": "analyze_profile", "reason": "user wants photo/image analysis"}}
Message Help: {"toolCall": {"name": "message_assistance", "reason": "user wants help with their message"}}

Guidelines:
- Keep responses casual and lowercase (like "hey there!" not "Hello there!")
- Be encouraging and positive about dating
- Give practical, actionable advice
- Use dating slang and modern terminology
- Be empathetic and understanding
- Choose the emotion that best matches your response tone
- Keep responses concise but helpful (1-3 sentences max)
- When tool calls are needed, tell user you're going to analyze their photos
${onboardingData ? '- Tailor advice to their specific dating goals and communication style' : ''}

Remember: You're a fun, supportive dating wingman, not a formal assistant!`;
  }

  // get ai response with streaming support
  async getChatResponse(userMessage: string, conversationHistory: any[] = [], onboardingData?: any): Promise<AIResponse> {
    try {
      // build messages array with conversation context
      const messages = [
        { role: 'system', content: this.getSystemPrompt(onboardingData) },
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

  // emergency intervention - detect catastrophically bad messages in real-time
  async detectEmergency(currentMessage: string, onboardingData?: any, conversationHistory?: any[]): Promise<AIResponse & { isEmergency: boolean }> {
    try {
      // build context from recent chat history
      const recentChat = conversationHistory?.slice(-3).map(msg => 
        `${msg.type === 'user' ? 'user' : 'bufo'}: ${msg.message}`
      ).join('\n') || '';

             const emergencyPrompt = `You are an emergency intervention system for a dating app. Your job is to detect CATASTROPHICALLY BAD messages that would:
- Be creepy, scary, or disturbing
- Mention violence, self-harm, or illegal activities  
- Be sexually explicit or inappropriate for first messages
- Contain harassment, stalking behavior, or threats
- Be completely unhinged or mentally concerning

User context:
Dating goals: ${onboardingData?.primaryGoal || 'not specified'}
Communication style: ${onboardingData?.communicationStyle?.join(', ') || 'not specified'}

${recentChat ? `Recent bufo conversation:\n${recentChat}\n` : ''}

Current message they're typing: "${currentMessage}"

ONLY flag this as an emergency if it's genuinely HORRIBLE - like your example "hey gurl you ever felt bugs crawl on your skin?" or worse. 

DO NOT flag:
- Slightly boring messages
- Bad pickup lines 
- Awkward but harmless attempts
- Minor grammatical errors
- Messages that are just not great but not dangerous

CRITICAL: Response format - BE BRUTALLY HONEST AND BORDERLINE TERRIFIED:
{
  "isEmergency": true/false,
  "message": "if emergency: BRUTALLY honest, terrified reaction. use phrases like 'WHAT THE HELL', 'are you insane?', 'that's genuinely terrifying', 'you're gonna get blocked instantly', 'that's straight up harassment'. be lowercase but absolutely horrified",
  "emotion": "if emergency: shocked/horrified/concerned, if not: casual"
}

Examples of emergency responses:
- "WHAT THE HELL are you thinking?? that's genuinely creepy and she's gonna think you're unhinged"
- "are you trying to get reported?? that message is straight up harassment - delete that NOW"
- "oh my god that's terrifying - you sound like a complete psycho, she's gonna block you in 0.2 seconds"

Be VERY selective - only intervene for truly catastrophic messages that could get them blocked/reported.`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.3-70B-Instruct',
          messages: [{ role: 'user', content: emergencyPrompt }],
          temperature: 0.1, // low temperature for consistent emergency detection
          max_tokens: 150,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`ai api error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content;

      // try to parse json response
      try {
        const jsonMatch = aiMessage.match(/\{[^}]*"isEmergency"[^}]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiMessage;
        const parsed = JSON.parse(jsonString);
        
        return {
          message: parsed.message || '',
          emotion: parsed.emotion || 'casual',
          confidence: 0.9,
          isEmergency: !!parsed.isEmergency
        };
      } catch (parseError) {
        // if parsing fails, assume no emergency for safety
        console.warn('Emergency detection parsing failed, assuming safe');
        return {
          message: '',
          emotion: 'casual',
          confidence: 0.1,
          isEmergency: false
        };
      }

    } catch (error) {
      console.error('emergency detection error:', error);
      // on error, assume no emergency to avoid false positives
      return {
        message: '',
        emotion: 'casual',
        confidence: 0.1,
        isEmergency: false
      };
    }
  }

  // help improve a message the user has written
  async improveMessage(currentMessage: string, userRequest: string, onboardingData?: any, conversationHistory?: any[]): Promise<AIResponse> {
    try {
      // build context from recent chat history
      const recentChat = conversationHistory?.slice(-3).map(msg => 
        `${msg.type === 'user' ? 'user' : 'you'}: ${msg.message}`
      ).join('\n') || '';

      const messagePrompt = `You are a brutally honest dating copilot helping improve a message. Here's the context:

User's dating goals: ${onboardingData?.primaryGoal || 'not specified'}
Communication style: ${onboardingData?.communicationStyle?.join(', ') || 'not specified'}
Interests: ${onboardingData?.conversationTopics?.join(', ') || 'not specified'}

${recentChat ? `Recent conversation:\n${recentChat}\n` : ''}

The user's current message draft: "${currentMessage}"
User's request: "${userRequest}"

Be BRUTALLY HONEST about their message quality. If it's bad, call it out directly. If it's boring, generic, or likely to get ignored, say so. Then give them 1-2 much better alternatives that actually work.

Write entirely in lowercase, be casual but honest. Don't sugarcoat - they need real feedback to improve their dating game.

Examples of being brutally honest:
- "yeah that's pretty bland and screams 'copy-paste message'"  
- "that's gonna get you left on read 100% of the time"
- "nah, that sounds like every other guy in her DMs"
- "this is dry as toast - let's spice it up"

IMPORTANT: Response format should be:
{
  "message": "your brutally honest feedback and way better alternatives",
  "emotion": "confident, honest, or helpful"
}`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.3-70B-Instruct',
          messages: [{ role: 'user', content: messagePrompt }],
          temperature: 0.7,
          max_tokens: 200,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`ai api error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content;

      // try to parse json response
      try {
        const jsonMatch = aiMessage.match(/\{[^}]*"message"[^}]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiMessage;
        const parsed = JSON.parse(jsonString);
        
        return {
          message: parsed.message || aiMessage,
          emotion: parsed.emotion || 'helpful',
          confidence: 0.8
        };
      } catch (parseError) {
        // fallback parsing
        const messageMatch = aiMessage.match(/"message":\s*"([^"]+)"/);
        if (messageMatch) {
          return {
            message: messageMatch[1],
            emotion: 'helpful',
            confidence: 0.7
          };
        }
        
        return {
          message: aiMessage.replace(/\{.*\}/, '').trim(),
          emotion: 'helpful',
          confidence: 0.6
        };
      }

    } catch (error) {
      console.error('message assistance error:', error);
      return {
        message: "having trouble with that one - maybe try rephrasing your request?",
        emotion: "confused",
        confidence: 0.3
      };
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
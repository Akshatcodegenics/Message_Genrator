// AI Service for generating messages using free APIs
// This replaces the backend dependency with direct API calls

export interface MessageRequest {
  prompt: string;
  category?: string;
  style?: 'professional' | 'friendly' | 'casual' | 'formal';
  maxLength?: number;
}

export interface GeneratedMessage {
  id: string;
  generated_message: string;
  template_used: string;
  variables_detected: string[];
  category: string;
  success: boolean;
  confidence?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description: string;
}

// Message templates for different categories
const messageTemplates: MessageTemplate[] = [
  {
    id: 'birthday-1',
    name: 'Birthday Celebration',
    category: 'Birthday',
    template: '🎉 Happy Birthday, {customer_name}! 🎂 Wishing you a wonderful year ahead filled with joy and success. Thank you for being a valued part of our community!',
    variables: ['customer_name'],
    description: 'Warm birthday wishes for customers'
  },
  {
    id: 'birthday-2',
    name: 'Birthday Special Offer',
    category: 'Birthday',
    template: '🎈 Happy Birthday {customer_name}! 🎁 Celebrate with us and enjoy {discount}% off your next purchase. Make your special day even more special!',
    variables: ['customer_name', 'discount'],
    description: 'Birthday wishes with special offers'
  },
  {
    id: 'festival-1',
    name: 'Diwali Wishes',
    category: 'Festival',
    template: '✨ May this Diwali bring happiness, prosperity, and endless joy to you and your loved ones! 🪔 Wishing you a very Happy Diwali from all of us at {business_name}!',
    variables: ['business_name'],
    description: 'Traditional Diwali festival greetings'
  },
  {
    id: 'festival-2',
    name: 'Christmas Greetings',
    category: 'Festival',
    template: '🎄 Merry Christmas {customer_name}! May your holidays be filled with warmth, joy, and precious moments with loved ones. Thank you for your continued support!',
    variables: ['customer_name'],
    description: 'Christmas festival wishes'
  },
  {
    id: 'thankyou-1',
    name: 'Thank You Message',
    category: 'Thank You',
    template: '🙏 Thank you {customer_name} for choosing {business_name}! Your trust and support mean the world to us. We look forward to serving you again!',
    variables: ['customer_name', 'business_name'],
    description: 'General thank you message'
  },
  {
    id: 'welcome-1',
    name: 'Welcome New Customer',
    category: 'Welcome',
    template: '👋 Welcome to {business_name}, {customer_name}! We\'re thrilled to have you join our community. Get ready for an amazing experience!',
    variables: ['customer_name', 'business_name'],
    description: 'Welcome message for new customers'
  },
  {
    id: 'promotion-1',
    name: 'Special Promotion',
    category: 'Promotion',
    template: '🚀 Exciting news {customer_name}! Don\'t miss our {promotion_name} - get {discount}% off on {product_category}. Limited time offer!',
    variables: ['customer_name', 'promotion_name', 'discount', 'product_category'],
    description: 'Promotional offers and discounts'
  }
];

// Categories for organizing messages
export const messageCategories = [
  { name: 'birthday', display_name: 'Birthday' },
  { name: 'festival', display_name: 'Festival' },
  { name: 'thankyou', display_name: 'Thank You' },
  { name: 'welcome', display_name: 'Welcome' },
  { name: 'promotion', display_name: 'Promotion' },
  { name: 'general', display_name: 'General' }
];

// Hugging Face API (Free tier available)
const HUGGING_FACE_API_KEY = process.env.REACT_APP_HUGGING_FACE_API_KEY || '';
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';

// OpenAI-compatible free API alternatives
const OPENAI_COMPATIBLE_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
const OPENAI_COMPATIBLE_API_URL = process.env.REACT_APP_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

class AIService {
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private detectVariables(text: string): string[] {
    const variablePattern = /{([^}]+)}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  private findBestTemplate(prompt: string): MessageTemplate {
    const promptLower = prompt.toLowerCase();
    
    // Simple keyword matching to find the best template
    if (promptLower.includes('birthday') || promptLower.includes('born')) {
      return messageTemplates.find(t => t.category === 'Birthday') || messageTemplates[0];
    }
    
    if (promptLower.includes('diwali') || promptLower.includes('festival') || 
        promptLower.includes('christmas') || promptLower.includes('holiday')) {
      return messageTemplates.find(t => t.category === 'Festival') || messageTemplates[2];
    }
    
    if (promptLower.includes('thank') || promptLower.includes('appreciate')) {
      return messageTemplates.find(t => t.category === 'Thank You') || messageTemplates[4];
    }
    
    if (promptLower.includes('welcome') || promptLower.includes('new')) {
      return messageTemplates.find(t => t.category === 'Welcome') || messageTemplates[5];
    }
    
    if (promptLower.includes('offer') || promptLower.includes('discount') || 
        promptLower.includes('promotion') || promptLower.includes('sale')) {
      return messageTemplates.find(t => t.category === 'Promotion') || messageTemplates[6];
    }
    
    // Default to first template
    return messageTemplates[0];
  }

  private async callHuggingFaceAPI(prompt: string): Promise<string> {
    if (!HUGGING_FACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Generate a personalized message for: ${prompt}`,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || '';
  }

  private async callOpenAICompatibleAPI(prompt: string): Promise<string> {
    if (!OPENAI_COMPATIBLE_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(OPENAI_COMPATIBLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates personalized business messages. Keep messages concise, friendly, and professional.'
          },
          {
            role: 'user',
            content: `Generate a personalized message for: ${prompt}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async generateMessage(request: MessageRequest): Promise<GeneratedMessage> {
    try {
      let generatedText = '';
      let templateUsed = 'AI Generated';
      
      // Try to use AI APIs first, fall back to templates
      try {
        if (OPENAI_COMPATIBLE_API_KEY) {
          generatedText = await this.callOpenAICompatibleAPI(request.prompt);
        } else if (HUGGING_FACE_API_KEY) {
          generatedText = await this.callHuggingFaceAPI(request.prompt);
        }
      } catch (apiError) {
        console.warn('AI API failed, using template fallback:', apiError);
      }

      // If AI API fails or no API key, use template-based generation
      if (!generatedText || generatedText.trim().length < 10) {
        const template = this.findBestTemplate(request.prompt);
        generatedText = template.template;
        templateUsed = template.name;
      }

      const variables = this.detectVariables(generatedText);
      const category = this.categorizePrompt(request.prompt);

      return {
        id: this.generateId(),
        generated_message: generatedText,
        template_used: templateUsed,
        variables_detected: variables,
        category: category,
        success: true,
        confidence: generatedText.includes('{') ? 0.8 : 0.95 // Lower confidence for template-based
      };
    } catch (error) {
      console.error('Error generating message:', error);
      
      // Fallback to a basic template
      const basicTemplate = this.findBestTemplate(request.prompt);
      return {
        id: this.generateId(),
        generated_message: basicTemplate.template,
        template_used: basicTemplate.name,
        variables_detected: basicTemplate.variables,
        category: basicTemplate.category,
        success: false,
        confidence: 0.6
      };
    }
  }

  private categorizePrompt(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('birthday')) return 'Birthday';
    if (promptLower.includes('diwali') || promptLower.includes('christmas') || 
        promptLower.includes('festival')) return 'Festival';
    if (promptLower.includes('thank')) return 'Thank You';
    if (promptLower.includes('welcome')) return 'Welcome';
    if (promptLower.includes('offer') || promptLower.includes('promotion')) return 'Promotion';
    
    return 'General';
  }

  getCategories() {
    return messageCategories;
  }

  getTemplates() {
    return messageTemplates;
  }
}

export const aiService = new AIService();

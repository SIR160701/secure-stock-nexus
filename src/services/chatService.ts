
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class ChatService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor(config: ChatServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4';
    this.maxTokens = config.maxTokens || 150;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: this.maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur API OpenAI');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Pas de réponse';
    } catch (error) {
      console.error('Erreur ChatService:', error);
      throw error;
    }
  }

  static saveApiKey(apiKey: string): void {
    localStorage.setItem('openai_api_key', apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem('openai_api_key');
  }

  static removeApiKey(): void {
    localStorage.removeItem('openai_api_key');
  }
}

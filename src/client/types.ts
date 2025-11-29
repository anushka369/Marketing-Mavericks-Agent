export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface BrandContext {
  brandName?: string;
  brandVoice?: string;
  targetAudience?: string;
  industry?: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
  brandContext?: BrandContext;
}

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

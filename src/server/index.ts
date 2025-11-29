import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { generateContent, Message, BrandContext } from './openai';
import { brandContextStore } from './brandContext';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
}

// Request timeout middleware (30 seconds)
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ 
      success: false, 
      error: 'Request timeout - response took longer than 30 seconds' 
    });
  });
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'marketing-mavericks-agent'
  });
});

// Chat endpoint interface
interface ChatRequest {
  message: string;
  history?: Message[];
  brandContext?: BrandContext;
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  sessionId?: string;
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_LENGTH = 50;

// Sanitize input string
function sanitizeInput(input: string): string {
  // Replace null bytes with spaces
  let sanitized = input.replace(/\0/g, ' ');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Normalize excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

// Chat API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { message, history, brandContext, sessionId } = req.body as ChatRequest;

    // Validate message type
    if (typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: message is required and must be a string'
      } as ChatResponse);
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(message);

    // Validate message length
    if (sanitizedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: message cannot be empty'
      } as ChatResponse);
    }

    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Invalid request: message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
      } as ChatResponse);
    }

    // Validate history if provided
    if (history !== undefined && !Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: history must be an array'
      } as ChatResponse);
    }

    // Validate history length
    if (history && history.length > MAX_HISTORY_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Invalid request: history exceeds maximum length of ${MAX_HISTORY_LENGTH} messages`
      } as ChatResponse);
    }

    // Validate history items
    if (history) {
      for (const msg of history) {
        if (!msg.role || !msg.content || typeof msg.content !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Invalid request: history messages must have role and content'
          } as ChatResponse);
        }
      }
    }

    // Handle brand context storage
    let effectiveBrandContext = brandContext;
    let effectiveSessionId = sessionId;

    // If brand context is provided, store it
    if (brandContext && sessionId) {
      brandContextStore.set(sessionId, brandContext);
      effectiveBrandContext = brandContext;
    } 
    // If no brand context provided but sessionId exists, retrieve stored context
    else if (!brandContext && sessionId && brandContextStore.has(sessionId)) {
      effectiveBrandContext = brandContextStore.get(sessionId);
    }
    // If brand context provided but no sessionId, generate one
    else if (brandContext && !sessionId) {
      effectiveSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      brandContextStore.set(effectiveSessionId, brandContext);
      effectiveBrandContext = brandContext;
    }

    // Generate response with timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout')), 29000); // 29s to allow for response
    });

    const generationPromise = generateContent(
      sanitizedMessage,
      history || [],
      effectiveBrandContext
    );

    const response = await Promise.race([generationPromise, timeoutPromise]);

    const chatResponse: ChatResponse = {
      response,
      success: true
    };

    // Include sessionId in response if we have one
    if (effectiveSessionId) {
      chatResponse.sessionId = effectiveSessionId;
    }

    res.json(chatResponse);

  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: `Failed to generate response: ${errorMessage}`
    } as ChatResponse);
  }
});

// Serve React app for all other routes in production
if (isProduction) {
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, brandContextStore };

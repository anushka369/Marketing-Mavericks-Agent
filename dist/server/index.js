"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandContextStore = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const openai_1 = require("./openai");
const brandContext_1 = require("./brandContext");
Object.defineProperty(exports, "brandContextStore", { enumerable: true, get: function () { return brandContext_1.brandContextStore; } });
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files in production
if (isProduction) {
    const clientPath = path_1.default.join(__dirname, '../client');
    app.use(express_1.default.static(clientPath));
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
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'marketing-mavericks-agent'
    });
});
// Input validation constants
const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_LENGTH = 50;
// Sanitize input string
function sanitizeInput(input) {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    // Trim whitespace
    sanitized = sanitized.trim();
    // Normalize excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    return sanitized;
}
// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        // Validate request body
        const { message, history, brandContext, sessionId } = req.body;
        // Validate message type
        if (typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: message is required and must be a string'
            });
        }
        // Sanitize message
        const sanitizedMessage = sanitizeInput(message);
        // Validate message length
        if (sanitizedMessage.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: message cannot be empty'
            });
        }
        if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                success: false,
                error: `Invalid request: message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
            });
        }
        // Validate history if provided
        if (history !== undefined && !Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: history must be an array'
            });
        }
        // Validate history length
        if (history && history.length > MAX_HISTORY_LENGTH) {
            return res.status(400).json({
                success: false,
                error: `Invalid request: history exceeds maximum length of ${MAX_HISTORY_LENGTH} messages`
            });
        }
        // Validate history items
        if (history) {
            for (const msg of history) {
                if (!msg.role || !msg.content || typeof msg.content !== 'string') {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid request: history messages must have role and content'
                    });
                }
            }
        }
        // Handle brand context storage
        let effectiveBrandContext = brandContext;
        let effectiveSessionId = sessionId;
        // If brand context is provided, store it
        if (brandContext && sessionId) {
            brandContext_1.brandContextStore.set(sessionId, brandContext);
            effectiveBrandContext = brandContext;
        }
        // If no brand context provided but sessionId exists, retrieve stored context
        else if (!brandContext && sessionId && brandContext_1.brandContextStore.has(sessionId)) {
            effectiveBrandContext = brandContext_1.brandContextStore.get(sessionId);
        }
        // If brand context provided but no sessionId, generate one
        else if (brandContext && !sessionId) {
            effectiveSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            brandContext_1.brandContextStore.set(effectiveSessionId, brandContext);
            effectiveBrandContext = brandContext;
        }
        // Generate response with timeout handling
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Generation timeout')), 29000); // 29s to allow for response
        });
        const generationPromise = (0, openai_1.generateContent)(sanitizedMessage, history || [], effectiveBrandContext);
        const response = await Promise.race([generationPromise, timeoutPromise]);
        const chatResponse = {
            response,
            success: true
        };
        // Include sessionId in response if we have one
        if (effectiveSessionId) {
            chatResponse.sessionId = effectiveSessionId;
        }
        res.json(chatResponse);
    }
    catch (error) {
        console.error('Chat endpoint error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            success: false,
            error: `Failed to generate response: ${errorMessage}`
        });
    }
});
// Serve React app for all other routes in production
if (isProduction) {
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../client/index.html'));
    });
}
// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.server = server;
//# sourceMappingURL=index.js.map
import { useState, KeyboardEvent } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const MAX_MESSAGE_LENGTH = 5000; // Maximum characters allowed
const MIN_MESSAGE_LENGTH = 1; // Minimum characters (after trim)

export default function InputBox({ onSend, disabled }: InputBoxProps) {
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateInput = (text: string): string | null => {
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      return 'Message cannot be empty';
    }
    
    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      return 'Message is too short';
    }
    
    if (text.length > MAX_MESSAGE_LENGTH) {
      return `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`;
    }
    
    return null;
  };

  const sanitizeInput = (text: string): string => {
    // Trim whitespace
    let sanitized = text.trim();
    
    // Remove any null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize whitespace (replace multiple spaces/newlines with single ones)
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    
    // Show length warning when approaching limit
    if (value.length > MAX_MESSAGE_LENGTH * 0.9) {
      setValidationError(`${MAX_MESSAGE_LENGTH - value.length} characters remaining`);
    }
  };

  const handleSend = () => {
    if (disabled) return;
    
    // Validate before sending
    const error = validateInput(input);
    if (error) {
      setValidationError(error);
      return;
    }
    
    // Only send if input is valid
    if (!input.trim()) {
      setValidationError('Message cannot be empty');
      return;
    }
    
    const sanitized = sanitizeInput(input);
    onSend(sanitized);
    setInput('');
    setValidationError(null);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputValid = input.trim().length > 0 && input.length <= MAX_MESSAGE_LENGTH;
  const charCount = input.length;
  const showCharCount = charCount > MAX_MESSAGE_LENGTH * 0.8;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {validationError && (
          <div className={`mb-2 text-sm ${charCount > MAX_MESSAGE_LENGTH ? 'text-red-600' : 'text-yellow-600'}`}>
            {validationError}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              placeholder="Ask me to create marketing content or develop a campaign strategy..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH + 100} // Allow typing a bit over to show error
            />
            {showCharCount && (
              <div className={`absolute bottom-2 right-2 text-xs ${charCount > MAX_MESSAGE_LENGTH ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                {charCount}/{MAX_MESSAGE_LENGTH}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={disabled || !isInputValid}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {disabled ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputBox from './InputBox';

describe('InputBox', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render input and button', () => {
    render(<InputBox onSend={mockOnSend} disabled={false} />);

    expect(screen.getByPlaceholderText(/Ask me to create marketing content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  it('should call onSend when button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputBox onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/Ask me to create marketing content/i);
    const button = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Test message');
    await user.click(button);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('should clear input after sending', async () => {
    const user = userEvent.setup();
    render(<InputBox onSend={mockOnSend} disabled={false} />);

    const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Test message');
    await user.click(button);

    expect(input.value).toBe('');
  });

  it('should not send empty messages', async () => {
    const user = userEvent.setup();
    render(<InputBox onSend={mockOnSend} disabled={false} />);

    const button = screen.getByRole('button', { name: /Send/i });
    await user.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should disable input and button when disabled prop is true', () => {
    render(<InputBox onSend={mockOnSend} disabled={true} />);

    const input = screen.getByPlaceholderText(/Ask me to create marketing content/i);
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should show "Sending..." when disabled', () => {
    render(<InputBox onSend={mockOnSend} disabled={true} />);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  describe('Input Validation', () => {
    it('should prevent sending whitespace-only messages', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: '   ' } });
      
      // Button should be disabled for whitespace-only input
      expect(button).toBeDisabled();
      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should show error for messages exceeding maximum length', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const longMessage = 'a'.repeat(5001);

      fireEvent.change(input, { target: { value: longMessage } });

      // Should show character count in red when over limit
      expect(screen.getByText(/5001\/5000/i)).toBeInTheDocument();
      expect(screen.getByText(/-1 characters remaining/i)).toBeInTheDocument();
    });

    it('should show character count when approaching limit', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const nearLimitMessage = 'a'.repeat(4100); // 82% of 5000

      fireEvent.change(input, { target: { value: nearLimitMessage } });

      expect(screen.getByText(/4100\/5000/i)).toBeInTheDocument();
    });

    it('should sanitize input by trimming whitespace', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: '  Test message  ' } });
      fireEvent.click(button);

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should normalize excessive whitespace in input', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Test    message    here' } });
      fireEvent.click(button);

      expect(mockOnSend).toHaveBeenCalledWith('Test message here');
    });

    it('should disable send button when input is invalid', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /Send/i });

      // Empty input
      expect(button).toBeDisabled();

      // Type valid message
      fireEvent.change(input, { target: { value: 'Valid message' } });
      expect(button).not.toBeDisabled();

      // Clear to whitespace
      fireEvent.change(input, { target: { value: '   ' } });
      expect(button).toBeDisabled();
    });

    it('should clear validation error when user starts typing', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;

      // Type a long message to trigger warning
      const longMessage = 'a'.repeat(4600);
      fireEvent.change(input, { target: { value: longMessage } });
      
      // Should show character warning
      expect(screen.getByText(/400 characters remaining/i)).toBeInTheDocument();

      // Type more to clear the warning threshold
      fireEvent.change(input, { target: { value: 'Short message' } });
      expect(screen.queryByText(/characters remaining/i)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key press', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should not send message on Shift+Enter', () => {
      render(<InputBox onSend={mockOnSend} disabled={false} />);

      const input = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });
});

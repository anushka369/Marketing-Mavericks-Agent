import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeScreen from './WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockOnExampleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render welcome message', () => {
    render(<WelcomeScreen onExampleClick={mockOnExampleClick} />);

    expect(screen.getByText('Marketing Mavericks Agent')).toBeInTheDocument();
    expect(screen.getByText(/AI-powered marketing assistant/i)).toBeInTheDocument();
  });

  it('should display capability overview', () => {
    render(<WelcomeScreen onExampleClick={mockOnExampleClick} />);

    expect(screen.getByText(/Blog posts and articles/i)).toBeInTheDocument();
    expect(screen.getByText(/Social media content/i)).toBeInTheDocument();
    expect(screen.getByText(/Email marketing campaigns/i)).toBeInTheDocument();
    expect(screen.getByText(/Ad copy and variations/i)).toBeInTheDocument();
    expect(screen.getByText(/Campaign strategies/i)).toBeInTheDocument();
  });

  it('should display example prompts', () => {
    render(<WelcomeScreen onExampleClick={mockOnExampleClick} />);

    expect(screen.getByText(/Write a blog post about sustainable fashion/i)).toBeInTheDocument();
    expect(screen.getByText(/Create social media posts for a new coffee shop/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate email marketing copy for a summer sale/i)).toBeInTheDocument();
    expect(screen.getByText(/Develop a campaign strategy for launching a fitness app/i)).toBeInTheDocument();
  });

  it('should call onExampleClick when example is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeScreen onExampleClick={mockOnExampleClick} />);

    const exampleButton = screen.getByText(/Write a blog post about sustainable fashion/i);
    await user.click(exampleButton);

    expect(mockOnExampleClick).toHaveBeenCalledWith('Write a blog post about sustainable fashion for millennials');
  });
});

/**
 * Feature: marketing-mavericks-agent, Property 9: Content interaction availability
 * Validates: Requirements 3.4
 * 
 * Property: For any generated content displayed in the web interface, 
 * copy and download options should be available in the UI.
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import MessageList from './MessageList';
import { Message } from '../types';

describe('Property 9: Content interaction availability', () => {
  it('should provide copy and download buttons for all assistant messages', () => {
    fc.assert(
      fc.property(
        // Generate random assistant messages
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            role: fc.constant('assistant' as const),
            content: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: 0 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (assistantMessages: Message[]) => {
          const mockOnCopy = jest.fn();
          const mockOnDownload = jest.fn();

          const { unmount } = render(
            <MessageList
              messages={assistantMessages}
              onCopy={mockOnCopy}
              onDownload={mockOnDownload}
            />
          );

          // For each assistant message, verify copy and download buttons exist
          const copyButtons = screen.getAllByTitle('Copy to clipboard');
          const downloadButtons = screen.getAllByTitle('Download as text file');

          // Should have exactly one copy button per assistant message
          expect(copyButtons).toHaveLength(assistantMessages.length);
          // Should have exactly one download button per assistant message
          expect(downloadButtons).toHaveLength(assistantMessages.length);

          // Verify buttons are actually rendered in the DOM
          copyButtons.forEach(button => {
            expect(button).toBeInTheDocument();
            expect(button).toBeVisible();
          });

          downloadButtons.forEach(button => {
            expect(button).toBeInTheDocument();
            expect(button).toBeVisible();
          });

          // Clean up after each test
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not provide copy and download buttons for user messages', () => {
    fc.assert(
      fc.property(
        // Generate random user messages
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            role: fc.constant('user' as const),
            content: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: 0 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (userMessages: Message[]) => {
          const mockOnCopy = jest.fn();
          const mockOnDownload = jest.fn();

          const { unmount } = render(
            <MessageList
              messages={userMessages}
              onCopy={mockOnCopy}
              onDownload={mockOnDownload}
            />
          );

          // User messages should not have copy/download buttons
          const copyButtons = screen.queryAllByTitle('Copy to clipboard');
          const downloadButtons = screen.queryAllByTitle('Download as text file');

          expect(copyButtons).toHaveLength(0);
          expect(downloadButtons).toHaveLength(0);

          // Clean up after each test
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide interaction buttons for mixed message types (only for assistant)', () => {
    fc.assert(
      fc.property(
        // Generate a mix of user and assistant messages
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            role: fc.oneof(fc.constant('user' as const), fc.constant('assistant' as const)),
            content: fc.string({ minLength: 1 }),
            timestamp: fc.integer({ min: 0 })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (messages: Message[]) => {
          const mockOnCopy = jest.fn();
          const mockOnDownload = jest.fn();

          const { unmount } = render(
            <MessageList
              messages={messages}
              onCopy={mockOnCopy}
              onDownload={mockOnDownload}
            />
          );

          const assistantMessageCount = messages.filter(m => m.role === 'assistant').length;
          
          if (assistantMessageCount > 0) {
            const copyButtons = screen.getAllByTitle('Copy to clipboard');
            const downloadButtons = screen.getAllByTitle('Download as text file');

            // Should have buttons only for assistant messages
            expect(copyButtons).toHaveLength(assistantMessageCount);
            expect(downloadButtons).toHaveLength(assistantMessageCount);
          } else {
            // No assistant messages means no buttons
            const copyButtons = screen.queryAllByTitle('Copy to clipboard');
            const downloadButtons = screen.queryAllByTitle('Download as text file');
            
            expect(copyButtons).toHaveLength(0);
            expect(downloadButtons).toHaveLength(0);
          }

          // Clean up after each test
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

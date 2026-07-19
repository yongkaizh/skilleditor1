import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheatsheetDrawer } from '../components/CheatsheetDrawer';

describe('CheatsheetDrawer', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CheatsheetDrawer isOpen={false} onClose={vi.fn()} onInsert={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders snippets when isOpen is true', () => {
    render(
      <CheatsheetDrawer isOpen={true} onClose={vi.fn()} onInsert={vi.fn()} />
    );
    expect(screen.getByText('SKILL Cheatsheet')).toBeDefined();
    expect(screen.getByText('Core & Control Flow')).toBeDefined();
  });

  it('calls onInsert with snippet text when a snippet is clicked', () => {
    const onInsertMock = vi.fn();
    render(
      <CheatsheetDrawer isOpen={true} onClose={vi.fn()} onInsert={onInsertMock} />
    );
    
    // Find a snippet name and click it
    const snippetName = screen.getByText('If Statement');
    fireEvent.click(snippetName);
    
    expect(onInsertMock).toHaveBeenCalled();
    const contentArg = onInsertMock.mock.calls[0][0];
    expect(contentArg).toContain('if(');
  });
});

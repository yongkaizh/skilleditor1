import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialSidebar } from '../components/TutorialSidebar';

describe('TutorialSidebar', () => {
  it('renders nothing when isActive is false', () => {
    const { container } = render(
      <TutorialSidebar isActive={false} onClose={vi.fn()} currentText="" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders tour content when isActive is true', () => {
    render(
      <TutorialSidebar isActive={true} onClose={vi.fn()} currentText="" />
    );
    expect(screen.getByText('SKILL Masterclass Tour')).toBeDefined();
    expect(screen.getByText('1. First Steps: Hello World')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <TutorialSidebar isActive={true} onClose={onCloseMock} currentText="" />
    );
    const closeBtn = screen.getByTitle('Close Tutorial');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });
});

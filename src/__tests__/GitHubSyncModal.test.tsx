import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubSyncModal } from '../components/GitHubSyncModal';


describe('GitHubSyncModal', () => {
  beforeEach(() => {
    // Clear localStorage
    window.localStorage.clear();
    // Mock fetch
    global.fetch = vi.fn() as any;
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <GitHubSyncModal isOpen={false} onClose={vi.fn()} files={[]} onFilesChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders inputs when isOpen is true', () => {
    render(
      <GitHubSyncModal isOpen={true} onClose={vi.fn()} files={[]} onFilesChange={vi.fn()} />
    );
    expect(screen.getByText('GitHub Synchronization')).toBeDefined();
    
    // Using placeholder text instead of labels to find inputs to be safe
    expect(screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx')).toBeDefined();
    expect(screen.getByPlaceholderText('username/skill-scripts')).toBeDefined();
    expect(screen.getByPlaceholderText('main')).toBeDefined();
    expect(screen.getByPlaceholderText('Update SKILL files')).toBeDefined();
  });

  it('shows error if pulling without token or repo', () => {
    render(
      <GitHubSyncModal isOpen={true} onClose={vi.fn()} files={[]} onFilesChange={vi.fn()} />
    );
    
    const pullButton = screen.getByText('Clone / Pull');
    fireEvent.click(pullButton);
    
    expect(screen.getByText('Token and Repository are required.')).toBeDefined();
  });
});

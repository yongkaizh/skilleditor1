import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateGallery } from '../components/TemplateGallery';

describe('TemplateGallery', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TemplateGallery isOpen={false} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders templates when isOpen is true', () => {
    render(
      <TemplateGallery isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Advanced Template Gallery')).toBeDefined();
    expect(screen.getByText('Virtuoso Menu Registration')).toBeDefined();
  });

  it('calls onSelect with template content when a template is clicked', () => {
    const onSelectMock = vi.fn();
    render(
      <TemplateGallery isOpen={true} onClose={vi.fn()} onSelect={onSelectMock} />
    );
    
    // Find the title and click it
    const titleElement = screen.getByText('Virtuoso Menu Registration');
    fireEvent.click(titleElement);
    
    expect(onSelectMock).toHaveBeenCalled();
    const contentArg = onSelectMock.mock.calls[0][0];
    expect(typeof contentArg).toBe('string');
    expect(contentArg).toContain('procedure(');
  });
});

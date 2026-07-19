import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileExplorer } from '../components/FileExplorer';
import '@testing-library/jest-dom';

describe('FileExplorer', () => {
  const mockFiles = [
    { id: '1', name: 'main.il', content: 'test content 1' },
    { id: '2', name: 'utils.il', content: 'test content 2' }
  ];

  it('renders files correctly', () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={vi.fn()}
        onFilesChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('main.il')).toBeDefined();
    expect(screen.getByText('utils.il')).toBeDefined();
  });

  it('calls onFileSelect when a file is clicked', () => {
    const onFileSelectMock = vi.fn();
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={onFileSelectMock}
        onFilesChange={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('utils.il'));
    expect(onFileSelectMock).toHaveBeenCalledWith('2');
  });

  it('adds a new file when the add button is clicked', () => {
    const onFilesChangeMock = vi.fn();
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={vi.fn()}
        onFilesChange={onFilesChangeMock}
      />
    );
    
    // There are a few buttons, the third one is Add
    const buttons = screen.getAllByRole('button');
    const addButton = buttons.find(b => b.title === 'New File');
    
    fireEvent.click(addButton!);
    expect(onFilesChangeMock).toHaveBeenCalled();
    const newFiles = onFilesChangeMock.mock.calls[0][0];
    expect(newFiles.length).toBe(3);
    expect(newFiles[2].name).toBe('script3.il');
  });

  it('does not delete the last file', () => {
    const onFilesChangeMock = vi.fn();
    render(
      <FileExplorer
        files={[{ id: '1', name: 'main.il', content: 'test' }]}
        activeFileId="1"
        onFileSelect={vi.fn()}
        onFilesChange={onFilesChangeMock}
      />
    );
    
    // Trash button shouldn't be rendered if there's only 1 file
    const trashButtons = screen.queryAllByRole('button').filter(b => b.querySelector('svg.lucide-trash2') || b.innerHTML.includes('lucide-trash2'));
    expect(trashButtons.length).toBe(0);
  });
});

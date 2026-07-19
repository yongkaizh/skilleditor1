import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FunctionNavigator } from '../components/FunctionNavigator';


// Mock projectState methods instead of object
vi.mock('../editor/projectState', () => {
  return {
    projectState: {
      functions: [
        { name: 'testFunctionOne', fileName: 'main.il', line: 10, column: 1 },
        { name: 'anotherFunction', fileName: 'utils.il', line: 20, column: 1 }
      ]
    }
  };
});

describe('FunctionNavigator', () => {
  it('renders functions from projectState', () => {
    render(<FunctionNavigator onFunctionClick={vi.fn()} />);
    expect(screen.getByText('testFunctionOne')).toBeDefined();
    expect(screen.getByText('anotherFunction')).toBeDefined();
  });

  it('filters functions based on search input', () => {
    render(<FunctionNavigator onFunctionClick={vi.fn()} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'another' } });
    
    expect(screen.queryByText('testFunctionOne')).toBeNull();
    expect(screen.getByText('anotherFunction')).toBeDefined();
  });

  it('calls onFunctionClick when a function is clicked', () => {
    const onFunctionClickMock = vi.fn();
    render(<FunctionNavigator onFunctionClick={onFunctionClickMock} />);
    
    fireEvent.click(screen.getByText('testFunctionOne'));
    expect(onFunctionClickMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'testFunctionOne' }));
  });
});

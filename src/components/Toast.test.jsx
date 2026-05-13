import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Toast from './Toast';

describe('Toast Component', () => {
  it('renders the message correctly', () => {
    render(<Toast message="Test message" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    // Default icon
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('renders a custom icon correctly', () => {
    render(<Toast message="Success!" icon="✅" />);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });
});

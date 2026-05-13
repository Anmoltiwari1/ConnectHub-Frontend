import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { API } from '../config/api';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  it('renders the registration form correctly', () => {
    renderComponent();
    
    expect(screen.getByRole('heading', { name: /Join ConnectHub/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { name: 'fullName', value: 'John Doe' } });
    expect(nameInput.value).toBe('John Doe');
  });

  it('submits the form successfully and navigates to login', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', username: 'johndoe' })
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { name: 'fullName', value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { name: 'username', value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { name: 'email', value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { name: 'password', value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${API.AUTH}/register`, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123',
          fullName: 'John Doe'
        })
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/login?registered=true');
    });
  });

  it('displays error message when registration fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Email already in use'
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { name: 'fullName', value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { name: 'username', value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { name: 'email', value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { name: 'password', value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already in use/i)).toBeInTheDocument();
    });
  });
});

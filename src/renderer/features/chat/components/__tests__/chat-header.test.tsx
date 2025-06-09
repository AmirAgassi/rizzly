import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from '../chat-header';
import { useBufoStore } from '../../../../stores';

// mock the bufo store
vi.mock('../../../../stores', () => ({
  useBufoStore: vi.fn()
}));

const mockUseBufoStore = useBufoStore as any;

describe('ChatHeader', () => {
  beforeEach(() => {
    mockUseBufoStore.mockReturnValue({
      bufoImage: 'mock-bufo-image.png'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders bufo avatar and info', () => {
    render(<ChatHeader />);

    // check for avatar image
    const avatar = screen.getByAltText('Bufo');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'mock-bufo-image.png');
    expect(avatar).toHaveClass('mascot-avatar');

    // check for name and status
    expect(screen.getByText('bufo')).toBeInTheDocument();
    expect(screen.getByText('your dating copilot')).toBeInTheDocument();
  });

  it('displays the bufo image from store', () => {
    // test that component reads from store correctly
    render(<ChatHeader />);
    
    expect(screen.getByAltText('Bufo')).toHaveAttribute('src', 'mock-bufo-image.png');
  });

  it('has correct css classes', () => {
    render(<ChatHeader />);

    const header = screen.getByRole('img').parentElement;
    expect(header).toHaveClass('chat-header');

    const mascotInfo = screen.getByText('bufo').parentElement;
    expect(mascotInfo).toHaveClass('mascot-info');
  });
}); 
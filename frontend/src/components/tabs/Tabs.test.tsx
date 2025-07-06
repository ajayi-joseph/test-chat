import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from './Tabs';

describe('Tabs Component', () => {
  const mockTabs = [
    { id: 'tab1', label: 'First Tab' },
    { id: 'tab2', label: 'Second Tab' },
    { id: 'tab3', label: 'Third Tab' },
  ] as const;

  it('renders all tabs with correct labels', () => {
    const handleTabChange = vi.fn();
    
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );

    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('applies active styles to the active tab', () => {
    const handleTabChange = vi.fn();
    
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab2" 
        onTabChange={handleTabChange} 
      />
    );

    const activeTab = screen.getByText('Second Tab');
    const inactiveTab = screen.getByText('First Tab');

    // Active tab should have active classes
    expect(activeTab).toHaveClass('text-[#e8506e]', 'border-[#e8506e]');
    
    // Inactive tab should not have active classes
    expect(inactiveTab).not.toHaveClass('text-[#e8506e]');
    expect(inactiveTab).not.toHaveClass('border-[#e8506e]');
  });

  it('calls onTabChange with correct tab id when clicked', () => {
    const handleTabChange = vi.fn();
    
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );

    fireEvent.click(screen.getByText('Second Tab'));
    expect(handleTabChange).toHaveBeenCalledWith('tab2');

    fireEvent.click(screen.getByText('Third Tab'));
    expect(handleTabChange).toHaveBeenCalledWith('tab3');
  });

  it('does not call onTabChange when clicking active tab', () => {
    const handleTabChange = vi.fn();
    
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );

    fireEvent.click(screen.getByText('First Tab'));
    
    // Still calls the handler (component doesn't prevent this)
    expect(handleTabChange).toHaveBeenCalledWith('tab1');
  });

  it('works with different generic types', () => {
    // Test with enum-like type
    type PageType = 'home' | 'profile' | 'settings';
    
    const pageTabs = [
      { id: 'home' as PageType, label: 'Home' },
      { id: 'profile' as PageType, label: 'Profile' },
      { id: 'settings' as PageType, label: 'Settings' },
    ] as const;
    
    const handleTabChange = vi.fn();
    
    render(
      <Tabs<PageType>
        tabs={pageTabs}
        activeTab="profile"
        onTabChange={handleTabChange}
      />
    );

    fireEvent.click(screen.getByText('Settings'));
    expect(handleTabChange).toHaveBeenCalledWith('settings');
  });

  it('renders correctly with no tabs', () => {
    const handleTabChange = vi.fn();
    
    render(
      <Tabs 
        tabs={[]} 
        activeTab="" 
        onTabChange={handleTabChange} 
      />
    );

    const list = screen.getByRole('list');
    expect(list).toBeEmptyDOMElement();
  });

  it('maintains correct active state when activeTab prop changes', () => {
    const handleTabChange = vi.fn();
    
    const { rerender } = render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );

    expect(screen.getByText('First Tab')).toHaveClass('text-[#e8506e]');
    expect(screen.getByText('Second Tab')).not.toHaveClass('text-[#e8506e]');

    // Change active tab
    rerender(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab2" 
        onTabChange={handleTabChange} 
      />
    );

    expect(screen.getByText('First Tab')).not.toHaveClass('text-[#e8506e]');
    expect(screen.getByText('Second Tab')).toHaveClass('text-[#e8506e]');
  });
});
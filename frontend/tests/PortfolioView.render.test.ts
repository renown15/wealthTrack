/**
 * Tests for PortfolioView - Basic rendering and display states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import PortfolioView from '@/views/PortfolioView.vue';
import * as usePortfolioModule from '@/composables/usePortfolio';
import {
  createMockPortfolioReturn,
  createMockAccount,
  createMockInstitution,
} from './helpers/portfolioViewTestHelper';

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: vi.fn(),
}));

const mockUsePortfolio = usePortfolioModule.usePortfolio as any;

describe('PortfolioView - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    expect(wrapper.find('h1').text()).toBe('Portfolio Dashboard');
  });

  it('should display empty state when no accounts', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('No accounts yet');
  });

  it('should display loading state', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn({ loading: true }));
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Loading portfolio');
  });

  it('should display error message', () => {
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({ error: 'Test error message' })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Test error message');
  });

  it('should display accounts and institutions', () => {
    const mockAccount = createMockAccount();
    const mockInstitution = createMockInstitution();

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount], institutions: [mockInstitution] },
        { totalValue: () => 1000, accountCount: () => 1 }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Savings');
    expect(wrapper.text()).toContain('Bank A');
  });

  it('should call loadPortfolio on mount', () => {
    const loadPortfolioMock = vi.fn();
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { loadPortfolio: loadPortfolioMock })
    );
    mount(PortfolioView);
    expect(loadPortfolioMock).toHaveBeenCalled();
  });

  it('should format currency correctly', () => {
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { totalValue: () => 1234.56 })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$1,234.56');
  });

  it('should display multiple accounts with correct data', () => {
    const mockAccount1 = createMockAccount({
      account: { id: 1, name: 'Savings' },
      latestBalance: { value: '5000.00' },
    });
    const mockAccount2 = createMockAccount({
      account: { id: 2, name: 'Checking' },
      latestBalance: { value: '3000.00' },
    });

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount1, mockAccount2] },
        { totalValue: () => 8000, accountCount: () => 2 }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Savings');
    expect(wrapper.text()).toContain('Checking');
    expect(wrapper.text()).toContain('$8,000');
  });

  it('should display institutions list with accounts', () => {
    const mockAccount = createMockAccount();
    const mockInstitution1 = createMockInstitution({ id: 1, name: 'Bank A' });
    const mockInstitution2 = createMockInstitution({ id: 2, name: 'Bank B' });

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount], institutions: [mockInstitution1, mockInstitution2] },
        { totalValue: () => 1000, accountCount: () => 1 }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Bank A');
    expect(wrapper.text()).toContain('Bank B');
  });

  it('should format header with total value and account count', () => {
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { totalValue: () => 5000.5, accountCount: () => 3 })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$5,000.50');
    expect(wrapper.text()).toContain('3');
  });

  it('should display proper currency formatting in header', () => {
    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn({}, { totalValue: () => 999.99 })
    );
    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('$999.99');
  });
});

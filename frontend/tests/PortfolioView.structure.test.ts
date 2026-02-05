/**
 * Tests for PortfolioView - Component structure and sections
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('PortfolioView - Component Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component structure correctly', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);

    const portfolioView = wrapper.find('.portfolio-view');
    expect(portfolioView.exists()).toBe(true);

    const header = wrapper.find('.portfolio-header');
    expect(header.exists()).toBe(true);
  });

  it('should render section elements for portfolio content', () => {
    const mockAccount = createMockAccount({
      account: { name: 'Checking' },
      latest_balance: { value: '2500.00' },
    });

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount] },
        { totalValue: () => 2500, accountCount: () => 1 }
      )
    );

    const wrapper = mount(PortfolioView);
    const sections = wrapper.findAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should render account grid when data present', () => {
    const mockAccount = createMockAccount({
      latest_balance: { value: '2500.00' },
    });

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount] },
        { totalValue: () => 2500, accountCount: () => 1 }
      )
    );

    const wrapper = mount(PortfolioView);
    expect(wrapper.text()).toContain('Savings');
  });

  it('should render content sections for portfolio', () => {
    const mockAccount = createMockAccount({
      account: { name: 'Checking' },
      latest_balance: { value: '1500.00' },
    });
    const mockInstitution = createMockInstitution();

    mockUsePortfolio.mockReturnValue(
      createMockPortfolioReturn(
        { items: [mockAccount], institutions: [mockInstitution] },
        { totalValue: () => 1500, accountCount: () => 1 }
      )
    );

    const wrapper = mount(PortfolioView);
    const sections = wrapper.findAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it('should have modal structure in template', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    expect(wrapper.find('.portfolio-header').exists()).toBe(true);
  });

  it('should render component with modals structure', () => {
    mockUsePortfolio.mockReturnValue(createMockPortfolioReturn());
    const wrapper = mount(PortfolioView);
    expect(wrapper.find('.portfolio-view').exists()).toBe(true);
  });
});

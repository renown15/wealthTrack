/**
 * Home view displaying welcome message.
 */
import { BaseView } from './BaseView';
import type { User } from '../models/User';

export class HomeView extends BaseView {
  private onLogoutCallback?: () => void;

  constructor(containerId: string) {
    super(containerId);
  }

  /**
   * Set the logout callback handler.
   */
  onLogout(callback: () => void): void {
    this.onLogoutCallback = callback;
  }

  /**
   * Render the home page.
   */
  render(user?: User | null): void {
    this.clear();

    const section = document.createElement('section');
    section.className = 'home-section';

    // Show different content based on authentication
    if (user) {
      // Authenticated user view
      const greeting = document.createElement('div');
      greeting.className = 'user-greeting';

      const title = document.createElement('h1');
      title.textContent = `Welcome back, ${user.fullName || user.username}!`;
      title.className = 'home-title';

      const userInfo = document.createElement('p');
      userInfo.className = 'user-info';
      userInfo.textContent = `Email: ${user.email} | Member since: ${new Date(user.createdAt).toLocaleDateString()}`;

      const logoutButton = document.createElement('button');
      logoutButton.textContent = 'Logout';
      logoutButton.className = 'btn btn-secondary';
      logoutButton.addEventListener('click', () => {
        if (this.onLogoutCallback) {
          this.onLogoutCallback();
        }
      });

      greeting.appendChild(title);
      greeting.appendChild(userInfo);
      greeting.appendChild(logoutButton);
      section.appendChild(greeting);

      const dashboard = document.createElement('div');
      dashboard.className = 'dashboard';

      const dashTitle = document.createElement('h2');
      dashTitle.textContent = 'Your Dashboard';

      const dashContent = document.createElement('p');
      dashContent.textContent = 'Portfolio tracking and analytics features coming soon...';

      dashboard.appendChild(dashTitle);
      dashboard.appendChild(dashContent);
      section.appendChild(dashboard);
    } else {
      // Guest/unauthenticated view
      const title = document.createElement('h1');
      title.textContent = 'Welcome to WealthTrack';
      title.className = 'home-title';

      const description = document.createElement('p');
      description.textContent =
        'Your strategic wealth management solution. Track, analyze, and grow your financial portfolio with confidence.';
      description.className = 'home-description';

      const features = document.createElement('div');
      features.className = 'features';

      const featureList = [
        { title: 'Portfolio Tracking', desc: 'Monitor your investments in real-time' },
        { title: 'Financial Analytics', desc: 'Gain insights with advanced analytics' },
        { title: 'Secure Platform', desc: 'Bank-level security for your data' },
      ];

      featureList.forEach((feature) => {
        const featureCard = document.createElement('div');
        featureCard.className = 'feature-card';

        const featureTitle = document.createElement('h3');
        featureTitle.textContent = feature.title;

        const featureDesc = document.createElement('p');
        featureDesc.textContent = feature.desc;

        featureCard.appendChild(featureTitle);
        featureCard.appendChild(featureDesc);
        features.appendChild(featureCard);
      });

      const ctaButton = document.createElement('button');
      ctaButton.textContent = 'Get Started';
      ctaButton.className = 'btn btn-primary btn-large';
      ctaButton.id = 'cta-register';

      section.appendChild(title);
      section.appendChild(description);
      section.appendChild(features);
      section.appendChild(ctaButton);
    }

    this.container.appendChild(section);
  }
}

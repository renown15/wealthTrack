/**
 * Home view displaying welcome message.
 */
import { BaseView } from './BaseView';

export class HomeView extends BaseView {
  constructor(containerId: string) {
    super(containerId);
  }

  /**
   * Render the home page.
   */
  render(): void {
    this.clear();

    const section = document.createElement('section');
    section.className = 'home-section';

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

    this.container.appendChild(section);
  }
}

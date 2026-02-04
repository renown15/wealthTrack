/**
 * Home controller.
 */
import { HomeView } from '../views/HomeView';

export class HomeController {
  private view: HomeView;

  constructor(containerId: string) {
    this.view = new HomeView(containerId);
  }

  /**
   * Initialize the home controller.
   */
  init(): void {
    this.view.render();
  }
}

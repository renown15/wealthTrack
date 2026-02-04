/**
 * Main application entry point.
 */
import { Router } from './router';

// Initialize router
const router = new Router();

// Navigate to home page on load
router.navigate('home');

// Check for stored auth token
const token = localStorage.getItem('accessToken');
if (token) {
  // Import and set token in API service
  void import('./services/ApiService').then(({ apiService }) => {
    apiService.setAuthToken(token);
  });
}

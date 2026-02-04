/**
 * Main application entry point.
 */
import { Router } from './router';

// Initialize router
const router = new Router();

// Check for stored auth token and set it before navigating
const token = localStorage.getItem('accessToken');
if (token) {
  // Import and set token in API service
  void import('./services/ApiService').then(({ apiService }) => {
    apiService.setAuthToken(token);
  });
}

// Navigate to home page on load (async)
void router.navigate('home');

import { exec } from 'child_process';
import { promisify } from 'util';
import { closeTestDb } from './fixtures';

const execPromise = promisify(exec);

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...');

  try {
    // Close database connections
    await closeTestDb();

    // Stop and remove Docker containers and volumes using test environment
    console.log('🛑 Stopping Docker containers...');
    await execPromise('docker-compose --env-file .env.test --profile test down -v');

    console.log('✅ Test environment cleaned up!\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't fail teardown - allow tests to exit
  }
}

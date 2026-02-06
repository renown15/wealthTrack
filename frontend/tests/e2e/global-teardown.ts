import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { closeTestDb } from './fixtures';

const execPromise = promisify(exec);

// Get the root directory (parent of frontend)
const rootDir = path.resolve(__dirname, '../../');

export default async function globalTeardown() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  E2E TEST ENVIRONMENT CLEANUP              ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Step 1: Close database connections
    console.log('📍 Step 1: Closing database connections...');
    try {
      await closeTestDb();
      console.log('   ✅ Database connections closed');
    } catch (error) {
      console.warn('   ⚠️  Error closing DB connections:', error);
    }

    // Step 2: Stop and remove Docker containers
    console.log('\n📍 Step 2: Stopping Docker containers...');
    try {
      await execPromise('docker-compose --env-file .env.test --profile test down -v', { cwd: rootDir });
      console.log('   ✅ Containers stopped and volumes removed');
    } catch (error) {
      console.warn('   ⚠️  Error stopping containers:', error);
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✅ CLEANUP COMPLETE                       ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't fail teardown - allow tests to exit
  }
}

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { seedReferenceData, clearTestDatabase } from './fixtures';

const execPromise = promisify(exec);

// Get the root directory (parent of frontend)
const rootDir = path.resolve(__dirname, '../../');

export default async function globalSetup() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  E2E TEST ENVIRONMENT SETUP                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Step 1: Start Docker containers
    console.log('📍 Step 1: Starting Docker containers...');
    console.log('   - Test DB: localhost:5434 (wealthtrack_test)');
    console.log('   - Test API: localhost:8001');
    console.log(`   - Working from: ${rootDir}`);
    console.log('');
    
    try {
      const { stdout, stderr } = await execPromise(
        'docker-compose --env-file .env.test --profile test up -d',
        { cwd: rootDir }
      );
      console.log(`   📤 stdout: ${stdout.trim() || '(empty)'}`);
      if (stderr) {
        console.log(`   📤 stderr: ${stderr.trim()}`);
      }
      console.log('   ✅ Containers started');
    } catch (error: any) {
      console.error('   ❌ Failed to start containers');
      console.error(`   Error: ${error.message}`);
      console.error(`   stderr: ${error.stderr}`);
      throw error;
    }

    // Step 2: Wait for database
    console.log('\n📍 Step 2: Waiting for database to be ready...');
    let dbReady = false;
    let dbRetries = 15;
    
    while (dbRetries > 0 && !dbReady) {
      try {
        await execPromise('pg_isready -h localhost -p 5434 -U wealthtrack_test');
        dbReady = true;
        console.log('   ✅ Database is ready');
      } catch (error) {
        dbRetries--;
        if (dbRetries > 0) {
          process.stdout.write(`   ⏳ Waiting... (${dbRetries}s) `);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!dbReady) {
      throw new Error('Database failed to become ready after 15 seconds');
    }

    // Step 3: Wait for API
    console.log('\n📍 Step 3: Waiting for API to be ready...');
    let apiReady = false;
    let apiRetries = 30;

    while (apiRetries > 0 && !apiReady) {
      try {
        const { stdout } = await execPromise('curl -f http://localhost:8001/docs 2>/dev/null');
        apiReady = true;
        console.log('   ✅ API is ready');
      } catch {
        apiRetries--;
        if (apiRetries > 0) {
          process.stdout.write(`   ⏳ Waiting... (${apiRetries}s) `);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!apiReady) {
      throw new Error('API failed to become ready after 60 seconds');
    }

    // Step 4: Seed database
    console.log('\n📍 Step 4: Seeding test database...');
    try {
      await clearTestDatabase();
      console.log('   ✅ Database cleared');
      await seedReferenceData();
      console.log('   ✅ Reference data seeded');
    } catch (error) {
      console.error('   ❌ Failed to seed database:', error);
      throw error;
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✅ TEST ENVIRONMENT READY                 ║');
    console.log('║  Starting 35 E2E tests...                  ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════╗');
    console.error('║  ❌ SETUP FAILED                           ║');
    console.error('╚════════════════════════════════════════════╝\n');
    console.error('Error:', error);
    process.exit(1);
  }
}


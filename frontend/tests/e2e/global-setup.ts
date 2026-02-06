import { exec } from 'child_process';
import { promisify } from 'util';
import { seedReferenceData, clearTestDatabase } from './fixtures';

const execPromise = promisify(exec);

export default async function globalSetup() {
  console.log('\n🚀 Starting test environment...');

  try {
    // Start Docker containers using the single docker-compose.yml with .env.test
    console.log('📦 Starting Docker containers (test-db on 5434, test-api on 8001)...');
    await execPromise('docker-compose --env-file .env.test --profile test up -d');

    // Wait for API to be healthy
    console.log('⏳ Waiting for API to be ready...');
    let retries = 30;
    let apiReady = false;

    while (retries > 0 && !apiReady) {
      try {
        const { stdout } = await execPromise('curl -f http://localhost:8001/docs 2>/dev/null');
        if (stdout) {
          apiReady = true;
          console.log('✅ API is ready!');
        }
      } catch {
        retries--;
        if (retries > 0) {
          console.log(`⏳ Waiting for API... (${retries} retries left)`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!apiReady) {
      throw new Error('API failed to become ready after 60 seconds');
    }

    // Seed test database with baseline data
    console.log('🌱 Seeding test database...');
    await clearTestDatabase();
    await seedReferenceData();
    console.log('✅ Test database seeded!');

    console.log('✅ Test environment ready!\n');
  } catch (error) {
    console.error('❌ Failed to start test environment:', error);
    process.exit(1);
  }
}


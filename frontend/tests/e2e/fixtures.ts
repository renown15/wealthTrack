// @ts-expect-error - pg module types not installed, but library available at runtime
import { Pool } from 'pg';

// Connect to test database (port 5434 as per .env.test)
const pool = new Pool({
  user: process.env.DB_USER || 'wealthtrack',
  password: process.env.DB_PASSWORD || 'wealthtrack_dev_password',
  host: 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_NAME || 'wealthtrack',
});

/**
 * Query test database
 */
export async function queryTestDb(sql: string, values?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Clear test database (keep schema, remove data)
 */
export async function clearTestDatabase() {
  const client = await pool.connect();
  try {
    console.log('   🗑️  Clearing test database...');
    const tableNames = ['AccountEvent', 'AccountAttribute', 'InstitutionSecurityCredentials', 'Account', 'Institution', 'UserProfile', 'ReferenceData'];
    
    for (const table of tableNames) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch (e) {
        // Ignore if table doesn't exist
      }
    }
    
    console.log('   ✅ Database cleared');
  } finally {
    client.release();
  }
}

/**
 * Seed baseline reference data (account types, statuses, etc)
 */
export async function seedReferenceData() {
  console.log('   🌱 Seeding reference data...');
  const referenceData = [
    // Account types
    { class: 'ACCOUNT_TYPE', key: 'CHECKING', referenceValue: 'Checking Account', sortIndex: 1 },
    { class: 'ACCOUNT_TYPE', key: 'SAVINGS', referenceValue: 'Savings Account', sortIndex: 2 },
    { class: 'ACCOUNT_TYPE', key: 'STOCKS_ISA', referenceValue: 'Stocks ISA', sortIndex: 3 },
    { class: 'ACCOUNT_TYPE', key: 'SIPP', referenceValue: 'SIPP', sortIndex: 4 },
    { class: 'ACCOUNT_TYPE', key: 'CREDIT_CARD', referenceValue: 'Credit Card', sortIndex: 5 },
    
    // Account statuses
    { class: 'ACCOUNT_STATUS', key: 'ACTIVE', referenceValue: 'Active', sortIndex: 1 },
    { class: 'ACCOUNT_STATUS', key: 'CLOSED', referenceValue: 'Closed', sortIndex: 2 },
    { class: 'ACCOUNT_STATUS', key: 'DORMANT', referenceValue: 'Dormant', sortIndex: 3 },
    
    // Event types
    { class: 'EVENT_TYPE', key: 'BALANCE_UPDATE', referenceValue: 'Balance Update', sortIndex: 1 },
    { class: 'EVENT_TYPE', key: 'TRANSACTION', referenceValue: 'Transaction', sortIndex: 2 },
    { class: 'EVENT_TYPE', key: 'FEE', referenceValue: 'Fee', sortIndex: 3 },
    
    // Attribute types
    { class: 'ATTRIBUTE_TYPE', key: 'INTEREST_RATE', referenceValue: 'Interest Rate', sortIndex: 1 },
    { class: 'ATTRIBUTE_TYPE', key: 'OVERDRAFT_LIMIT', referenceValue: 'Overdraft Limit', sortIndex: 2 },
    { class: 'ATTRIBUTE_TYPE', key: 'CREDIT_LIMIT', referenceValue: 'Credit Limit', sortIndex: 3 },
  ];

  let inserted = 0;
  for (const ref of referenceData) {
    await queryTestDb(
      `INSERT INTO "ReferenceData" (classkey, referencevalue, sortindex, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [`${ref.class}:${ref.key}`, ref.referenceValue, ref.sortIndex]
    );
    inserted++;
  }
  console.log(`   ✅ Reference data seeded (${inserted} items)`);
}

/**
 * Get test user by email
 */
export async function getTestUser(email: string) {
  const rows = await queryTestDb(
    'SELECT id, email, hashed_password, is_active, is_verified, created_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

/**
 * Get test user profile
 */
export async function getTestUserProfile(userId: number) {
  const rows = await queryTestDb(
    'SELECT id, user_id, firstname, surname, emailaddress, profile, created_at FROM user_profile WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Get user's accounts
 */
export async function getUserAccounts(userId: number) {
  const rows = await queryTestDb(
    `SELECT id, user_id, institution_id, name, type_id, status_id, created_at, updated_at
     FROM accounts WHERE user_id = $1 ORDER BY created_at`,
    [userId]
  );
  return rows;
}

/**
 * Get user's institutions
 */
export async function getUserInstitutions(userId: number) {
  const rows = await queryTestDb(
    'SELECT id, user_id, name, created_at, updated_at FROM institutions WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  return rows;
}

/**
 * Verify password was properly hashed
 */
export async function verifyPasswordHashed(email: string) {
  const user = await getTestUser(email);
  if (!user) return false;
  // bcrypt hashes start with $2
  return user.hashed_password.startsWith('$2');
}

/**
 * Close database connection
 */
export async function closeTestDb() {
  await pool.end();
}

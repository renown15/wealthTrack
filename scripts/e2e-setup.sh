#!/bin/bash
set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  E2E TEST ENVIRONMENT SETUP                ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Step 1: Start Docker containers
echo "📍 Step 1: Starting Docker containers..."
echo "   - Test DB: localhost:5434 (wealthtrack)"
echo "   - Test API: localhost:8001"
echo ""

cd "$(dirname "$0")/.."
docker-compose --env-file .env.test --profile test up -d
if [ $? -eq 0 ]; then
  echo "   ✅ Containers started"
else
  echo "   ❌ Failed to start containers"
  exit 1
fi

# Step 2: Wait for database
echo ""
echo "📍 Step 2: Waiting for database to be ready..."
RETRY=15
while [ $RETRY -gt 0 ]; do
  if pg_isready -h localhost -p 5434 -U wealthtrack >/dev/null 2>&1; then
    echo "   ✅ Database is ready"
    break
  fi
  RETRY=$((RETRY - 1))
  if [ $RETRY -gt 0 ]; then
    echo -n "   ⏳ Waiting... (${RETRY}s) "
    sleep 1
  fi
done

if [ $RETRY -eq 0 ]; then
  echo "   ❌ Database failed to become ready"
  exit 1
fi

# Step 3: Wait for API
echo ""
echo "📍 Step 3: Waiting for API to be ready..."
RETRY=30
while [ $RETRY -gt 0 ]; do
  if curl -f http://localhost:8001/docs >/dev/null 2>&1; then
    echo "   ✅ API is ready"
    break
  fi
  RETRY=$((RETRY - 1))
  if [ $RETRY -gt 0 ]; then
    echo -n "   ⏳ Waiting... (${RETRY}s) "
    sleep 2
  fi
done

if [ $RETRY -eq 0 ]; then
  echo "   ❌ API failed to become ready"
  exit 1
fi

# Step 4: Seed database using Node
echo ""
echo "📍 Step 4: Seeding test database..."
cd "$(dirname "$0")/../frontend"
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'wealthtrack',
  password: 'wealthtrack_dev_password',
  host: 'localhost',
  port: 5434,
  database: 'wealthtrack',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Clear database if tables exist
    console.log('   🗑️  Clearing test database...');
    const tableNames = ['AccountEvent', 'AccountAttribute', 'InstitutionSecurityCredentials', 'Account', 'Institution', 'UserProfile', 'ReferenceData'];
    
    for (const table of tableNames) {
      try {
        await client.query(\`TRUNCATE TABLE \\\"\${table}\\\" CASCADE\`);
      } catch (e) {
        // Ignore if table doesn't exist
      }
    }
    console.log('   ✅ Database cleared');

    // Seed reference data
    console.log('   🌱 Seeding reference data...');
    const referenceData = [
      ['ACCOUNT_TYPE', 'CHECKING', 'Checking Account', 1],
      ['ACCOUNT_TYPE', 'SAVINGS', 'Savings Account', 2],
      ['ACCOUNT_TYPE', 'STOCKS_ISA', 'Stocks ISA', 3],
      ['ACCOUNT_TYPE', 'SIPP', 'SIPP', 4],
      ['ACCOUNT_TYPE', 'CREDIT_CARD', 'Credit Card', 5],
      ['ACCOUNT_STATUS', 'ACTIVE', 'Active', 1],
      ['ACCOUNT_STATUS', 'CLOSED', 'Closed', 2],
      ['ACCOUNT_STATUS', 'DORMANT', 'Dormant', 3],
      ['EVENT_TYPE', 'BALANCE_UPDATE', 'Balance Update', 1],
      ['EVENT_TYPE', 'TRANSACTION', 'Transaction', 2],
      ['EVENT_TYPE', 'FEE', 'Fee', 3],
      ['ATTRIBUTE_TYPE', 'INTEREST_RATE', 'Interest Rate', 1],
      ['ATTRIBUTE_TYPE', 'OVERDRAFT_LIMIT', 'Overdraft Limit', 2],
      ['ATTRIBUTE_TYPE', 'CREDIT_LIMIT', 'Credit Limit', 3],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'OPENED_DATE', 'Account Opened Date', 1],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'CLOSED_DATE', 'Account Closed Date', 2],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'ACCOUNT_NUMBER', 'Account Number', 3],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'SORT_CODE', 'Sort Code', 4],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'ROLL_REF_NUMBER', 'Roll / Ref Number', 5],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'INTEREST_RATE', 'Interest Rate', 6],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'FIXED_BONUS_RATE', 'Fixed Bonus Rate', 7],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'FIXED_BONUS_RATE_END_DATE', 'Fixed Bonus Rate End Date', 8],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'IBAN', 'IBAN', 9],
      ['ACCOUNT_ATTRIBUTE_TYPE', 'NOTES', 'Notes', 10],
    ];

    for (const [cls, key, val, idx] of referenceData) {
      await client.query(
        \`INSERT INTO \\\"ReferenceData\\\" (classkey, referencevalue, sortindex, created_at, updated_at)
         VALUES (\$1, \$2, \$3, NOW(), NOW())\`,
        [cls + ':' + key, val, idx]
      );
    }
    console.log(\`   ✅ Reference data seeded (\${referenceData.length} items)\`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('   ❌ Seeding failed:', err.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
  echo ""
  echo "╔════════════════════════════════════════════╗"
  echo "║  ✅ TEST ENVIRONMENT READY                 ║"
  echo "║  Starting 35 E2E tests...                  ║"
  echo "╚════════════════════════════════════════════╝"
  echo ""
  exit 0
else
  echo "   ❌ Seeding failed"
  exit 1
fi

/**
 * Environment Variable Validation
 * Checks for required environment variables at startup
 * Exits with error code if required vars are missing
 */

function validateEnvironment() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET'
  ];

  const optional = [
    'PORT',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NODE_ENV'
  ];

  const missing = [];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Log status
  console.log('\n🔍 ENVIRONMENT VALIDATION');
  console.log('=' .repeat(50));

  if (missing.length > 0) {
    console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\n⚠️  Please set these variables in your .env file');
    console.log('=' .repeat(50) + '\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set:');
  required.forEach(key => {
    const value = process.env[key];
    const masked = value.substring(0, 3) + '*'.repeat(Math.max(0, value.length - 6)) + value.substring(Math.max(0, value.length - 3));
    console.log(`   ✓ ${key} = ${masked}`);
  });

  console.log('\n📋 Optional environment variables:');
  optional.forEach(key => {
    if (process.env[key]) {
      const value = process.env[key];
      const masked = key.includes('SECRET') || key.includes('KEY') 
        ? value.substring(0, 3) + '*'.repeat(Math.max(0, value.length - 6)) + value.substring(Math.max(0, value.length - 3))
        : value;
      console.log(`   ✓ ${key} = ${masked}`);
    } else {
      console.log(`   ○ ${key} = not set (using defaults)`);
    }
  });

  console.log('=' .repeat(50) + '\n');

  // Set defaults for optional variables
  if (!process.env.PORT) process.env.PORT = '5000';
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

  return true;
}

module.exports = validateEnvironment;

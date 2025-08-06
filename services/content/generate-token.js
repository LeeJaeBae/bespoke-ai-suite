/**
 * JWT Token Generator for Testing
 * Generates a valid JWT token for API testing
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'bespoke-ai-super-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Generate test token
function generateTestToken() {
  const payload = {
    sub: 'test-user-001',  // Changed from userId to sub (standard JWT claim)
    email: 'test@bespoke-ai.com',
    role: 'admin',
    permissions: ['content:create', 'content:read', 'content:update', 'content:delete']
  };
  
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'bespoke-ai-content-service'
  });
  
  return token;
}

// Generate and display token
const token = generateTestToken();

console.log('🔑 JWT Test Token Generated\n');
console.log('Token:', token);
console.log('\n📋 Usage Instructions:');
console.log('1. Add to request headers:');
console.log('   Authorization: Bearer ' + token);
console.log('\n2. Or export as environment variable:');
console.log('   export TEST_JWT_TOKEN="' + token + '"');
console.log('\n✅ Token valid for:', JWT_EXPIRES_IN);

// Decode and display token info
const decoded = jwt.decode(token);
console.log('\n📊 Token Payload:');
console.log(JSON.stringify(decoded, null, 2));

export default token;
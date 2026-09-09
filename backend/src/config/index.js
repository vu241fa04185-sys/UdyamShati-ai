const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'sih26091_rural_advisor_secure_jwt_secret_2026',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001',
  GOOGLE_MAPS_SERVER_KEY: process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  DATA_DIR: path.resolve(__dirname, '../../../data')
};

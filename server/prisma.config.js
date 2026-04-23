const { defineConfig } = require('@prisma/config');
require('dotenv').config();

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // This is the missing link!
    seed: 'node prisma/seed.js', 
  },
});
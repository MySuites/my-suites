#!/usr/bin/env node
// Wrapper to load .env (if present) before running the demo-creation script.
try {
  require('dotenv').config();
} catch (err) {
  // dotenv may not be installed globally; the package.json provides it as a devDependency.
}

require('./create_demo_user.js');

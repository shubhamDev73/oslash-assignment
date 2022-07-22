module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globalSetup: './setup.ts',
    globalTeardown: './tearDown.ts',
    coveragePathIgnorePatterns: ['/node_modules/']
};

const { config } = require('dotenv');
config();

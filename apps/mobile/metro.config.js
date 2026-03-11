const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the mobile app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Alias @dayframe/shared to the shared package
config.resolver.alias = {
  '@dayframe/shared': path.resolve(monorepoRoot, 'packages/shared/src/index.ts'),
};

// Treat .wasm files as static assets (required for expo-sqlite on web)
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

module.exports = config;

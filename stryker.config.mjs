/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    'packages/core/src/{parser,engine,limits,random,roll-service}.ts',
    'app/js/{parser,engine,random}.js',
  ],
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.mts' },
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  concurrency: 2,
  timeoutMS: 2000,
  timeoutFactor: 1.5,
  thresholds: { high: 95, low: 90, break: 90 },
};

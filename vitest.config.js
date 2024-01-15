import { defineConfig, configDefaults } from 'vitest/config'

const defaultExcludes = configDefaults.coverage.exclude || []

export default defineConfig({
  test: {
    outputFile: 'TESTS-TestSuites.xml',
    coverage: {
      reportsDirectory: 'coverage',
      exclude: [...defaultExcludes, 'index.js', 'jsdoc', 'out']
    }
  }
})

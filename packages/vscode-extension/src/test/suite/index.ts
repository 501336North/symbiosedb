/**
 * Test Suite Index
 * Configures Mocha test runner for VS Code extension tests
 */

import * as path from 'path';
import * as fs from 'fs';
import Mocha = require('mocha');

/**
 * Recursively find all test files
 */
function findTestFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    try {
      const testFiles = findTestFiles(testsRoot);

      // Add files to the test suite
      testFiles.forEach((f: string) => mocha.addFile(f));

      // Run the mocha test
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err: any) {
      console.error(err);
      reject(err);
    }
  });
}

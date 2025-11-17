/**
 * Utility functions for create-symbiosedb-app
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Template } from './templates';

const execAsync = promisify(exec);

/**
 * Copy template files to destination
 */
export async function copyTemplate(
  template: Template,
  destination: string
): Promise<void> {
  // Get the root directory (where the templates folder is)
  // This assumes the CLI is being run from the monorepo root or installed globally
  const rootDir = findRootDir();
  const templatePath = path.join(rootDir, template.sourcePath);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at: ${templatePath}`);
  }

  // Copy all files from template to destination
  await fs.copy(templatePath, destination, {
    filter: (src: string) => {
      // Skip node_modules and .next directories
      const basename = path.basename(src);
      return basename !== 'node_modules' && basename !== '.next' && basename !== 'dist';
    },
  });
}

/**
 * Update package.json with the new project name
 */
export async function updatePackageJson(
  projectPath: string,
  projectName: string
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return; // No package.json to update
  }

  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = projectName;

  // Remove any workspace-specific fields
  delete packageJson.workspaces;

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

/**
 * Install dependencies using npm
 */
export async function installDependencies(projectPath: string): Promise<void> {
  try {
    await execAsync('npm install', {
      cwd: projectPath,
      env: { ...process.env },
    });
  } catch (error: any) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

/**
 * Find the monorepo root directory
 */
function findRootDir(): string {
  // When installed globally, use the package's directory
  if (process.env.NODE_ENV === 'production' || !__dirname.includes('packages')) {
    // Look for templates directory relative to this file
    // Assuming structure: create-symbiosedb-app/dist/utils.js
    return path.resolve(__dirname, '..', '..');
  }

  // Development mode - find the monorepo root
  let currentDir = __dirname;
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'templates'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to parent directories
  return path.resolve(__dirname, '..', '..', '..');
}

/**
 * Check if npm is installed
 */
export async function checkNpmInstalled(): Promise<boolean> {
  try {
    await execAsync('npm --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get npm version
 */
export async function getNpmVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('npm --version');
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

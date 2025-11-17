#!/usr/bin/env node

/**
 * create-symbiosedb-app
 *
 * CLI tool to scaffold new SymbioseDB applications
 * Similar to create-next-app, create-react-app
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import validateNpmPackageName from 'validate-npm-package-name';
import { templates, Template } from './templates';
import { copyTemplate, updatePackageJson, installDependencies } from './utils';

const execAsync = promisify(exec);

const program = new Command();

program
  .name('create-symbiosedb-app')
  .description('Create a new SymbioseDB application')
  .version('0.1.0')
  .argument('[project-name]', 'Project name')
  .option('-t, --template <template>', 'Template to use (rag-app, basic-crud, multi-db)')
  .option('--no-install', 'Skip dependency installation')
  .action(async (projectName: string | undefined, options: any) => {
    console.log(chalk.cyan.bold('\n🔷 Create SymbioseDB App\n'));

    try {
      // Get project name
      let finalProjectName = projectName;
      if (!finalProjectName) {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'What is your project named?',
            default: 'my-symbiosedb-app',
            validate: (input: string) => {
              const validation = validateNpmPackageName(input);
              if (validation.validForNewPackages) {
                return true;
              }
              return validation.errors?.[0] || 'Invalid package name';
            },
          },
        ]);
        finalProjectName = name;
      }

      // Ensure project name is defined
      if (!finalProjectName) {
        console.error(chalk.red('\n✗ Project name is required\n'));
        process.exit(1);
      }

      // Validate project name
      const validation = validateNpmPackageName(finalProjectName);
      if (!validation.validForNewPackages) {
        console.error(chalk.red(`\n✗ Invalid project name: ${validation.errors?.[0]}\n`));
        process.exit(1);
      }

      // Get template choice
      let templateChoice = options.template;
      if (!templateChoice) {
        const { template } = await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Which template would you like to use?',
            choices: templates.map((t) => ({
              name: `${t.emoji} ${t.name} - ${t.description}`,
              value: t.id,
            })),
            default: 'rag-app',
          },
        ]);
        templateChoice = template;
      }

      const selectedTemplate = templates.find((t) => t.id === templateChoice);
      if (!selectedTemplate) {
        console.error(chalk.red(`\n✗ Template "${templateChoice}" not found\n`));
        process.exit(1);
      }

      // Confirm installation
      const { shouldInstall } = options.install === false
        ? { shouldInstall: false }
        : await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldInstall',
              message: 'Install dependencies?',
              default: true,
            },
          ]);

      // Create project directory
      const projectPath = path.resolve(process.cwd(), finalProjectName);
      if (fs.existsSync(projectPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory "${finalProjectName}" already exists. Overwrite?`,
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('\n✗ Aborted\n'));
          process.exit(0);
        }

        await fs.remove(projectPath);
      }

      await fs.ensureDir(projectPath);

      // Copy template files
      const spinner = ora('Creating project...').start();
      try {
        await copyTemplate(selectedTemplate, projectPath);
        await updatePackageJson(projectPath, finalProjectName);
        spinner.succeed(chalk.green('Project created'));
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to create project'));
        throw error;
      }

      // Install dependencies
      if (shouldInstall) {
        const installSpinner = ora('Installing dependencies...').start();
        try {
          await installDependencies(projectPath);
          installSpinner.succeed(chalk.green('Dependencies installed'));
        } catch (error: any) {
          installSpinner.fail(chalk.red('Failed to install dependencies'));
          console.log(chalk.yellow('\nYou can install dependencies manually by running:'));
          console.log(chalk.cyan(`  cd ${finalProjectName}`));
          console.log(chalk.cyan('  npm install\n'));
        }
      }

      // Success message
      console.log(chalk.green.bold('\n✓ Success!\n'));
      console.log(`Created ${chalk.cyan(finalProjectName)} at ${chalk.gray(projectPath)}\n`);

      console.log('Inside that directory, you can run several commands:\n');
      console.log(chalk.cyan('  npm run dev'));
      console.log('    Starts the development server\n');

      if (selectedTemplate.id === 'rag-app') {
        console.log(chalk.cyan('  npm run build'));
        console.log('    Builds the app for production\n');
      }

      console.log('We suggest that you begin by typing:\n');
      console.log(chalk.cyan(`  cd ${finalProjectName}`));
      if (!shouldInstall) {
        console.log(chalk.cyan('  npm install'));
      }
      console.log(chalk.cyan('  npm run dev'));
      console.log();

      // Template-specific instructions
      if (selectedTemplate.postInstallMessage) {
        console.log(chalk.yellow('📝 Note:'));
        console.log(selectedTemplate.postInstallMessage);
        console.log();
      }

      console.log(chalk.gray('Happy coding! 🚀\n'));
    } catch (error: any) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();

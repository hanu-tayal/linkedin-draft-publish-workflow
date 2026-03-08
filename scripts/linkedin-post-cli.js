#!/usr/bin/env node

/**
 * Post an approved LinkedIn draft through the global `linkedin` CLI.
 *
 * Usage:
 *   node scripts/linkedin-post-cli.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md --dry-run
 *   node scripts/linkedin-post-cli.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md --yes
 *   node scripts/linkedin-post-cli.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md --yes --company-url https://www.linkedin.com/company/example
 */

const readline = require('readline');
const { spawnSync } = require('child_process');
const {
  readDraftFile,
  renderPreview,
  validateDraft,
} = require('./linkedin-draft-lib');

function getFlagValue(args, flagName) {
  const index = args.indexOf(flagName);
  if (index === -1) {
    return null;
  }

  return args[index + 1] || null;
}

function flattenObjectForSearch(value) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const entries = [];
  for (const entryValue of Object.values(value)) {
    entries.push(entryValue);
    entries.push(...flattenObjectForSearch(entryValue));
  }
  return entries;
}

function findLikelyPostUrl(payload) {
  const candidates = [payload, ...flattenObjectForSearch(payload)];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('https://www.linkedin.com/')) {
      return candidate;
    }
  }
  return null;
}

function promptForApproval(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipPrompt = args.includes('--yes');
  const companyUrl = getFlagValue(args, '--company-url');
  const accountName = getFlagValue(args, '--account');
  const draftPath = args.find((arg) => !arg.startsWith('--') && arg !== companyUrl && arg !== accountName);

  try {
    const { resolvedPath, raw } = readDraftFile(draftPath);
    const validationResult = validateDraft(raw);

    if (!validationResult.isValid) {
      console.error('Draft is not ready to post.\n');
      console.error(renderPreview(validationResult));
      process.exit(1);
    }

    console.log(`Draft file: ${resolvedPath}\n`);
    console.log(renderPreview(validationResult));
    console.log('');

    if (dryRun) {
      console.log('Dry run only. No LinkedIn post was created.');
      process.exit(0);
    }

    if (!skipPrompt) {
      const answer = await promptForApproval('Type POST to publish this draft via linkedin-cli: ');
      if (answer !== 'POST') {
        console.log('Post cancelled.');
        process.exit(0);
      }
    }

    const commandArgs = ['post', 'create', validationResult.draftText];
    if (companyUrl) {
      commandArgs.push('--company-url', companyUrl);
    }
    if (accountName) {
      commandArgs.push('--account', accountName);
    }
    commandArgs.push('--json', '-q');

    const result = spawnSync('linkedin', commandArgs, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    if (result.error) {
      if (result.error.code === 'ENOENT') {
        console.error('The `linkedin` CLI is not installed or not on PATH.');
        console.error('Install it with: npm install -g @linkedapi/linkedin-cli');
      } else {
        console.error(result.error.message);
      }
      process.exit(1);
    }

    if (result.status !== 0) {
      if (result.stderr) {
        console.error(result.stderr.trim());
      }
      console.error(`linkedin-cli exited with code ${result.status}.`);
      process.exit(result.status || 1);
    }

    const stdout = result.stdout.trim();
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(stdout);
    } catch (error) {
      console.error('linkedin-cli returned non-JSON output:');
      console.error(stdout);
      process.exit(1);
    }

    if (parsedOutput.success === false) {
      console.error('linkedin-cli reported a posting error:');
      console.error(JSON.stringify(parsedOutput, null, 2));
      process.exit(1);
    }

    const postUrl = findLikelyPostUrl(parsedOutput) || 'PASTE_URL_HERE';
    const today = new Date().toISOString().slice(0, 10);

    console.log('LinkedIn post created successfully.\n');
    console.log(JSON.stringify(parsedOutput, null, 2));
    console.log('\nSuggested log row:');
    console.log(`| ${today} | \`${draftPath}\` | ${validationResult.metadata.Theme} | ${validationResult.metadata['Primary goal']} | Approved | linkedin-cli | \`${postUrl}\` | Story / framework | Add 24-72 hour notes | Capture top comment and decide follow-up |`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();

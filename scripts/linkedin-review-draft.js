#!/usr/bin/env node

/**
 * Validate a LinkedIn draft and print a posting preview.
 *
 * Usage:
 *   node scripts/linkedin-review-draft.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md
 *   node scripts/linkedin-review-draft.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md --json
 *   node scripts/linkedin-review-draft.js profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md --text-only
 */

const {
  readDraftFile,
  renderPreview,
  validateDraft,
} = require('./linkedin-draft-lib');

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const textOnly = args.includes('--text-only');
  const draftPath = args.find((arg) => !arg.startsWith('--'));

  try {
    const { resolvedPath, raw } = readDraftFile(draftPath);
    const validationResult = validateDraft(raw);

    if (textOnly) {
      console.log(validationResult.draftText);
    } else if (jsonMode) {
      console.log(JSON.stringify({
        draftPath: resolvedPath,
        ...validationResult,
      }, null, 2));
    } else {
      console.log(`Draft file: ${resolvedPath}\n`);
      console.log(renderPreview(validationResult));
    }

    process.exit(validationResult.isValid ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();

const fs = require('fs');
const path = require('path');

const REQUIRED_METADATA = [
  'Theme',
  'Primary goal',
  'Source proof points',
  'Intended audience',
];

const TEMPLATE_PLACEHOLDERS = [
  'Write one line that earns attention without sounding inflated.',
  'Add one or two lines explaining why Himanshu has earned this point of view.',
  'Use three to five short paragraphs or bullets. Keep each one focused on a single idea.',
  'End with one clear conclusion, principle, or framework.',
  'Invite discussion naturally.',
];

function resolveDraftPath(inputPath) {
  if (!inputPath) {
    throw new Error('Provide a draft path, for example: profile/linkedin-drafts/2026-03-09-amazon-q-from-zero-to-one.md');
  }

  return path.resolve(process.cwd(), inputPath);
}

function readDraftFile(inputPath) {
  const resolvedPath = resolveDraftPath(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Draft file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return { resolvedPath, raw };
}

function extractSection(raw, heading) {
  const sectionHeader = `## ${heading}`.trim();
  const lines = raw.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === sectionHeader);

  if (startIndex === -1) {
    return '';
  }

  const collectedLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('## ')) {
      break;
    }
    collectedLines.push(line);
  }

  return collectedLines.join('\n').trim();
}

function parseMetadata(metadataSection) {
  const metadata = {};

  for (const line of metadataSection.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('- ')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(2, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();
    metadata[key] = value;
  }

  return metadata;
}

function normalizeDraftText(draftSection) {
  return draftSection
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('**') || line.includes(':'))
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function countWords(text) {
  const words = text.match(/\b[\w#.+/-]+\b/g);
  return words ? words.length : 0;
}

function validateDraft(raw) {
  const metadataSection = extractSection(raw, 'Metadata');
  const draftSection = extractSection(raw, 'Draft');
  const metadata = parseMetadata(metadataSection);
  const draftText = normalizeDraftText(draftSection);

  const errors = [];
  const warnings = [];

  if (!metadataSection) {
    errors.push('Missing `## Metadata` section.');
  }

  if (!draftSection) {
    errors.push('Missing `## Draft` section.');
  }

  for (const key of REQUIRED_METADATA) {
    if (!metadata[key]) {
      errors.push(`Missing metadata field: ${key}`);
    }
  }

  if (!draftText) {
    errors.push('Draft section is empty.');
  }

  for (const placeholder of TEMPLATE_PLACEHOLDERS) {
    if (draftText.includes(placeholder)) {
      errors.push('Draft still contains template placeholder text.');
      break;
    }
  }

  const wordCount = countWords(draftText);
  if (wordCount < 120) {
    warnings.push(`Draft is short at ${wordCount} words.`);
  }

  if (wordCount > 420) {
    warnings.push(`Draft is long at ${wordCount} words.`);
  }

  return {
    metadata,
    draftText,
    wordCount,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

function renderPreview(validationResult) {
  const { metadata, draftText, wordCount, errors, warnings, isValid } = validationResult;
  const lines = [];

  lines.push(`Ready to post: ${isValid ? 'yes' : 'no'}`);
  lines.push(`Word count: ${wordCount}`);
  lines.push('');
  lines.push('Metadata:');

  for (const key of REQUIRED_METADATA) {
    lines.push(`- ${key}: ${metadata[key] || '(missing)'}`);
  }

  if (warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const error of errors) {
      lines.push(`- ${error}`);
    }
  }

  lines.push('');
  lines.push('Post preview:');
  lines.push('---');
  lines.push(draftText);
  lines.push('---');

  return lines.join('\n');
}

module.exports = {
  REQUIRED_METADATA,
  countWords,
  normalizeDraftText,
  parseMetadata,
  readDraftFile,
  renderPreview,
  resolveDraftPath,
  validateDraft,
};

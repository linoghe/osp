const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PASSWORD = process.env.OSP_PASSWORD || 'changeme';
const SRC_DIR = __dirname;
const OUT_DIR = path.join(__dirname, 'dist');

const HTML_FILES = [
  'index.html',
  'engagement.html',
  'scope.html',
  'effort.html',
  'context.html',
  'questions.html',
  'pricing-model.html',
  'scope-markdown.html',
  'gantt.html',
  'whitepaper.html'
];

const STATIC_FILES = ['_shared.css'];

if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

STATIC_FILES.forEach(file => {
  fs.copyFileSync(path.join(SRC_DIR, file), path.join(OUT_DIR, file));
});

console.log(`\nEncrypting ${HTML_FILES.length} pages with Staticrypt...\n`);

const filePaths = HTML_FILES.map(f => `"${path.join(SRC_DIR, f)}"`).join(' ');

const cmd = [
  'npx staticrypt',
  filePaths,
  `-p "${PASSWORD}"`,
  `-d "${OUT_DIR}"`,
  '--short',
  '--remember 7',
  '--template-title "OSP · Peer Pricing Review"',
  '--template-instructions "Enter the password shared with you to access this document."',
  '--template-color-primary "#3B7DD8"',
  '--template-color-secondary "#0F172A"',
  '--template-button "Unlock"',
  '--template-placeholder "Password"',
  '--template-error "Incorrect password. Please try again."',
  '-c false'
].join(' ');

try {
  execSync(cmd, { stdio: 'inherit', cwd: SRC_DIR });
  console.log(`\nDone. Encrypted site written to: ${OUT_DIR}/`);
  console.log(`Password used: "${PASSWORD}"`);
  console.log('\nTo deploy: push the dist/ folder to your gh-pages branch.\n');
} catch (err) {
  console.error('Encryption failed:', err.message);
  process.exit(1);
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PASSWORD = process.env.OSP_PASSWORD || 'changeme';
const SALT = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
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

const CSS_FILE = '_shared.css';
const PREP_DIR = path.join(__dirname, '.prep');

if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true });
}
if (fs.existsSync(PREP_DIR)) {
  fs.rmSync(PREP_DIR, { recursive: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PREP_DIR, { recursive: true });

const cssContent = fs.readFileSync(path.join(SRC_DIR, CSS_FILE), 'utf-8');
const linkTag = /<link[^>]+_shared\.css[^>]*\/?>/i;

HTML_FILES.forEach(file => {
  let html = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8');
  html = html.replace(linkTag, `<style>\n${cssContent}\n</style>`);
  fs.writeFileSync(path.join(PREP_DIR, file), html);
});

console.log(`\nInlined CSS into ${HTML_FILES.length} pages.`);
console.log(`Encrypting with Staticrypt...\n`);

const filePaths = HTML_FILES.map(f => `"${path.join(PREP_DIR, f)}"`).join(' ');

const cmd = [
  'npx staticrypt',
  filePaths,
  `-p "${PASSWORD}"`,
  `-s ${SALT}`,
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
} finally {
  fs.rmSync(PREP_DIR, { recursive: true, force: true });
}

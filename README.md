# OSP Peer Pricing Review

A password-protected multi-page document for sharing an anonymous project spec with selected peers. Deployed on GitHub Pages with AES-256 encryption via [Staticrypt](https://github.com/robinmoisson/staticrypt).

## How It Works

The source HTML files are the unencrypted, readable pages. The `encrypt.js` script processes each page through Staticrypt, producing a `dist/` folder where every HTML file is encrypted. Only the `dist/` folder gets deployed to GitHub Pages. Visitors see a password prompt; content is not in the DOM until the correct password is entered.

## Local Development

Preview the unencrypted source files with any static server:

```bash
npx serve .
```

## Build (Encrypt)

```bash
npm install
OSP_PASSWORD="your-chosen-password" npm run build
```

This creates `dist/` with all HTML pages encrypted and static assets copied.

Preview the encrypted build:

```bash
npm run serve
```

## Deploy to GitHub Pages

1. Create a GitHub repo (private recommended, though encryption protects content regardless).
2. After running the build, deploy the `dist/` folder.

### Option A: gh-pages branch (manual)

```bash
npm run build
cd dist
git init
git add .
git commit -m "Deploy encrypted site"
git branch -M gh-pages
git remote add origin git@github.com:YOUR_USER/osp-peer-review.git
git push -u origin gh-pages --force
```

### Option B: GitHub Actions (automated)

Add a workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          OSP_PASSWORD: ${{ secrets.OSP_PASSWORD }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Set `OSP_PASSWORD` in your repo's Settings > Secrets > Actions.

## Sharing

Send the GitHub Pages URL along with the password (via DM, email, or Signal). Each peer gets the same password. If you need to rotate access, change the password and re-deploy.

## Project Structure

```
osp/
├── _shared.css          # Shared styles (OSP branding)
├── index.html           # 00 Hub
├── engagement.html      # 01 Client & Discipline
├── scope.html           # 02 Phased Scope
├── effort.html          # 03 Effort & Role
├── context.html         # 04 Pricing Context
├── questions.html       # 05 Questions for Peer
├── encrypt.js           # Build script (Staticrypt wrapper)
├── package.json         # Dependencies & scripts
├── .gitignore           # Excludes dist/, node_modules/
└── Project Spec for Peer Review.pdf  # Source PDF
```

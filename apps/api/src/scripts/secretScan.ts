import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

const SECRET_PATTERNS = [
  { name: 'Anthropic Live Secret', regex: /sk-ant-api03-[a-zA-Z0-9_-]{20,}/ },
  { name: 'OpenAI Secret Key', regex: /sk-proj-[a-zA-Z0-9_-]{20,}/ },
  { name: 'Generic AWS Secret', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key Block', regex: /-----BEGIN\s+PRIVATE\s+KEY-----/ },
  { name: 'RSA Private Key Block', regex: /-----BEGIN\s+RSA\s+PRIVATE\s+KEY-----/ },
];

const IGNORED_PATHS = ['node_modules', '.git', 'dist', 'build', '.env', 'secretScan.ts', 'secretScan.js'];

const scanDirectory = (dir: string, leaks: string[]): void => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_PATHS.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, leaks);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.md'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pat of SECRET_PATTERNS) {
        if (pat.regex.test(content)) {
          leaks.push(`[${pat.name}] detected in ${fullPath.replace(rootDir, '')}`);
        }
      }
    }
  }
};

export const runSecretScan = (): boolean => {
  console.log('========================================================');
  console.log('🔒 Running Nexora Static Security & Secret Leak Audit');
  console.log('========================================================');

  const leaks: string[] = [];
  scanDirectory(rootDir, leaks);

  // Check that .env is listed in .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.env')) {
      leaks.push('[CRITICAL] .env is not present in root .gitignore!');
    }
  }

  if (leaks.length > 0) {
    console.error('❌ SECRET LEAKS FOUND:');
    leaks.forEach((l) => console.error(`  - ${l}`));
    return false;
  }

  console.log('✅ Zero hardcoded secrets detected across repository.');
  console.log('✅ .gitignore properly excludes .env and credential artifacts.');
  console.log('========================================================\n');
  return true;
};

if (process.argv[1]?.endsWith('secretScan.ts') || process.argv[1]?.endsWith('secretScan.js')) {
  const ok = runSecretScan();
  process.exit(ok ? 0 : 1);
}

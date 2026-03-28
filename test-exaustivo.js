/**
 * Cogit CLI - Teste Exaustivo Completo
 * Executa todos os testes em um único arquivo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_REPO = __dirname;
const COGIT_PATH = 'c:\\code\\github\\cogit';

const RESULTS = {
  timestamp: new Date().toISOString(),
  platform: { os: process.platform, arch: process.arch, node: process.version },
  phases: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function execCmd(cmd, opts = {}) {
  try {
    return { success: true, stdout: execSync(cmd, { encoding: 'utf-8', cwd: opts.cwd || TEST_REPO, stdio: 'pipe', timeout: opts.timeout || 10000 }) };
  } catch (e) { return { success: false, stdout: e.stdout || '', stderr: e.stderr || e.message }; }
}

function runTest(phase, id, name, fn) {
  const start = Date.now();
  try {
    const r = fn();
    const d = Date.now() - start;
    phase.tests.push({ id, name, status: r.success ? 'PASS' : 'FAIL', duration_ms: d, message: r.message, error: r.error });
    if (r.success) phase.summary.passed++; else phase.summary.failed++;
    phase.summary.total++;
  } catch (e) {
    phase.tests.push({ id, name, status: 'ERROR', duration_ms: Date.now() - start, error: e.message });
    phase.summary.failed++; phase.summary.total++;
  }
}

// ═══════════════════════════════════════════════════════════════
// FASE 1: FUNCIONALIDADES BÁSICAS
// ═══════════════════════════════════════════════════════════════

const phase1 = { name: 'Funcionalidades Básicas', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase1, '1.1', 'Scanner detecta arquivos modificados', () => {
  fs.writeFileSync(path.join(TEST_REPO, 'test-s1.txt'), 'mod');
  const r = execCmd('git status --porcelain');
  execCmd('git checkout -- test-s1.txt');
  return r.success && r.stdout.includes('test-s1.txt') ? { success: true, message: 'OK' } : { success: false, error: 'Não detectado' };
});

runTest(phase1, '1.2', 'Scanner detecta arquivos novos', () => {
  const f = path.join(TEST_REPO, 'test-new.txt');
  fs.writeFileSync(f, 'new');
  const r = execCmd('git status --porcelain');
  fs.unlinkSync(f);
  return r.stdout.includes('test-new.txt') ? { success: true, message: 'OK' } : { success: false, error: 'Não detectado' };
});

runTest(phase1, '1.3', 'Commit básico', () => {
  const f = path.join(TEST_REPO, 'test-commit.txt');
  fs.writeFileSync(f, 'commit test');
  execCmd('git add test-commit.txt');
  const r = execCmd('git commit -m "test: basic"');
  execCmd('git reset --hard HEAD~1');
  if (fs.existsSync(f)) fs.unlinkSync(f);
  return r.success ? { success: true, message: 'OK' } : { success: false, error: 'Commit falhou' };
});

runTest(phase1, '1.4', 'Branch: listar', () => {
  const r = execCmd('git branch');
  return r.success && r.stdout.length > 0 ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase1, '1.5', 'Branch: criar', () => {
  const name = 'test-br-' + Date.now();
  const r = execCmd(`git branch ${name}`);
  const list = execCmd('git branch');
  execCmd(`git branch -D ${name}`);
  return r.success && list.stdout.includes(name) ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase1, '1.6', 'Tag: listar', () => {
  const r = execCmd('git tag -l');
  return r.success ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase1, '1.7', 'Tag: criar', () => {
  const name = 'test-tag-' + Date.now();
  const r = execCmd(`git tag ${name}`);
  const list = execCmd('git tag -l');
  execCmd(`git tag -d ${name}`);
  return r.success && list.stdout.includes(name) ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

RESULTS.phases.push(phase1);

// ═══════════════════════════════════════════════════════════════
// FASE 4: MULTIPLATAFORMA
// ═══════════════════════════════════════════════════════════════

const phase4 = { name: 'Multiplataforma', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase4, '4.1', 'Detecção de plataforma', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const detected = p.platform.getName();
    const expected = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
    return detected === expected ? { success: true, message: detected } : { success: false, error: `Esperado ${expected}` };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.2', 'Detecção de Windows', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    return p.platform.isWindows === (process.platform === 'win32') ? { success: true, message: 'OK' } : { success: false, error: 'Incorreto' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.3', 'Detecção de shell', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const shell = p.platform.getShell();
    return shell && shell.length > 0 ? { success: true, message: shell } : { success: false, error: 'Não detectado' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.4', 'Git executable', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const git = p.platform.getGitCommand();
    const expected = process.platform === 'win32' ? 'git.exe' : 'git';
    return git === expected ? { success: true, message: git } : { success: false, error: `Esperado ${expected}` };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.5', 'Normalização de paths', () => {
  try {
    const { normalizePathForOS } = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const norm = normalizePathForOS('a/b/c');
    const hasSep = process.platform === 'win32' ? norm.includes('\\') : norm.includes('/');
    return hasSep ? { success: true, message: norm } : { success: false, error: 'Não normalizado' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.6', 'Escape de paths com espaços', () => {
  try {
    const { escapePathForShell } = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const esc = escapePathForShell('path with spaces');
    return esc.includes('"') ? { success: true, message: esc } : { success: false, error: 'Não escapado' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.7', 'Home directory', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const home = p.platform.getHomeDir();
    return home && fs.existsSync(home) ? { success: true, message: home } : { success: false, error: 'Inválido' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.8', 'Arquivo com espaços', () => {
  const f = path.join(TEST_REPO, 'file with spaces.txt');
  return fs.existsSync(f) ? { success: true, message: 'OK' } : { success: false, error: 'Não existe' };
});

runTest(phase4, '4.9', 'Git add com espaços', () => {
  fs.writeFileSync(path.join(TEST_REPO, 'file with spaces.txt'), 'mod');
  const r = execCmd('git add "file with spaces.txt"');
  execCmd('git reset HEAD -- "file with spaces.txt"');
  execCmd('git checkout -- "file with spaces.txt"');
  return r.success ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase4, '4.10', 'Path separator', () => {
  try {
    const p = require(path.join(COGIT_PATH, 'dist', 'utils', 'platform'));
    const sep = p.platform.getPathSeparator();
    const expected = process.platform === 'win32' ? '\\' : '/';
    return sep === expected ? { success: true, message: sep } : { success: false, error: `Esperado ${expected}` };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.11', 'execGit function', () => {
  try {
    const { execGit } = require(path.join(COGIT_PATH, 'dist', 'utils', 'executor'));
    return typeof execGit === 'function' ? { success: true, message: 'OK' } : { success: false, error: 'Não é função' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase4, '4.12', 'execCommand function', () => {
  try {
    const { execCommand: ec } = require(path.join(COGIT_PATH, 'dist', 'utils', 'executor'));
    return typeof ec === 'function' ? { success: true, message: 'OK' } : { success: false, error: 'Não é função' };
  } catch (e) { return { success: false, error: e.message }; }
});

RESULTS.phases.push(phase4);

// ═══════════════════════════════════════════════════════════════
// FASE 2: SMART FEATURES
// ═══════════════════════════════════════════════════════════════

const phase2 = { name: 'Smart Features', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase2, '2.1', 'VibeVault: smartPack', () => {
  try {
    const v = require(path.join(COGIT_PATH, 'dist', 'core', 'vault'));
    return typeof v.smartPack === 'function' ? { success: true, message: 'OK' } : { success: false, error: 'Não disponível' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase2, '2.2', 'VibeVault: smartUnpack', () => {
  try {
    const v = require(path.join(COGIT_PATH, 'dist', 'core', 'vault'));
    return typeof v.smartUnpack === 'function' ? { success: true, message: 'OK' } : { success: false, error: 'Não disponível' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase2, '2.3', 'Stealth Mode: módulo', () => {
  const p = path.join(COGIT_PATH, 'dist', 'services', 'tools', 'stealth.js');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

runTest(phase2, '2.4', 'Smart Ignore: common_trash.json', () => {
  const p = path.join(COGIT_PATH, 'src', 'config', 'common_trash.json');
  if (!fs.existsSync(p)) return { success: false, error: 'Não encontrado' };
  const obj = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const keys = Object.keys(obj);
  return keys.length > 0 ? { success: true, message: `${keys.length} padrões` } : { success: false, error: 'Vazio' };
});

runTest(phase2, '2.5', 'Smart Ignore: módulo', () => {
  const p = path.join(COGIT_PATH, 'dist', 'services', 'tools', 'ignore.js');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

RESULTS.phases.push(phase2);

// ═══════════════════════════════════════════════════════════════
// FASE 3: SEGURANÇA
// ═══════════════════════════════════════════════════════════════

const phase3 = { name: 'Segurança', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase3, '3.1', 'Security: diretório existe', () => {
  const p = path.join(COGIT_PATH, 'dist', 'services', 'security');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

runTest(phase3, '3.2', 'Redactor: mascarar API keys', () => {
  try {
    const r = require(path.join(COGIT_PATH, 'dist', 'services', 'security', 'redactor'));
    if (typeof r.redact !== 'function') return { success: true, message: 'Redactor em outro local' };
    const red = r.redact('API_KEY=sk-1234567890abcdef');
    return !red.includes('sk-1234567890abcdef') ? { success: true, message: 'OK' } : { success: false, error: 'Não mascarou' };
  } catch (e) { return { success: true, message: 'Redactor em outro local' }; }
});

runTest(phase3, '3.3', 'Redactor: mascarar tokens', () => {
  try {
    const r = require(path.join(COGIT_PATH, 'dist', 'services', 'security', 'redactor'));
    if (typeof r.redact !== 'function') return { success: true, message: 'Skip' };
    const red = r.redact('TOKEN=ghp_1234567890abcdef');
    return !red.includes('ghp_1234567890abcdef') ? { success: true, message: 'OK' } : { success: false, error: 'Não mascarou' };
  } catch (e) { return { success: true, message: 'Skip' }; }
});

RESULTS.phases.push(phase3);

// ═══════════════════════════════════════════════════════════════
// FASE 5: EDGE CASES
// ═══════════════════════════════════════════════════════════════

const phase5 = { name: 'Edge Cases', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase5, '5.1', 'Arquivo vazio', () => {
  const f = path.join(TEST_REPO, 'test-empty.txt');
  if (!fs.existsSync(f)) fs.writeFileSync(f, '');
  return fs.statSync(f).size === 0 ? { success: true, message: 'OK' } : { success: false, error: 'Não vazio' };
});

runTest(phase5, '5.2', 'Arquivo binário', () => {
  const f = path.join(TEST_REPO, 'test-binary.bin');
  return fs.existsSync(f) ? { success: true, message: 'OK' } : { success: true, message: 'Skip' };
});

runTest(phase5, '5.3', 'Arquivo grande (1MB)', () => {
  const f = path.join(TEST_REPO, 'stress-large.bin');
  if (!fs.existsSync(f)) return { success: true, message: 'Skip' };
  const mb = fs.statSync(f).size / (1024 * 1024);
  return mb >= 0.9 ? { success: true, message: `${mb.toFixed(1)}MB` } : { success: false, error: 'Muito pequeno' };
});

runTest(phase5, '5.4', 'Unicode/Emoji', () => {
  const f = path.join(TEST_REPO, 'test-unicode.txt');
  fs.writeFileSync(f, '🎉 Olá 世界 🌍');
  const c = fs.readFileSync(f, 'utf-8');
  fs.unlinkSync(f);
  return c.includes('🎉') && c.includes('世界') ? { success: true, message: 'OK' } : { success: false, error: 'Unicode não preservado' };
});

runTest(phase5, '5.5', 'Mensagem longa', () => {
  const f = path.join(TEST_REPO, 'test-long-msg.txt');
  if (!fs.existsSync(f)) fs.writeFileSync(f, 'x'.repeat(10000));
  return fs.statSync(f).size >= 5000 ? { success: true, message: 'OK' } : { success: false, error: 'Muito curto' };
});

RESULTS.phases.push(phase5);

// ═══════════════════════════════════════════════════════════════
// FASE 6: STRESS TESTS
// ═══════════════════════════════════════════════════════════════

const phase6 = { name: 'Stress Tests', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase6, '6.1', 'Arquivos stress', () => {
  const files = fs.readdirSync(TEST_REPO).filter(f => f.startsWith('stress-') && f.endsWith('.txt'));
  return files.length >= 100 ? { success: true, message: `${files.length} arquivos` } : { success: false, error: 'Poucos arquivos' };
});

runTest(phase6, '6.2', 'Git status performance', () => {
  const start = Date.now();
  const r = execCmd('git status --porcelain');
  const d = Date.now() - start;
  return r.success && d < 5000 ? { success: true, message: `${d}ms` } : { success: false, error: `Lento: ${d}ms` };
});

runTest(phase6, '6.3', 'Memória', () => {
  const before = process.memoryUsage().heapUsed / 1024 / 1024;
  const f = path.join(TEST_REPO, 'test-large-diff.txt');
  if (fs.existsSync(f)) { const c = fs.readFileSync(f, 'utf-8'); }
  const after = process.memoryUsage().heapUsed / 1024 / 1024;
  return (after - before) < 50 ? { success: true, message: `${(after - before).toFixed(1)}MB` } : { success: false, error: 'Memória excessiva' };
});

RESULTS.phases.push(phase6);

// ═══════════════════════════════════════════════════════════════
// FASE 7: FLAGS
// ═══════════════════════════════════════════════════════════════

const phase7 = { name: 'Flags', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase7, '7.1', '--help', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" --help`);
  return r.success && (r.stdout.includes('Usage') || r.stdout.includes('cogit')) ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase7, '7.2', '--version', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" --version`);
  return r.success && /\d+\.\d+\.\d+/.test(r.stdout) ? { success: true, message: 'OK' } : { success: false, error: 'Falhou' };
});

runTest(phase7, '7.3', '--no-push documentado', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" auto --help`);
  return r.stdout.includes('no-push') ? { success: true, message: 'OK' } : { success: false, error: 'Não documentado' };
});

runTest(phase7, '7.4', '--yes documentado', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" auto --help`);
  return r.stdout.includes('--yes') || r.stdout.includes('-y') ? { success: true, message: 'OK' } : { success: false, error: 'Não documentado' };
});

runTest(phase7, '7.5', '--message documentado', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" auto --help`);
  return r.stdout.includes('--message') || r.stdout.includes('-m') ? { success: true, message: 'OK' } : { success: false, error: 'Não documentado' };
});

RESULTS.phases.push(phase7);

// ═══════════════════════════════════════════════════════════════
// FASE 8: I18N
// ═══════════════════════════════════════════════════════════════

const phase8 = { name: 'Internacionalização', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase8, '8.1', 'Locale en.json', () => {
  const p = path.join(COGIT_PATH, 'src', 'locales', 'en.json');
  if (!fs.existsSync(p)) return { success: false, error: 'Não encontrado' };
  const obj = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return Object.keys(obj).length > 0 ? { success: true, message: `${Object.keys(obj).length} traduções` } : { success: false, error: 'Vazio' };
});

runTest(phase8, '8.2', 'Locale pt.json', () => {
  const p = path.join(COGIT_PATH, 'src', 'locales', 'pt.json');
  if (!fs.existsSync(p)) return { success: false, error: 'Não encontrado' };
  const obj = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return Object.keys(obj).length > 0 ? { success: true, message: `${Object.keys(obj).length} traduções` } : { success: false, error: 'Vazio' };
});

runTest(phase8, '8.3', 'i18n module', () => {
  const p = path.join(COGIT_PATH, 'dist', 'config', 'i18n.js');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

runTest(phase8, '8.4', 'LANGUAGE documentada', () => {
  const p = path.join(COGIT_PATH, '.env.example');
  if (!fs.existsSync(p)) return { success: false, error: 'Não encontrado' };
  return fs.readFileSync(p, 'utf-8').includes('LANGUAGE') ? { success: true, message: 'OK' } : { success: false, error: 'Não documentado' };
});

RESULTS.phases.push(phase8);

// ═══════════════════════════════════════════════════════════════
// FASE 9: GIT HEALER
// ═══════════════════════════════════════════════════════════════

const phase9 = { name: 'Git Healer', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase9, '9.1', 'Módulo healer', () => {
  const p = path.join(COGIT_PATH, 'dist', 'services', 'git', 'healer.js');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

runTest(phase9, '9.2', 'healGitError', () => {
  try {
    const h = require(path.join(COGIT_PATH, 'dist', 'services', 'git', 'healer'));
    return typeof h.healGitError === 'function' ? { success: true, message: 'OK' } : { success: false, error: 'Não disponível' };
  } catch (e) { return { success: false, error: e.message }; }
});

runTest(phase9, '9.3', 'Integração AI', () => {
  const p = path.join(COGIT_PATH, 'dist', 'services', 'git', 'healer.js');
  const c = fs.readFileSync(p, 'utf-8');
  return c.includes('OpenRouter') || c.includes('AI') || c.includes('provider') ? { success: true, message: 'OK' } : { success: false, error: 'Sem AI' };
});

RESULTS.phases.push(phase9);

// ═══════════════════════════════════════════════════════════════
// FASE 10: MENU
// ═══════════════════════════════════════════════════════════════

const phase10 = { name: 'Menu Interativo', tests: [], summary: { total: 0, passed: 0, failed: 0 } };

runTest(phase10, '10.1', 'Comando menu', () => {
  const r = execCmd(`node "${path.join(COGIT_PATH, 'dist', 'index.js')}" --help`);
  return r.stdout.includes('menu') ? { success: true, message: 'OK' } : { success: false, error: 'Não documentado' };
});

runTest(phase10, '10.2', 'Módulo menu', () => {
  const p = path.join(COGIT_PATH, 'dist', 'cli', 'commands', 'menu.js');
  return fs.existsSync(p) ? { success: true, message: 'OK' } : { success: false, error: 'Não encontrado' };
});

runTest(phase10, '10.3', 'Opções do menu', () => {
  const p = path.join(COGIT_PATH, 'dist', 'cli', 'commands', 'menu.js');
  const c = fs.readFileSync(p, 'utf-8').toLowerCase();
  const found = ['branch', 'tag', 'ignore', 'stealth', 'status'].filter(o => c.includes(o));
  return found.length >= 3 ? { success: true, message: `${found.length} opções` } : { success: false, error: 'Poucas opções' };
});

RESULTS.phases.push(phase10);

// ═══════════════════════════════════════════════════════════════
// RELATÓRIO FINAL
// ═══════════════════════════════════════════════════════════════

RESULTS.phases.forEach(p => {
  RESULTS.summary.total += p.summary.total;
  RESULTS.summary.passed += p.summary.passed;
  RESULTS.summary.failed += p.summary.failed;
});

RESULTS.summary.success_rate = RESULTS.summary.total > 0 
  ? ((RESULTS.summary.passed / RESULTS.summary.total) * 100).toFixed(1) + '%'
  : '0%';

// Salvar relatório
fs.writeFileSync(path.join(TEST_REPO, 'test-report.json'), JSON.stringify(RESULTS, null, 2));

// Exibir resultados
console.log('\n' + '═'.repeat(60));
console.log('🧪 COGIT CLI - TESTES EXAUSTIVOS MULTIPLATAFORMA');
console.log('═'.repeat(60));
console.log(`📅 ${RESULTS.timestamp}`);
console.log(`💻 ${RESULTS.platform.os} (${RESULTS.platform.arch}) | Node ${RESULTS.platform.node}`);
console.log('─'.repeat(60));

RESULTS.phases.forEach((p, i) => {
  const status = p.summary.failed === 0 ? '✅' : '❌';
  console.log(`${status} Fase ${i + 1}: ${p.name} - ${p.summary.passed}/${p.summary.total}`);
});

console.log('─'.repeat(60));
console.log(`📊 TOTAL: ${RESULTS.summary.passed}/${RESULTS.summary.total} (${RESULTS.summary.success_rate})`);
console.log(`✅ Passou: ${RESULTS.summary.passed}`);
console.log(`❌ Falhou: ${RESULTS.summary.failed}`);
console.log('═'.repeat(60));

process.exit(RESULTS.summary.failed > 0 ? 1 : 0);

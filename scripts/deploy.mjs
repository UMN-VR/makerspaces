// Overlay only /tour/makerspaces/; never rebuild or replace the existing tour.
// A build of the commits already published is not pushed again: it differs in its build time alone,
// and every push to the tour's gh-pages has GitHub Pages deploy the whole tour (About's differentBuild).
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { differentBuild, readBuiltFromHtml } from 'foss-earth/vite'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const BRANCH = 'refs/heads/gh-pages'
const PREFIX = 'makerspaces/'

function collect(root, under = '') {
  return readdirSync(path.join(root, under), { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '.DS_Store') return []
    const name = path.posix.join(under, entry.name)
    if (entry.isSymbolicLink() || entry.name.startsWith('.') || /[\r\n\t\0]/.test(name)) throw new Error(`Invalid publishing path: ${name}`)
    if (entry.isDirectory()) return collect(root, name)
    if (!entry.isFile()) throw new Error(`Not a regular file: ${name}`)
    return [[`${PREFIX}${name}`, path.join(root, name)]]
  }).sort(([a], [b]) => a.localeCompare(b))
}

export function publishMakerspaces({ root = ROOT, hostingRepo = path.resolve(ROOT, '../tour'), remote = 'origin', dryRun = false, force = false, log = console.log } = {}) {
  const dist = path.join(root, 'dist')
  if (!existsSync(dist) || lstatSync(dist).isSymbolicLink() || !lstatSync(dist).isDirectory()) throw new Error('Expected a regular makerspaces dist directory.')
  for (const name of ['index.html', 'scene.json', 'content/spaces.json', 'embed-preview.html']) {
    if (!existsSync(path.join(dist, name))) throw new Error(`Incomplete makerspaces build: ${name}`)
  }
  const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
  if (!html.includes('noindex') || !html.includes('/tour/makerspaces/')) throw new Error('Expected an unlisted build at /tour/makerspaces/.')
  const files = collect(dist)
  if (!files.some(([name]) => name.startsWith(`${PREFIX}assets/`))) throw new Error('Build has no runtime assets.')
  if (files.some(([name]) => /(?:^|\/)foss-earth-sw\.js$/.test(name))) throw new Error('This iframe prototype must not publish a service worker.')
  const stateRoot = path.join(root, 'build')
  mkdirSync(stateRoot, { recursive: true })
  const state = mkdtempSync(path.join(stateRoot, 'publish-'))
  const env = { ...process.env, GIT_INDEX_FILE: path.join(state, 'index') }
  const git = (args, input) => execFileSync('git', ['-c', 'pack.threads=2', ...args], {
    cwd: hostingRepo, env, input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['pipe', 'pipe', 'inherit'],
  }).trim()
  try {
    git(['fetch', '--no-tags', '--depth=1', '--', remote, BRANCH])
    const parent = git(['rev-parse', 'FETCH_HEAD'])
    let published = null
    try { published = git(['show', `${parent}:${PREFIX}index.html`]) } catch { /* Not published yet. */ }
    if (!force && !differentBuild(readBuiltFromHtml(published), readBuiltFromHtml(html))) {
      log('The tour gh-pages branch already has a build of these commits; nothing was pushed. Pass --force to publish it anyway.')
      return { changed: false, commit: parent, changedPaths: [] }
    }
    git(['read-tree', parent])
    // Store the build in the hosting repository without touching its checkout or normal index.
    const hashes = git(['hash-object', '-w', '--stdin-paths'], files.map(([, file]) => JSON.stringify(file)).join('\n') + '\n').split('\n')
    git(['update-index', '--add', '--index-info'], files.map(([name], index) => `100644 ${hashes[index]}\t${name}`).join('\n') + '\n')
    const tree = git(['write-tree'])
    const changedPaths = git(['diff-tree', '--no-commit-id', '--name-only', '-r', parent, tree]).split('\n').filter(Boolean)
    if (changedPaths.some(name => !name.startsWith(PREFIX))) throw new Error('Publishing would modify existing tour files; refusing.')
    if (!changedPaths.length) return { changed: false, commit: parent, tree, changedPaths }
    const source = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
    const commit = git(['commit-tree', tree, '-p', parent, '-m', `Publish unlisted makerspaces prototype at ${source}`])
    // Normal fast-forward push: a simultaneous hosting update fails safely.
    if (dryRun) log(`Prepared ${commit}: ${changedPaths.length} makerspaces files; existing tour unchanged. No push.`)
    else {
      git(['push', '--', remote, `${commit}:${BRANCH}`])
      log(`Published https://umn-vr.github.io/tour/makerspaces/ (${changedPaths.length} makerspaces files; existing tour unchanged).`)
    }
    return { changed: true, parent, commit, tree, changedPaths }
  } finally { rmSync(state, { recursive: true, force: true }) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(arg => arg !== '--dry-run' && arg !== '--force')) throw new Error('Usage: npm run deploy -- [--dry-run] [--force]')
  const result = publishMakerspaces({ dryRun: process.argv.includes('--dry-run'), force: process.argv.includes('--force') })
  mkdirSync(path.join(ROOT, 'build'), { recursive: true })
  // The result stays local; it can be checked against the hosting branch after publication.
  writeFileSync(path.join(ROOT, 'build/deployment.json'), `${JSON.stringify(result, null, 2)}\n`)
}

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { publishMakerspaces } from './deploy.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const folders = []
const photograph = Buffer.from([0xff, 0xd8, 0x00, 0x11, 0xff, 0xd9])
const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const put = (root, name, contents) => {
  mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
  writeFileSync(path.join(root, name), contents)
}
const blob = (root, revision, name) => execFileSync('git', ['show', `${revision}:${name}`], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] })
const refs = remote => git(remote, ['for-each-ref', '--format=%(refname) %(objectname)'])

function init(root, branch = 'main') {
  mkdirSync(root, { recursive: true })
  git(root, ['init', `--initial-branch=${branch}`])
  git(root, ['config', 'user.name', 'Makerspaces deployment tests'])
  git(root, ['config', 'user.email', 'makerspaces-tests@example.invalid'])
}

function checkoutState(root) {
  return {
    head: git(root, ['rev-parse', 'HEAD']),
    index: readFileSync(path.join(root, '.git/index')),
    status: git(root, ['status', '--porcelain=v1', '--untracked-files=all']),
    readme: readFileSync(path.join(root, 'README.md')),
    untracked: readFileSync(path.join(root, 'draft.txt')),
  }
}

function fixture() {
  const checks = path.join(ROOT, 'build', 'checks')
  mkdirSync(checks, { recursive: true })
  const folder = mkdtempSync(path.join(checks, 'makerspaces-publish-'))
  folders.push(folder)
  const root = path.join(folder, 'makerspaces')
  const hostingRepo = path.join(folder, 'tour')
  const published = path.join(folder, 'published')
  const remote = path.join(folder, 'tour.git')
  git(folder, ['init', '--bare', '--initial-branch=gh-pages', remote])
  init(published, 'gh-pages')
  put(published, 'index.html', 'The existing campus selector')
  put(published, 'CNAME', 'tour.example.invalid')
  put(published, '.nojekyll', '')
  put(published, 'foss-earth-sw.js', 'Existing parent tour worker')
  put(published, 'assets/campus.js', 'Existing campus runtime')
  for (const campus of ['minneapolis', 'st-paul', 'twin-cities']) {
    put(published, `${campus}/index.html`, `Existing ${campus} tour`)
    put(published, `${campus}/scene.json`, JSON.stringify({ id: campus }))
  }
  put(published, 'twin-cities/media/Photo with spaces.jpg', photograph)
  put(published, 'makerspaces/index.html', 'An older makerspaces prototype')
  put(published, 'makerspaces/assets/old.js', 'A cached prototype runtime')
  git(published, ['add', '.'])
  git(published, ['commit', '-m', 'Existing campus publication'])
  git(published, ['remote', 'add', 'origin', remote])
  git(published, ['push', 'origin', 'gh-pages'])
  const parent = git(published, ['rev-parse', 'HEAD'])

  init(hostingRepo)
  put(hostingRepo, 'README.md', 'Hosting source checkout')
  git(hostingRepo, ['add', 'README.md'])
  git(hostingRepo, ['commit', '-m', 'Hosting source'])
  git(hostingRepo, ['remote', 'add', 'origin', remote])
  put(hostingRepo, 'README.md', 'Staged source edit')
  git(hostingRepo, ['add', 'README.md'])
  put(hostingRepo, 'README.md', 'Unstaged source edit after staging')
  put(hostingRepo, 'draft.txt', 'Untracked source work')
  const beforeCheckout = checkoutState(hostingRepo)

  init(root)
  put(root, 'README.md', 'Independent makerspaces source')
  git(root, ['add', 'README.md'])
  git(root, ['commit', '-m', 'Makerspaces source'])
  put(root, 'dist/index.html', '<meta name="robots" content="noindex,nofollow"><script src="/tour/makerspaces/assets/prototype.js"></script>')
  put(root, 'dist/embed-preview.html', '<iframe src="/tour/makerspaces/"></iframe>')
  put(root, 'dist/scene.json', '{"id":"makerspaces"}')
  put(root, 'dist/content/spaces.json', '{"spaces":[]}')
  put(root, 'dist/assets/prototype.js', 'Makerspaces runtime')
  put(root, 'dist/media/Photo with spaces.jpg', photograph)
  const publish = options => publishMakerspaces({ root, hostingRepo, log: () => {}, ...options })
  return { folder, root, hostingRepo, remote, parent, beforeCheckout, publish }
}

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})

test('publishes only makerspaces paths while preserving every existing campus file and the dirty hosting checkout', () => {
  const { root, hostingRepo, remote, parent, beforeCheckout, publish } = fixture()
  const outsideBefore = git(remote, ['ls-tree', '-r', parent]).split('\n').filter(line => !line.split('\t')[1].startsWith('makerspaces/'))
  const result = publish()
  assert.equal(result.changed, true)
  assert.equal(git(remote, ['rev-parse', 'refs/heads/gh-pages']), result.commit)
  assert.equal(result.parent, parent)
  assert.deepEqual(git(hostingRepo, ['rev-list', '--parents', '-n', '1', result.commit]).split(' '), [result.commit, parent])
  assert.ok(result.changedPaths.length > 0)
  assert.ok(result.changedPaths.every(name => name.startsWith('makerspaces/')))
  assert.deepEqual(git(remote, ['ls-tree', '-r', result.commit]).split('\n').filter(line => !line.split('\t')[1].startsWith('makerspaces/')), outsideBefore)
  assert.deepEqual(blob(remote, result.commit, 'twin-cities/media/Photo with spaces.jpg'), photograph)
  assert.deepEqual(blob(remote, result.commit, 'makerspaces/media/Photo with spaces.jpg'), readFileSync(path.join(root, 'dist/media/Photo with spaces.jpg')))
  assert.equal(blob(remote, result.commit, 'makerspaces/index.html').toString(), readFileSync(path.join(root, 'dist/index.html'), 'utf8'))
  assert.deepEqual(checkoutState(hostingRepo), beforeCheckout)
  assert.deepEqual(readdirSync(path.join(root, 'build')), [])
})

test('dry-run prepares a reviewable commit without changing any remote ref or the normal index', () => {
  const { root, hostingRepo, remote, beforeCheckout, publish } = fixture()
  const before = refs(remote)
  const result = publish({ dryRun: true })
  assert.equal(result.changed, true)
  assert.equal(git(hostingRepo, ['rev-parse', `${result.commit}^{tree}`]), result.tree)
  assert.equal(refs(remote), before)
  assert.deepEqual(checkoutState(hostingRepo), beforeCheckout)
  assert.deepEqual(readdirSync(path.join(root, 'build')), [])
})

test('an identical repeat skips publishing, while a later build still preserves parent tour bytes', () => {
  const { root, hostingRepo, remote, beforeCheckout, publish } = fixture()
  const first = publish()
  const identical = publish()
  assert.equal(identical.changed, false)
  assert.equal(identical.commit, first.commit)
  put(root, 'dist/assets/prototype.js', 'Updated makerspaces runtime')
  const changed = publish()
  assert.equal(changed.parent, first.commit)
  assert.deepEqual(changed.changedPaths, ['makerspaces/assets/prototype.js'])
  assert.deepEqual(blob(remote, changed.commit, 'twin-cities/media/Photo with spaces.jpg'), photograph)
  assert.deepEqual(checkoutState(hostingRepo), beforeCheckout)
})

const invalidBuilds = [
  ['a missing prototype scene', root => rmSync(path.join(root, 'dist/scene.json')), /Incomplete makerspaces build/],
  ['a missing directory', root => rmSync(path.join(root, 'dist/content/spaces.json')), /Incomplete makerspaces build/],
  ['a missing iframe preview', root => rmSync(path.join(root, 'dist/embed-preview.html')), /Incomplete makerspaces build/],
  ['an absent runtime asset', root => rmSync(path.join(root, 'dist/assets'), { recursive: true }), /no runtime assets/],
  ['a symlink file', root => symlinkSync(path.join(root, 'README.md'), path.join(root, 'dist/assets/link.js')), /Invalid publishing path/],
  ['a symlink directory', root => symlinkSync(path.join(root, 'dist/assets'), path.join(root, 'dist/linked-assets')), /Invalid publishing path/],
  ['a service worker', root => put(root, 'dist/foss-earth-sw.js', 'Unexpected worker'), /must not publish a service worker/],
  ['a nested service worker', root => put(root, 'dist/assets/foss-earth-sw.js', 'Unexpected nested worker'), /must not publish a service worker/],
  ['an indexed prototype', root => put(root, 'dist/index.html', '<script src="/tour/makerspaces/assets/prototype.js"></script>'), /Expected an unlisted build/],
  ['the parent tour deployment path', root => put(root, 'dist/index.html', '<meta name="robots" content="noindex"><script src="/tour/assets/prototype.js"></script>'), /Expected an unlisted build/],
]

for (const [description, invalidate, error] of invalidBuilds) {
  test(`rejects ${description} before reading the remote`, () => {
    const { root, hostingRepo, remote, beforeCheckout, publish } = fixture()
    const before = refs(remote)
    invalidate(root)
    // This nonexistent remote demonstrates that local validation happens first.
    assert.throws(() => publish({ remote: path.join(root, 'no-such-remote') }), error)
    assert.equal(refs(remote), before)
    assert.deepEqual(checkoutState(hostingRepo), beforeCheckout)
  })
}

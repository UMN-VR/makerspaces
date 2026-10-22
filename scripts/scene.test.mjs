import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkSceneFiles, validateSceneDocument } from '@foss-earth/scenes/node'
import { buildScene } from './build-scene.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const readJson = name => JSON.parse(readFileSync(path.join(ROOT, name), 'utf8'))
const input = readJson('content/tour.json')
const source = readJson(input.sourceScene)
const writtenText = readFileSync(path.join(ROOT, 'scene.json'), 'utf8')
const written = JSON.parse(writtenText)
const directory = readJson('content/spaces.json')
const baseUrl = 'https://umn-vr.github.io/tour/makerspaces/scene.json'

test('the checked-in scene is the deterministic output of its documented inputs', () => {
  assert.equal(writtenText, buildScene())
  assert.equal(buildScene(), buildScene())
  assert.equal(written.id, input.id)
  assert.equal(written.extensions['umn-vr.makerspaces'].sourceScene, input.sourceUrl)
  assert.equal(written.extensions['umn-vr.makerspaces'].sourceRevision, source.revision)
})

test('the scene validates with the public FOSS Earth validator and starts at an included panorama', () => {
  const result = validateSceneDocument(writtenText, { baseUrl })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.equal(written.initialPanorama, input.initialPanorama)
  assert.ok(written.entities.some(entity => entity.id === written.initialPanorama))
  assert.deepEqual(written.entities.map(entity => entity.id), input.panoramas)
  const ids = new Set(written.entities.map(entity => entity.id))
  assert.equal(ids.size, written.entities.length)
  for (const entity of written.entities) {
    assert.equal(entity.type, 'panorama')
    for (const link of entity.links ?? []) assert.ok(ids.has(link.target), `Dangling link ${entity.id} -> ${link.target}`)
  }
  for (const group of written.groups) for (const member of group.members) assert.ok(ids.has(member), `Missing group member ${member}`)
  for (const space of directory.spaces) if (space.panoramaId) assert.ok(ids.has(space.panoramaId), `Missing directory panorama ${space.panoramaId}`)
})

test('panorama placement, attribution, revisions and image sizes match the existing scene exactly', () => {
  for (const entity of written.entities) {
    const original = source.entities.find(candidate => candidate.id === entity.id)
    assert.ok(original)
    assert.deepEqual(entity, {
      ...original,
      links: (original.links ?? []).filter(link => input.panoramas.includes(link.target)),
    })
  }
  const used = new Set(written.entities.map(entity => entity.assetId))
  assert.equal(written.assets.length, used.size)
  for (const asset of written.assets) {
    assert.ok(used.has(asset.id))
    assert.equal(asset.type, 'panorama-image')
    const original = source.assets.find(candidate => candidate.id === asset.id)
    assert.ok(original)
    const expected = structuredClone(original)
    for (const representation of expected.representations) {
      if (representation.url) representation.url = new URL(representation.url, input.sourceUrl).href
      if (representation.faces) representation.faces = Object.fromEntries(Object.entries(representation.faces).map(([face, url]) => [face, new URL(url, input.sourceUrl).href]))
      if (representation.extensions?.['foss-earth.preview-sheets']) {
        delete representation.extensions['foss-earth.preview-sheets']
        if (!Object.keys(representation.extensions).length) delete representation.extensions
      }
    }
    // Includes asset revision, image dimensions, encoded byte counts and credit.
    assert.deepEqual(asset, expected)
  }
})

/** Read existing published image blobs in one local Git batch, with no fetch or checkout. */
function publishedMedia() {
  const repo = path.resolve(process.env.MAKERSPACES_HOSTING_REPO || path.join(ROOT, '../tour'))
  const revision = process.env.MAKERSPACES_PUBLISHED_REF || 'refs/remotes/origin/gh-pages'
  const mediaPaths = [...new Set(written.assets.map(asset => `twin-cities/media/${asset.id}/`))]
  const entries = execFileSync('git', ['ls-tree', '-rlz', revision, '--', ...mediaPaths], { cwd: repo, encoding: 'utf8' })
    .split('\0').filter(Boolean).map(line => {
      const [header, name] = line.split('\t')
      const [, type, oid, size] = header.trim().split(/\s+/)
      assert.equal(type, 'blob')
      return { oid, size: Number(size), name }
    })
  assert.ok(entries.length > 0, `No existing panorama media found in ${repo} at ${revision}`)
  const oids = [...new Set(entries.map(entry => entry.oid))]
  const batch = execFileSync('git', ['cat-file', '--batch'], {
    cwd: repo, input: `${oids.join('\n')}\n`, maxBuffer: 32 * 1024 * 1024,
  })
  const blobs = new Map()
  let at = 0
  for (const expected of oids) {
    const end = batch.indexOf(0x0a, at)
    assert.ok(end >= at)
    const [oid, type, length] = batch.subarray(at, end).toString('ascii').split(' ')
    assert.equal(oid, expected)
    assert.equal(type, 'blob')
    const size = Number(length)
    blobs.set(oid, batch.subarray(end + 1, end + 1 + size))
    at = end + size + 2
  }
  const urls = new Map()
  for (const entry of entries) {
    const bytes = blobs.get(entry.oid)
    assert.equal(bytes.length, entry.size)
    urls.set(`https://umn-vr.github.io/tour/${entry.name}`, bytes)
  }
  return urls
}

test('all absolute panorama references use existing published image bytes, including every tile', () => {
  const result = validateSceneDocument(writtenText, { baseUrl })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  const media = publishedMedia()
  const requested = new Set()
  const report = checkSceneFiles(result.scene, url => {
    assert.ok(url.startsWith('https://umn-vr.github.io/tour/twin-cities/media/'), `Unexpected media origin/path: ${url}`)
    requested.add(url)
    return media.get(url) ?? null
  })
  assert.deepEqual(report.problems, [])
  assert.ok(requested.size > 0)
  assert.ok(report.bytes > 0)
})

test('ordinary Anderson photos retain their source and checksums and never enter the panorama scene', () => {
  const credits = readJson('public/media/ATTRIBUTION.json')
  const ids = directory.spaces.map(space => space.id)
  assert.equal(new Set(ids).size, ids.length)
  const photos = directory.spaces.filter(space => space.image)
  assert.ok(photos.length > 0)
  for (const space of photos) {
    assert.equal(space.panoramaId, undefined, `${space.id} would make an ordinary photograph launch as a panorama`)
    const local = space.image.url.replace(/^\.\//, '')
    assert.ok(local.startsWith('media/') && !local.includes('..'))
    const credit = credits.assets.find(asset => `media/${asset.file}` === local)
    assert.ok(credit, `Missing provenance for ${space.image.url}`)
    assert.match(credit.projection, /flat photograph/)
    assert.equal(space.image.credit, credit.credit)
    assert.equal(space.image.sourceUrl, credit.sourcePage)
    const bytes = readFileSync(path.join(ROOT, 'public', local))
    assert.equal(bytes.length, credit.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), credit.sha256)
    assert.ok(!writtenText.includes(credit.file), `${credit.file} must remain a flat directory photograph`)
  }
})

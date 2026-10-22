import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { addPreparedPanorama } from '@foss-earth/scenes/authoring'

const ROOT = fileURLToPath(new URL('../', import.meta.url))

export function buildScene(root = ROOT) {
  const input = JSON.parse(readFileSync(path.join(root, 'content/tour.json'), 'utf8'))
  const source = JSON.parse(readFileSync(path.resolve(root, input.sourceScene), 'utf8'))
  const entities = input.panoramas.map(id => {
    const original = source.entities.find(entity => entity.id === id)
    if (!original) throw new Error(`Missing source panorama: ${id}`)
    const entity = structuredClone(original)
    entity.links = (entity.links ?? []).filter(link => input.panoramas.includes(link.target))
    return entity
  })
  const assetIds = new Set(entities.map(entity => entity.assetId))
  const assets = source.assets.filter(asset => assetIds.has(asset.id)).map(original => {
    const asset = structuredClone(original)
    for (const representation of asset.representations) {
      if (representation.url) representation.url = new URL(representation.url, input.sourceUrl).href
      if (representation.faces) representation.faces = Object.fromEntries(Object.entries(representation.faces).map(([face, url]) => [face, new URL(url, input.sourceUrl).href]))
      // Single-image previews need no shared sheet or dependency on the parent scene.
      if (representation.extensions?.['foss-earth.preview-sheets']) {
        delete representation.extensions['foss-earth.preview-sheets']
        if (!Object.keys(representation.extensions).length) delete representation.extensions
      }
    }
    return asset
  })
  if (assets.length !== assetIds.size) throw new Error('A panorama is missing its image asset.')
  let scene = {
    format: 'foss-earth-scene', version: 1, id: input.id, title: input.title,
    requiredExtensions: [],
    extensions: { 'umn-vr.makerspaces': {
      status: 'Unlisted prototype; no University endorsement implied.',
      sourceScene: input.sourceUrl,
      sourceRevision: source.revision,
      build: 'scripts/build-scene.mjs from content/tour.json',
      imagery: 'Existing campus-tour panorama, not a new capture or a current equipment inventory. Anderson Labs photographs are separate, flat photographs in the directory.',
    } },
    assets, entities,
    groups: [{ id: 'east-bank', title: 'East Bank', members: entities.map(entity => entity.id) }],
    initialPanorama: input.initialPanorama,
    overview: {
      target: { longitudeDeg: -93.2362247, latitudeDeg: 44.9752803, height: null },
      distanceMeters: 1400, headingDeg: 0, pitchDeg: -50, verticalFovDeg: 60,
    },
  }
  for (const entry of input.imports ?? []) {
    const { fragment, ...options } = entry
    const prepared = JSON.parse(readFileSync(path.resolve(root, fragment), 'utf8'))
    scene = addPreparedPanorama(scene, prepared, options)
  }
  scene.revision = createHash('sha256').update(JSON.stringify(scene)).digest('hex').slice(0, 12)
  return `${JSON.stringify(scene, null, 2)}\n`
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildScene()
  const destination = path.join(ROOT, 'scene.json')
  if (process.argv.includes('--check')) {
    if (readFileSync(destination, 'utf8') !== result) throw new Error('scene.json is stale; run npm run build:scene.')
    console.log('The makerspaces scene matches its inputs.')
  } else {
    writeFileSync(destination, result)
    console.log('Built scene.json with the Toaster panorama and existing published media.')
  }
}

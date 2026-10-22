import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defaultServerConditions, defineConfig, type Plugin } from 'vite'
import { babylonBarrels, babylonShaderChunks, builtFrom, lazyFeatures, localSource, networkHttps } from 'foss-earth/vite'
import { bootTerminal, browserRecovery } from '@foss-earth/ui/vite'

const BASE = '/tour/makerspaces/'
const CONTENT = ['scene.json', 'content/spaces.json']

/** The scene and editorial directory stay owned by this independent repository. */
function makerspaceContent(): Plugin {
  let outDir = ''
  let building = false
  return {
    name: 'umn-vr-makerspaces-content',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      building = config.command === 'build'
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        const file = CONTENT.find(name => pathname === `${BASE}${name}`)
        if (!file) return next()
        response.setHeader('Content-Type', 'application/json')
        response.end(readFileSync(file))
      })
    },
    closeBundle() {
      if (!building) return
      for (const file of CONTENT) {
        const destination = path.join(outDir, file)
        mkdirSync(path.dirname(destination), { recursive: true })
        writeFileSync(destination, readFileSync(file))
      }
    },
  }
}

function sourceVersion(): string {
  try {
    const commit = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()
    return `${commit}${dirty ? '-dirty' : ''}`
  } catch { return 'prototype' }
}

export default defineConfig({
  base: BASE,
  resolve: {
    conditions: ['source', ...defaultClientConditions],
    preserveSymlinks: true,
    dedupe: ['@babylonjs/core', '@babylonjs/loaders', '3d-tiles-renderer', 'react', 'react-dom'],
  },
  ssr: { resolve: { conditions: ['source', ...defaultServerConditions] } },
  server: { port: 8661, strictPort: true, fs: { allow: ['.', '../../foss-earth', '../../Felipegalind0/gamepad-tools'] } },
  preview: { port: 8661, strictPort: true },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __SOURCE_VERSION__: JSON.stringify(sourceVersion()),
    __REPOSITORY_SLUG__: JSON.stringify('UMN-VR/makerspaces'),
    __PAGES_REPOSITORY_SLUG__: JSON.stringify('UMN-VR/tour'),
    __FOSS_EARTH_APP_FILES__: JSON.stringify(''),
    __FOSS_EARTH_ISOLATION__: JSON.stringify('off'),
  },
  build: { rolldownOptions: { input: { makerspaces: 'index.html', embedPreview: 'embed-preview.html' } } },
  // No new service worker or isolation policy: the prototype also runs in an iframe.
  plugins: [networkHttps(), localSource(), react(), makerspaceContent(), babylonBarrels(), babylonShaderChunks(), lazyFeatures(),
    browserRecovery({ appId: 'umn-vr-makerspaces' }), bootTerminal({ pages: page => page === '/index.html' }), builtFrom()],
})

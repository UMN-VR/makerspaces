import type { GlobeAppHandle } from 'foss-earth'
import { isBrowserRecoveryPage, markBrowserAppReady, reportBrowserAppFailure } from '@foss-earth/ui/browser'
import './style.css'

interface SpaceImage { url: string; alt: string; credit: string; sourceUrl: string }
interface Space {
  id: string
  title: string
  campus: 'East Bank' | 'West Bank' | 'St. Paul'
  room: string
  summary: string
  url: string
  image?: SpaceImage
  panoramaId?: string
}
interface Directory { checkedAt: string; spaces: Space[] }

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error(`Missing tour element: ${id}`)
  return found as T
}

// Inert until the app adopts it into the native Makerspaces tab.
const template = element<HTMLTemplateElement>('makerspaces-content')
const panel = document.importNode(template.content, true).querySelector<HTMLElement>('.makerspaces-tab')
if (!panel) throw new Error('Missing makerspaces tab content.')
function tabElement<T extends HTMLElement>(id: string): T {
  const found = panel?.querySelector<T>(`#${id}`)
  if (!found) throw new Error(`Missing makerspaces tab element: ${id}`)
  return found
}
const content = tabElement('directory-content')
const state = tabElement('tour-state')
const currentSpace = tabElement('current-space')
const panoramaButton = tabElement<HTMLButtonElement>('panorama-button')
let app: GlobeAppHandle | null = null
let directory: Directory | null = null
let campus = 'All campuses'
let selected: Space | null = null

function text<K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.textContent = value
  if (className) node.className = className
  return node
}

function externalLink(label: string, href: string, className?: string): HTMLAnchorElement {
  const node = text('a', label, className)
  node.href = href
  node.target = '_blank'
  node.rel = 'noopener noreferrer'
  return node
}

function action(label: string, work: () => void, className = 'makers-button'): HTMLButtonElement {
  const button = text('button', label, className)
  button.type = 'button'
  button.addEventListener('click', work)
  return button
}

async function enterPanorama(id = 'the-toaster-innovation-hub'): Promise<void> {
  const handle = app?.scenes.handle()
  if (!handle) { state.hidden = false; state.textContent = 'The 360° is still loading. You can browse Spaces while it opens.'; return }
  selected = null
  state.hidden = false
  state.textContent = 'Opening the Toaster 360°…'
  try {
    const result = await handle.enter(id)
    state.hidden = result.ok
    if (!result.ok) state.textContent = 'The 360° could not open. Try again, or browse Spaces.'
    else currentSpace.textContent = 'The Toaster · 360°'
  } catch (error) {
    console.error('The panorama could not open.', error)
    state.textContent = 'The 360° could not open. Try again, or browse Spaces.'
  }
}

panoramaButton.addEventListener('click', () => { void enterPanorama() })

function imageOf(space: Space, large = false): HTMLElement | null {
  if (!space.image) return null
  const figure = document.createElement('figure')
  figure.className = large ? 'space-photo is-large' : 'space-photo'
  const img = document.createElement('img')
  img.src = new URL(space.image.url, new URL(import.meta.env.BASE_URL, location.href)).href
  img.alt = space.image.alt
  img.loading = 'lazy'
  img.decoding = 'async'
  img.addEventListener('error', () => { figure.replaceChildren(text('p', 'Photo unavailable', 'photo-unavailable')) }, { once: true })
  figure.append(img)
  figure.append(externalLink(space.image.credit, space.image.sourceUrl, 'photo-credit'))
  return figure
}

function renderDetail(space: Space): void {
  content.replaceChildren()
  content.append(action('← All spaces', () => { selected = null; renderDirectory() }, 'makers-button back-button'))
  const article = text('article', '', 'space-detail')
  article.append(text('p', `${space.campus} · ${space.room}`, 'space-location'), text('h2', space.title))
  const photo = imageOf(space, true)
  if (photo) article.append(photo)
  article.append(text('p', space.summary, 'space-summary'))
  const links = text('div', '', 'space-actions')
  if (space.panoramaId) links.append(action('Enter 360°', () => { void enterPanorama(space.panoramaId) }, 'makers-button is-primary'))
  links.append(externalLink('Official website ↗', space.url, 'makers-button'))
  article.append(links)
  if (!space.panoramaId) article.append(text('p', space.image
    ? 'Photo preview · a 360° visit to this space is still to come.'
    : 'Directory entry · 360° photography is still to come.', 'preview-note'))
  content.append(article)
}

function renderDirectory(): void {
  if (!directory) return
  if (selected) { renderDetail(selected); return }
  content.replaceChildren()
  const filters = text('div', '', 'campus-filters')
  filters.setAttribute('role', 'group')
  filters.setAttribute('aria-label', 'Filter spaces by campus')
  for (const name of ['All campuses', 'East Bank', 'West Bank', 'St. Paul']) {
    const button = action(name, () => { campus = name; renderDirectory() }, 'campus-button')
    button.setAttribute('aria-pressed', String(campus === name))
    filters.append(button)
  }
  content.append(filters)
  const spaces = directory.spaces.filter(space => campus === 'All campuses' || space.campus === campus)
  content.append(text('p', `${spaces.length} ${spaces.length === 1 ? 'space' : 'spaces'} · ${directory.spaces.filter(space => space.panoramaId).length} in 360°`, 'space-count'))
  const list = text('div', '', 'space-list')
  for (const space of spaces) {
    const card = text('article', '', 'space-card')
    const open = action('', () => {
      if (space.panoramaId) void enterPanorama(space.panoramaId)
      else {
        selected = space
        renderDirectory()
        content.querySelector<HTMLButtonElement>('.back-button')?.focus()
      }
    }, 'space-open')
    if (space.image) {
      const thumb = text('span', '', 'space-thumb')
      const img = document.createElement('img')
      img.src = new URL(space.image.url, new URL(import.meta.env.BASE_URL, location.href)).href
      img.alt = space.image.alt
      img.loading = 'lazy'
      img.decoding = 'async'
      thumb.append(img)
      open.append(thumb)
    }
    const body = text('span', '', 'space-card-body')
    body.append(text('span', `${space.campus} · ${space.room}`, 'space-location'), text('strong', space.title, 'space-title'), text('span', space.summary, 'space-summary'), text('span', space.panoramaId ? 'Enter 360° →' : 'View space →', 'space-action-label'))
    open.append(body)
    const links = text('div', '', 'space-card-links')
    if (space.image) links.append(externalLink(space.image.credit, space.image.sourceUrl, 'photo-credit'))
    links.append(externalLink('Website ↗', space.url, 'space-website'))
    card.append(open, links)
    list.append(card)
  }
  content.append(list)
}

async function loadDirectory(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}content/spaces.json`, { credentials: 'omit' })
    if (!response.ok) throw new Error(`Directory response ${response.status}`)
    directory = await response.json() as Directory
    renderDirectory()
  } catch (error) {
    console.error('The makerspace directory could not load.', error)
    content.replaceChildren(text('p', 'The space directory could not load. Please try reloading.', 'directory-message'))
  }
}

async function startTour(): Promise<void> {
  if (isBrowserRecoveryPage(document)) return
  try {
    const { mountGlobeApp } = await import('foss-earth')
    app = await mountGlobeApp(element('root'), {
      scenes: [{ id: 'umn-makerspaces', title: 'UMN makerspaces', description: 'A makerspaces prototype, beginning at the Toaster Innovation Hub.', url: 'scene.json' }],
      initialScene: 'umn-makerspaces',
      hostTabs: [{ id: 'host:makerspaces', label: 'Makerspaces', element: panel! }],
      preferGoogleTiles: false,
      poseExportPrefix: 'umn-makerspaces-poses',
      layerExportPrefix: 'umn-makerspaces-layers',
      linkExportPrefix: 'umn-makerspaces-links',
    })
    markBrowserAppReady(document)
    await app.scenes.whenSettled()
    panoramaButton.disabled = false
    await enterPanorama()
  } catch (error) {
    console.error('The makerspaces tour could not start.', error)
    state.hidden = false
    state.textContent = 'The 360° viewer could not start. Reload to try again.'
    reportBrowserAppFailure(document, `The makerspaces tour could not start. ${error instanceof Error ? error.message : String(error)}`)
  }
}

void loadDirectory()
void startTour()

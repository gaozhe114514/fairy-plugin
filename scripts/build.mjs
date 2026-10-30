// Builds client.js from src/client.tpl.js by inlining the splash artwork.
// Drop your own image at assets/orb.jpg; without one the splash simply uses the
// gradient backdrop and never ships third-party art.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const tplPath = join(root, 'src', 'client.tpl.js')
const outPath = join(root, 'client.js')
const orbPath = join(root, 'assets', 'orb.jpg')

// 1x1 transparent PNG, used when no artwork is present.
const BLANK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const tpl = readFileSync(tplPath, 'utf8')
const orb = existsSync(orbPath)
  ? 'data:image/jpeg;base64,' + readFileSync(orbPath).toString('base64')
  : BLANK

if (!tpl.includes('__ORB__')) {
  console.error('src/client.tpl.js is missing the __ORB__ placeholder')
  process.exit(1)
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, tpl.replaceAll('__ORB__', orb), 'utf8')
console.log('built client.js (' + (orb === BLANK ? 'no artwork' : 'artwork inlined') + ')')

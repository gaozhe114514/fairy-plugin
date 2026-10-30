// Fairy voice: keeps one GPT-SoVITS worker alive, speaks each finished turn,
// and serves the newest clip to the Web UI.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Runtime paths: environment first, then the conventional layout next to the
// plugin folder. Missing pieces simply disable the voice half of the UI.
const PKG_DIR = dirname(fileURLToPath(import.meta.url))
const PYTHON = process.env.FAIRY_PYTHON || 'python'
const SCRIPT = process.env.FAIRY_SCRIPT || join(PKG_DIR, '..', 'fairy-voice', 'fairy_tts.py')
const OUT_DIR = process.env.FAIRY_OUT || join(PKG_DIR, '..', 'fairy-voice', 'out')
const TEXT_PATH = join(OUT_DIR, 'last-text.txt')
const AVAILABLE = existsSync(SCRIPT) && (PYTHON === 'python' || existsSync(PYTHON))

export const name = 'fairy'
export const inject = ['webServer']

const MAX_TEXT = 600
let autoStream = false

export function apply(ctx) {
  if (!AVAILABLE) return
  mkdirSync(OUT_DIR, { recursive: true })

  const state = {
    seq: 0,
    text: '',
    dur: 0,
    speaking: false,
    ready: false,
    error: null,
    clip: null,
  }
  const buffers = new Map()
  const clips = new Map()
  let head = 0
  let worker = null
  let queue = Promise.resolve()
  let jobId = 0
  let lastText = ''
  const live = new Map()
  let lastAgentKey = ''
  try { lastText = readFileSync(TEXT_PATH, 'utf8').trim() } catch { lastText = '' }
  let idleTimer = null
  const waiters = new Map()
  // The engine is only kept in VRAM while it is being used; idle it away so gaming
  // gets its memory back.
  const IDLE_RELEASE_MS = 4 * 60 * 1000

  function scheduleIdleRelease() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (worker && !worker.killed) {
        worker.kill()
        worker = null
        state.ready = false
      }
    }, IDLE_RELEASE_MS)
  }

  function ensureWorker() {
    if (worker && !worker.killed) return worker
    const child = spawn(PYTHON, [SCRIPT, '--serve'], {
      cwd: 'E:\\HDD\\fairy-voice',
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        HF_ENDPOINT: 'https://hf-mirror.com',
        // RTX 3060: roughly 1.4x realtime per sentence instead of 0.5x on CPU.
        FAIRY_TTS_DEVICE: 'cuda',
        FAIRY_TTS_HALF: '1',
      },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    let buf = ''
    child.stdout.on('data', (chunk) => {
      buf += chunk
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line) continue
        let msg
        try { msg = JSON.parse(line) } catch { continue }
        if (msg.ready) { state.ready = true; continue }
        const id = msg.id
        const waiter = id != null ? waiters.get(id) : undefined
        if (waiter) { waiters.delete(id); waiter(msg) }
      }
    })
    child.stderr.on('data', (chunk) => {
      const text = String(chunk).trim()
      if (text && /error|Traceback/i.test(text)) state.error = text.slice(-400)
    })
    child.on('exit', () => { worker = null; state.ready = false })
    worker = child
    return child
  }

  function synthesize(text) {
    if (!text || !text.trim()) return Promise.resolve(null)
    const clipped = text.trim().slice(0, MAX_TEXT)
    const child = ensureWorker()
    const id = ++jobId
    const out = join(OUT_DIR, `clip-${id}.wav`)
    return new Promise((resolve) => {
      const timer = setTimeout(() => { waiters.delete(id); resolve(null) }, 180000)
      waiters.set(id, (msg) => {
        clearTimeout(timer)
        if (!msg.ok || !existsSync(out)) { state.error = msg.error || 'synth failed'; return resolve(null) }
        // Each finished chunk becomes its own playable clip so the client can start
        // speaking the first sentence while the rest are still being synthesized.
        head += 1
        clips.set(head, { file: out, dur: msg.dur || 0 })
        while (clips.size > 40) clips.delete(Math.min.apply(null, Array.from(clips.keys())))
        state.seq = head
        state.text = clipped
        state.dur = msg.dur || 0
        state.clip = out
        state.error = null
        scheduleIdleRelease()
        resolve(out)
      })
      try {
        child.stdin.write(JSON.stringify({ id, text: clipped, out }) + '\n')
      } catch {
        clearTimeout(timer)
        resolve(null)
      }
    })
  }

  function enqueue(text) {
    queue = queue.then(() => synthesize(text)).catch(() => null)
    return queue
  }

  // Split on sentence enders and speak each sentence as soon as it is ready, so the
  // first words come out in a second or two instead of after the whole reply.
  function splitForSpeech(text) {
    const parts = []
    const re = /[^。！？!?；;\n]+[。！？!?；;]?/g
    let m
    const rest = text.slice(0, 480)
    while ((m = re.exec(rest))) {
      const piece = m[0].trim()
      if (!piece) continue
      if (parts.length && parts[parts.length - 1].length < 4) parts[parts.length - 1] += piece
      else parts.push(piece)
    }
    return parts.slice(0, 10)
  }

  function speakChunks(text) {
    const parts = splitForSpeech(text)
    if (!parts.length) return queue
    queue = queue.then(async () => {
      for (let i = 0; i < parts.length; i += 1) await synthesize(parts[i])
    }).catch(() => null)
    return queue
  }

  function cleanForSpeech(raw) {
    return raw
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}[-*+]\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[>*_~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function say(text, all) {
    const body = all ? text : text.split(/(?<=[。！？!?；;])/).slice(0, 3).join('')
    return speakChunks(cleanForSpeech(body))
  }

  ctx.on('agent/assistant-stream', ({ agent, frame }) => {
    if (!agent) return
    const key = String(agent.id)
    if (frame && frame.type === 'start') { buffers.set(key, ''); live.set(key, ''); lastAgentKey = key; return }
    if (frame && frame.type === 'chunk' && frame.chunk && frame.chunk.type === 'text-delta') {
      // Keep the whole unfinished reply around: the speaker buttons read the newest
      // text, including a reply that is still being written.
      live.set(key, (live.get(key) || '') + frame.chunk.text)
      lastAgentKey = key
      const buf = (buffers.get(key) || '') + frame.chunk.text
      if (!autoStream) { buffers.set(key, buf); return }
      // Speak sentence by sentence while the model is still writing.
      const m = buf.match(/[\s\S]*[。！？!?；;]/)
      if (m && m[0].length >= 8) {
        buffers.set(key, buf.slice(m[0].length))
        const clean = cleanForSpeech(m[0])
        if (clean) speakChunks(clean)
      } else {
        buffers.set(key, buf)
      }
    }
  })

  ctx.on('agent/turn-stopping', ({ agent }) => {
    if (!agent) return
    const key = String(agent.id)
    const text = cleanForSpeech((buffers.get(key) || '').trim())
    buffers.set(key, '')
    live.delete(key)
    if (!text || text.length < 2) return
    // Remember the whole reply so the speaker buttons can re-read it on demand.
    lastText = text
    try { writeFileSync(TEXT_PATH, text, 'utf8') } catch { /* ignore */ }
    if (autoStream) speakChunks(text)
  })

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/fairy-voice/state',
    handler: (req, res) => {
      const body = JSON.stringify({
        seq: state.seq, text: state.text, dur: state.dur,
        ready: state.ready, error: state.error, report: state.report || null,
      })
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(body)
    },
  }))

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/fairy-voice/clip',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      const want = Number(url.searchParams.get('seq') || 0)
      const entry = want && clips.get(want) ? clips.get(want) : (state.clip ? { file: state.clip } : null)
      if (!entry || !existsSync(entry.file)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('no clip')
        return
      }
      const bytes = readFileSync(entry.file)
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': bytes.length,
        'Cache-Control': 'no-store',
      })
      res.end(bytes)
    },
  }))

  // The next unplayed clip after `after`: the client walks the queue one at a time.
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/next',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      const after = Number(url.searchParams.get('after') || 0)
      let next = null
      for (const [seq, info] of clips) {
        if (seq > after && (!next || seq < next.seq)) next = { seq, dur: info.dur }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ clip: next, head }))
    },
  }))

  // Client self-report, so the Host can answer "why is it silent".
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/report',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      const pick = (k) => url.searchParams.get(k) || ''
      state.report = {
        muted: pick('muted'), last: pick('last'), head: pick('head'),
        queue: pick('q'), err: pick('err'), at: Date.now(),
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end('{"ok":true}')
    },
  }))

  // Greeting belongs to the app launch, and this Host lives exactly as long as the
  // app: the first caller in this process gets spoken to, later page loads and
  // workspace switches are told to stay quiet.
  let greeted = false
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/greet',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      const text = url.searchParams.get('text') || ''
      if (greeted) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify({ ok: false, reason: 'already-greeted' }))
        return
      }
      greeted = true
      // The greeting is pre-rendered, so it starts the moment the splash asks for it
      // instead of waiting out a CPU synthesis pass.
      const PRE = 'E:\\HDD\\fairy-voice\\out\\greeting.wav'
      if (existsSync(PRE)) {
        head += 1
        clips.set(head, { file: PRE, dur: 6.5 })
        state.seq = head
        state.text = 'greeting'
        state.dur = 6.5
        state.clip = PRE
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify({ ok: true, instant: true, seq: state.seq }))
        return
      }
      enqueue(text).then((out) => {
        res.writeHead(out ? 200 : 500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: Boolean(out), seq: state.seq, dur: state.dur }))
      })
    },
  }))

  // Speaker button: read the last reply, no text argument needed.
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/say',
    handler: (req, res) => {
      if (!lastText) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, reason: 'no-text' }))
        return
      }
      const url = new URL(req.url || '/', 'http://localhost')
      const all = url.searchParams.get('all') !== '0'
      const newest = (live.get(lastAgentKey) || '').trim() || lastText
      say(newest, all)
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ ok: true, ready: state.ready, all, chars: ((live.get(lastAgentKey) || '').trim() || lastText).length }))
    },
  }))

  // Streaming auto-read switch, driven by the voice toggle in the UI.
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/auto',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      autoStream = url.searchParams.get('on') === '1'
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ ok: true, auto: autoStream }))
    },
  }))

  // Free the GPU on demand: kill the engine, keep everything else intact.
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/fairy-voice/release',
    handler: (req, res) => {
      if (worker && !worker.killed) worker.kill()
      worker = null
      state.ready = false
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end('{"ok":true}')
    },
  }))

  // Manual trigger, also the way to test the voice without an agent turn.
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/fairy-voice/speak',
    handler: (req, res) => {
      const url = new URL(req.url || '/', 'http://localhost')
      const text = url.searchParams.get('text') || ''
      speakChunks(text).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: true, seq: state.seq, head, dur: state.dur }))
      })
    },
  }))

  // No preload: the engine keeps its weights out of VRAM until something actually
  // needs to speak, so a gaming session is not buying 2.9 GB of idle model memory.

  ctx.effect(() => () => {
    if (worker && !worker.killed) worker.kill()
    worker = null
  })
}

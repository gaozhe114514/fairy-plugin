// Fairy: H.D.D. skin + boot splash + voice controls, one client module.
window.__ModuleLoader__.load({
  id: '@local/fairy',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /* ------------------------------------------------------------------ shared */

    const TOKENS = {
      '--dsw-alias-bg-base': { light: '#EEF3FB', dark: '#0a101c' },
      '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#0f1726' },
      '--dsw-alias-bg-layer-2': { light: '#E3EAF6', dark: '#141e31' },
      '--dsw-alias-bg-overlay': { light: '#FFFFFF', dark: '#111a2c' },
      '--dsw-alias-border-l1': { light: '#C9D6E9', dark: '#1e2b46' },
      '--dsw-alias-border-l2': { light: '#9DB1CE', dark: '#2d4266' },
      '--dsw-alias-brand-primary': { light: '#1B62D6', dark: '#4A9DFF' },
      '--dsw-alias-label-primary': { light: '#081226', dark: '#E8F2FF' },
      '--dsw-alias-label-secondary': { light: '#516381', dark: '#9AB2D6' },
      '--dsw-alias-state-error-primary': { light: '#D81746', dark: '#FF4D7D' },
      '--dsw-alias-state-success-primary': { light: '#0E8F5A', dark: '#3FE0A8' },
      '--dsw-alias-state-warn-primary': { light: '#A96500', dark: '#FFC24B' },
      '--dsw-alias-state-idle-primary': { light: '#8C9AB3', dark: '#5E6E92' },
      '--dsw-specific-sidebar-fill': { light: '#E8EFFA', dark: '#080e1a' },
    };

    // Fairy's sigil: blue disc, glowing rim, white band, blue ring, violet core, dot.
    function Emblem({ size, cls }) {
      return h('svg', { viewBox: '0 0 200 200', width: size, height: size, className: cls, 'aria-hidden': true },
        h('defs', null,
          h('radialGradient', { id: 'fairy-halo', cx: '50%', cy: '50%', r: '50%' },
            h('stop', { offset: '0%', stopColor: '#7fb4ff', stopOpacity: '0.55' }),
            h('stop', { offset: '55%', stopColor: '#3568e8', stopOpacity: '0.22' }),
            h('stop', { offset: '100%', stopColor: '#0a1c3a', stopOpacity: '0' }),
          ),
          h('radialGradient', { id: 'fairy-disc', cx: '46%', cy: '38%', r: '70%' },
            h('stop', { offset: '0%', stopColor: '#4a84f0' }),
            h('stop', { offset: '70%', stopColor: '#2b56c8' }),
            h('stop', { offset: '100%', stopColor: '#1c3a92' }),
          ),
          h('radialGradient', { id: 'fairy-core', cx: '50%', cy: '42%', r: '68%' },
            h('stop', { offset: '0%', stopColor: '#7d8cf2' }),
            h('stop', { offset: '60%', stopColor: '#4a55b8' }),
            h('stop', { offset: '100%', stopColor: '#333a8c' }),
          ),
          h('filter', { id: 'fairy-soft', x: '-40%', y: '-40%', width: '180%', height: '180%' },
            h('feGaussianBlur', { stdDeviation: '3.5' }),
          ),
        ),
        h('circle', { cx: 100, cy: 100, r: 99, fill: 'url(#fairy-halo)' }),
        h('circle', { cx: 100, cy: 100, r: 84, fill: 'url(#fairy-disc)' }),
        h('circle', { cx: 100, cy: 100, r: 81.5, fill: 'none', stroke: '#dcecff', strokeWidth: 3, opacity: 0.85, filter: 'url(#fairy-soft)' }),
        h('circle', { cx: 100, cy: 100, r: 62, fill: 'none', stroke: '#f7faff', strokeWidth: 26 }),
        h('circle', { cx: 100, cy: 100, r: 43, fill: 'none', stroke: '#4f8ce8', strokeWidth: 12 }),
        h('circle', { cx: 100, cy: 100, r: 30, fill: 'url(#fairy-core)' }),
        h('circle', { cx: 123, cy: 123, r: 14, fill: '#ffffff' }),
      );
    }

    /* -------------------------------------------------------------------- skin */

    const SKIN_CSS = `
.fairy-hud{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2147483000}
.fairy-hud__grid{position:absolute;inset:0;
 background-image:
  linear-gradient(rgba(130,170,240,.10) 1px,rgba(0,0,0,0) 1px),
  linear-gradient(90deg,rgba(130,170,240,.10) 1px,rgba(0,0,0,0) 1px);
 background-size:56px 56px;background-position:center}
.fairy-hud__glow{position:absolute;inset:0;background:
 radial-gradient(58% 38% at 50% 16%,rgba(58,116,214,.22),rgba(0,0,0,0) 72%),
 radial-gradient(70% 55% at 50% 108%,rgba(26,62,136,.22),rgba(0,0,0,0) 70%)}
.fairy-hud__vig{position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 38%,rgba(0,0,0,0) 48%,rgba(0,0,0,.24) 100%)}
.fairy-brand-mark{display:block;filter:drop-shadow(0 0 8px rgba(74,157,255,.55))}
.fairy-brand-block{display:flex;flex-direction:column;gap:1px;line-height:1.1}
.fairy-brand-name{font-size:15px;font-weight:700;letter-spacing:.02em;color:var(--dsw-alias-label-primary)}
.fairy-brand-sub{font-size:9px;letter-spacing:.02em;color:var(--dsw-alias-label-secondary);opacity:.85;white-space:nowrap}
.fairy-brand-patch{position:fixed;left:12px;top:36px;width:206px;height:48px;z-index:2147483200;
 display:flex;align-items:center;gap:9px;padding:0 9px;box-sizing:border-box;
 pointer-events:none;border-radius:11px;
 background:rgba(8,13,24,.62);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);
 box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.fairy-brand-patch__mark{flex:0 0 auto;filter:drop-shadow(0 0 9px rgba(74,157,255,.6))}
.fairy-brand-patch__name{font-size:14px;font-weight:700;line-height:1.1;color:var(--dsw-alias-label-primary)}
.fairy-brand-patch__sub{font-size:8px;line-height:1.15;letter-spacing:.01em;color:var(--dsw-alias-label-secondary);opacity:.9;white-space:nowrap}
`;

    function Hud() {
      return h('div', { className: 'fairy-hud', 'aria-hidden': true },
        h('div', { className: 'fairy-hud__glow' }),
        h('div', { className: 'fairy-hud__grid' }),
        h('div', { className: 'fairy-hud__vig' }),
      );
    }

    function BrandPatch() {
      return h('div', { className: 'fairy-brand-patch', 'aria-hidden': true },
        h(Emblem, { size: 26, cls: 'fairy-brand-patch__mark' }),
        h('div', null,
          h('div', { className: 'fairy-brand-patch__name' }, 'Fairy'),
          h('div', { className: 'fairy-brand-patch__sub' }, 'Ⅲ型总序式集成泛用人工智能'),
        ),
      );
    }

    function Mark() { return h(Emblem, { size: 24, cls: 'fairy-brand-mark' }); }
    function BrandName() {
      return h('div', { className: 'fairy-brand-block' },
        h('div', { className: 'fairy-brand-name' }, 'Fairy'),
        h('div', { className: 'fairy-brand-sub' }, 'Ⅲ型总序式集成泛用人工智能'),
      );
    }

    /* ------------------------------------------------------------------ splash */

    const LINES = ['主人，欢迎回来。', 'H.D.D. 已就绪，Fairy 在线。', '今天想先处理哪件事？'];
    const T = { flash: 5200, greet: 5600, fade: 8400, dock: 10600, done: 12200 };
    const boot = { start: 0, greeted: false };

    const SPLASH_CSS = `
.splash{--emblem:clamp(210px,28vw,340px);--half:calc(var(--emblem) / 2);
 position:fixed;inset:0;z-index:2147483500;overflow:hidden;cursor:pointer;
 font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#cfe6ff;
 background:#02040a;transition:background .9s ease;-webkit-font-smoothing:antialiased}
.splash--clear{background:rgba(2,4,10,0)}
.splash__grid{position:absolute;inset:0;transition:opacity .9s ease;
 background:
  radial-gradient(60% 45% at 50% 42%,rgba(56,120,220,.30),rgba(0,0,0,0) 70%),
  radial-gradient(90% 70% at 50% 110%,rgba(24,60,130,.35),rgba(0,0,0,0) 70%),
  linear-gradient(180deg,#050a14,#010205 70%)}
.splash__scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(160,210,255,.075) 0 1px,rgba(0,0,0,0) 1px 3px);pointer-events:none;transition:opacity .9s ease}
.splash__vig{position:absolute;inset:0;box-shadow:inset 0 0 220px 60px rgba(0,0,0,.85);transition:opacity .9s ease}
.splash--clear .splash__grid,.splash--clear .splash__scan{opacity:0}
.splash--clear .splash__vig{opacity:.35}
.boot{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);
 display:flex;flex-direction:column;align-items:center;gap:14px}
.boot__row{display:flex;gap:clamp(18px,4vw,54px);align-items:baseline}
.boot__digits{font-size:clamp(46px,11vw,140px);font-weight:700;letter-spacing:.04em;line-height:1;
 color:#dcecff;text-shadow:0 0 26px rgba(120,190,255,.65),0 0 70px rgba(60,130,255,.35)}
.boot__lab{font-size:clamp(8px,1.1vw,12px);letter-spacing:.42em;color:rgba(150,195,255,.6)}
.boot__title{font-size:clamp(22px,4.4vw,54px);font-weight:800;letter-spacing:.14em;
 color:transparent;-webkit-text-stroke:1.5px #bcdcff;filter:drop-shadow(0 0 18px rgba(110,180,255,.55))}
.boot__cap{font-size:clamp(7px,.95vw,11px);letter-spacing:.52em;color:rgba(150,195,255,.55)}
.boot__bar{width:min(62vw,780px);height:9px;border:1px solid rgba(150,200,255,.55);padding:2px}
.boot__fill{height:100%;width:0;background:linear-gradient(90deg,rgba(120,180,255,.15),#9ed2ff);
 box-shadow:0 0 14px rgba(120,190,255,.8);animation:splash-fill 4.5s cubic-bezier(.25,.6,.2,1) .15s forwards}
@keyframes splash-fill{0%{width:0}100%{width:100%}}
.flash{position:absolute;inset:0;background:#e6f3ff;opacity:0;animation:splash-flash .55s ease forwards;pointer-events:none}
@keyframes splash-flash{0%{opacity:0}18%{opacity:.92}100%{opacity:0}}
.stage{position:absolute;inset:0;pointer-events:none}
.stage__img{position:absolute;inset:-4%;background-image:url("__ORB__");background-size:cover;background-position:center;
 opacity:0;filter:blur(2px) saturate(1.05);animation:splash-img-in 1.2s ease forwards}
@keyframes splash-img-in{to{opacity:.42}}
.stage--fade .stage__img,.stage--dock .stage__img{animation:splash-img-out 2s ease forwards}
@keyframes splash-img-out{0%{opacity:.42}100%{opacity:0}}
.stage__dim{position:absolute;inset:0;
 background:radial-gradient(62% 56% at 50% 46%,rgba(2,6,14,.22),rgba(2,5,12,.66));
 transition:opacity 1.6s ease}
.stage--fade .stage__dim,.stage--dock .stage__dim{opacity:0}
.stage__core{position:absolute;left:50%;top:50%;width:var(--emblem);height:var(--emblem);
 transform:translate(-50%,-50%);transition:transform 1.5s cubic-bezier(.45,.02,.2,1);will-change:transform}
.stage--dock .stage__core{transform:translate(calc(-50% - 38.3vw),calc(-50% + 21.9vh)) scale(.4)}
.stage__emblem{width:100%;height:100%;
 filter:drop-shadow(0 0 60px rgba(64,130,255,.6));animation:splash-pulse 4.2s ease-in-out infinite}
@keyframes splash-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
.stage__text{position:absolute;left:50%;top:calc(50% + var(--half) + 20px);transform:translateX(-50%);
 display:flex;flex-direction:column;align-items:center;gap:9px;transition:opacity .7s ease}
.stage__name{font-size:clamp(15px,1.7vw,22px);letter-spacing:.46em;color:#dcebff;white-space:nowrap;
 text-shadow:0 0 20px rgba(110,180,255,.7);opacity:0;animation:splash-line .8s ease forwards}
.stage__greet{display:flex;flex-direction:column;gap:6px;align-items:center}
.stage__line{font-size:clamp(13px,1.4vw,17px);letter-spacing:.04em;color:#cfe2ff;opacity:0;white-space:nowrap;
 transform:translateY(6px);animation:splash-line .7s ease forwards;
 text-shadow:0 2px 16px rgba(0,8,20,.95)}
.stage__line:nth-child(2){animation-delay:.5s}
.stage__line:nth-child(3){animation-delay:1.1s}
@keyframes splash-line{to{opacity:1;transform:translateY(0)}}
.stage--fade .stage__text,.stage--dock .stage__text{opacity:0}
.badge{position:fixed;left:11.7vw;bottom:28.1vh;z-index:2147483400;
 width:clamp(84px,11.2vw,136px);height:clamp(84px,11.2vw,136px);
 transform:translate(-50%,50%);display:flex;align-items:center;justify-content:center;
 pointer-events:none;opacity:.95}
.badge::before{content:"";position:absolute;width:230%;height:230%;border-radius:50%;
 background:radial-gradient(circle,rgba(64,130,255,.32),rgba(64,130,255,.10) 45%,rgba(64,130,255,0) 70%);filter:blur(6px);
 animation:fairy-halo-pulse 5s ease-in-out infinite}
@keyframes fairy-halo-pulse{0%,100%{opacity:.55}50%{opacity:.95}}
@keyframes fairy-spin{to{transform:rotate(360deg)}}
.badge__emblem{position:relative;width:100%;height:100%;
 filter:drop-shadow(0 0 30px rgba(64,130,255,.55));animation:fairy-spin 26s linear infinite}
`;

    function phaseAt(now) {
      const t = now - boot.start;
      if (t < T.flash) return 'boot';
      if (t < T.greet) return 'flash';
      if (t < T.fade) return 'greet';
      if (t < T.dock) return 'fade';
      if (t < T.done) return 'dock';
      return 'done';
    }

    function greetOnce() {
      if (boot.greeted) return;
      boot.greeted = true;
      try {
        // No mute concept any more: clear the flag older builds wrote, or the very
        // first click on "VOICE OFF" would silence the greeting forever.
        window.localStorage.removeItem('fairy-voice-muted');
        fetch('/fairy-voice/greet?text=' + encodeURIComponent(LINES.join(''))).catch(() => {});
      } catch { /* ignore */ }
    }

    function Splash() {
      const [phase, setPhase] = React.useState(() => {
        if (!boot.start) boot.start = Date.now();
        return phaseAt(Date.now());
      });
      const [digits, setDigits] = React.useState('00');
      const [skipped, setSkipped] = React.useState(false);

      React.useEffect(() => {
        const tick = window.setInterval(() => setPhase(phaseAt(Date.now())), 100);
        const spin = window.setInterval(() => {
          setDigits(String(Math.floor(Math.random() * 99)).padStart(2, '0'));
        }, 110);
        return () => { window.clearInterval(tick); window.clearInterval(spin); };
      }, []);

      React.useEffect(() => {
        if (phase === 'greet') greetOnce();
      }, [phase]);

      const skip = () => {
        boot.start = Date.now() - T.done;
        boot.greeted = true;
        setSkipped(true);
        setPhase('done');
      };

      if (phase === 'done' || skipped) {
        return h('div', { className: 'badge', 'aria-hidden': true },
          h(Emblem, { size: '100%', cls: 'badge__emblem' }),
        );
      }

      const shown = phase === 'greet' || phase === 'fade' || phase === 'dock';
      const stageCls = 'stage' + (phase === 'fade' ? ' stage--fade' : '') + (phase === 'dock' ? ' stage--dock' : '');
      return h('div', { className: 'splash' + (shown ? ' splash--clear' : ''), role: 'presentation', onClick: skip, title: '点击跳过' },
        h('div', { className: 'splash__grid' }),
        phase === 'boot' && h('div', { className: 'boot' },
          h('div', { className: 'boot__row' },
            h('span', { className: 'boot__digits' }, digits),
            h('span', { className: 'boot__digits' }, '07'),
            h('span', { className: 'boot__digits' }, '27'),
          ),
          h('div', { className: 'boot__row' },
            h('span', { className: 'boot__lab' }, 'H.D.D.'),
            h('span', { className: 'boot__lab' }, 'DEEP DIVE'),
            h('span', { className: 'boot__lab' }, 'SIXTH ST'),
          ),
          h('div', { className: 'boot__title' }, 'H.D.D. SYSTEM'),
          h('div', { className: 'boot__cap' }, 'HOLLOW DEEP DIVE SYSTEM'),
          h('div', { className: 'boot__bar' }, h('div', { className: 'boot__fill' })),
        ),
        phase === 'flash' && h('div', { className: 'flash' }),
        shown && h('div', { className: stageCls },
          h('div', { className: 'stage__img' }),
          h('div', { className: 'stage__dim' }),
          h('div', { className: 'stage__core' },
            h(Emblem, { size: '100%', cls: 'stage__emblem' }),
          ),
          h('div', { className: 'stage__text' },
            h('div', { className: 'stage__name' }, 'FAIRY'),
            h('div', { className: 'stage__greet' },
              LINES.map((line, i) => h('div', { key: i, className: 'stage__line' }, line)),
            ),
          ),
        ),
        h('div', { className: 'splash__scan' }),
        h('div', { className: 'splash__vig' }),
      );
    }

    /* ------------------------------------------------------------------- voice */

    const VOICE_CSS = `
.fairy-voice-player{display:none}
.fairy-voice-bar{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;flex-wrap:wrap}
.fairy-voice-btn{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;
 border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;cursor:pointer;
 font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;
 color:var(--dsw-alias-label-secondary);transition:color .15s,border-color .15s}
.fairy-voice-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}
.fairy-voice-btn[data-on="1"]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.fairy-voice-btn[data-busy="1"]{opacity:.65;cursor:progress}
.fairy-voice-dot{width:6px;height:6px;border-radius:50%;background:#8a94a8}
.fairy-voice-dot[data-state="ready"]{background:#3FE0A8;box-shadow:0 0 6px #3FE0A8}
.fairy-voice-dot[data-state="load"]{background:#FFC24B;box-shadow:0 0 6px #FFC24B;animation:fv-blink 1s steps(2,end) infinite}
.fairy-voice-dot[data-state="err"]{background:#FF4D7D;box-shadow:0 0 6px #FF4D7D}
@keyframes fv-blink{0%,100%{opacity:1}50%{opacity:.35}}
`;

    function Voice() {
      const audioRef = React.useRef(null);
      const lastRef = React.useRef(0);
      const queueRef = React.useRef([]);
      const retryRef = React.useRef(false);
      const [busy, setBusy] = React.useState('');
      const [health, setHealth] = React.useState('idle');
      const [available, setAvailable] = React.useState(true);

      const playNext = React.useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (!a.paused && !a.ended) return;
        const seq = queueRef.current.shift();
        if (!seq) return;
        a.src = '/fairy-voice/clip?seq=' + seq;
        const p = a.play();
        if (p && p.catch) {
          p.catch(() => {
            queueRef.current.unshift(seq);
            if (retryRef.current) return;
            retryRef.current = true;
            const resume = () => {
              retryRef.current = false;
              window.removeEventListener('pointerdown', resume);
              playNext();
            };
            window.addEventListener('pointerdown', resume, { once: true });
          });
        }
      }, []);

      React.useEffect(() => {
        let alive = true;
        let primed = false;
        const tick = async () => {
          try {
            const r = await fetch('/fairy-voice/next?after=' + lastRef.current, { cache: 'no-store' });
            if (!r.ok) return;
            const s = await r.json();
            if (!alive || !s) return;
            if (typeof s.head === 'number' && s.head < lastRef.current) {
              lastRef.current = 0;
              queueRef.current = [];
            }
            if (!primed) { primed = true; lastRef.current = s.head || 0; return; }
            if (s.clip && s.clip.seq > lastRef.current) {
              lastRef.current = s.clip.seq;
              queueRef.current.push(s.clip.seq);
              playNext();
            }
          } catch { /* host not ready yet */ }
        };
        tick();
        const timer = window.setInterval(tick, 700);

        const probe = async () => {
          try {
            const r = await fetch('/fairy-voice/state', { cache: 'no-store' });
            if (!r.ok) { if (alive) setAvailable(false); return; }
            const s = await r.json();
            if (!alive) return;
            setAvailable(true);
            setHealth(s.error ? 'err' : (s.ready ? 'ready' : 'idle'));
          } catch { if (alive) setHealth('err'); }
        };
        probe();
        const ht = window.setInterval(probe, 2000);

        return () => { alive = false; window.clearInterval(timer); window.clearInterval(ht); };
      }, [playNext]);

      const onEnded = () => playNext();

      const stop = () => {
        const a = audioRef.current;
        if (a) { a.pause(); a.currentTime = 0; }
        queueRef.current = [];
      };

      const read = async () => {
        if (busy) return;
        const a = audioRef.current;
        if (a && !a.paused) { stop(); return; }
        setBusy('say');
        try { await fetch('/fairy-voice/say?all=1', { cache: 'no-store' }); } catch { /* ignore */ }
        for (let i = 0; i < 60; i += 1) {
          await new Promise((r) => window.setTimeout(r, 1000));
          try {
            const r = await fetch('/fairy-voice/state', { cache: 'no-store' });
            const s = await r.json();
            if (s && s.ready) break;
          } catch { /* ignore */ }
        }
        await new Promise((r) => window.setTimeout(r, 2500));
        setBusy('');
      };

      const release = async () => {
        stop();
        try { await fetch('/fairy-voice/release'); } catch { /* ignore */ }
        setHealth('idle');
      };

      if (!available) return null;

      return h('div', { className: 'fairy-voice-bar' },
        h('button', {
          type: 'button', className: 'fairy-voice-btn', onClick: read, disabled: !!busy,
          'data-busy': busy ? '1' : '0',
          title: '朗读最近一条回答；正在播放时点击停止',
        },
          h('span', { className: 'fairy-voice-dot', 'data-state': health }),
          h('span', null, busy ? '准备中…' : '朗读'),
        ),
        h('button', {
          type: 'button', className: 'fairy-voice-btn', onClick: release,
          title: '立即释放显存（停止语音引擎）',
        }, h('span', null, '释放')),
        h('audio', { ref: audioRef, className: 'fairy-voice-player', preload: 'none', onEnded }),
      );
    }

    /* ------------------------------------------------------------------- mount */

    return {
      inject: ['slots', 'theme'],
      apply(ctx) {
        ctx.effect(() => ctx.theme.overrideTokens('@local/fairy', TOKENS));

        ctx.effect(() => {
          const style = document.createElement('style');
          style.setAttribute('data-fairy', '');
          style.textContent = SKIN_CSS + SPLASH_CSS + VOICE_CSS;
          document.head.appendChild(style);
          return () => style.remove();
        });

        const reg = (slot, component, id) => {
          ctx.slots.inject(slot, () => {
            try {
              return ctx.slots.register({ name: slot, id }, component);
            } catch (err) {
              try {
                return ctx.slots.register({ name: slot }, component);
              } catch (err2) {
                // eslint-disable-next-line no-console
                console.warn('[fairy] cannot own ' + slot, err, err2);
                return () => {};
              }
            }
          });
        };

        reg('shell.overlay', Hud, 'fairy-hud');
        reg('shell.overlay', BrandPatch, 'fairy-brand-patch');
        reg('shell.overlay', Splash, 'fairy-splash');
        reg('sidebar.brand.mark', Mark, 'fairy-mark');
        reg('sidebar.brand.name', BrandName, 'fairy-name');
        reg('conversation.composer.dock', Voice, 'fairy-voice');
      },
    };
  },
});

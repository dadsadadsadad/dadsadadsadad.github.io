(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = matchMedia('(pointer: fine)').matches
  const rootStyle = getComputedStyle(document.documentElement)
  const PAPER = rootStyle.getPropertyValue('--paper').trim()
  const INK = rootStyle.getPropertyValue('--ink').trim()
  const SIGNAL = rootStyle.getPropertyValue('--signal').trim()

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const rand = (min, max) => min + Math.random() * (max - min)
  const easeOut = t => 1 - Math.pow(1 - t, 4)

  const clock = document.getElementById('clock')
  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
  })
  const updateClock = () => {
    clock.textContent = timeFormat.format(new Date())
  }
  updateClock()
  setInterval(updateClock, 15000)

  // Name letters swell (width + weight axes) around the cursor
  const letters = []
  document.querySelectorAll('[data-kinetic]').forEach(word => {
    const text = word.textContent
    word.textContent = ''
    ;[...text].forEach((char, i) => {
      const span = document.createElement('span')
      span.className = 'ch'
      span.textContent = char
      span.style.setProperty('--i', i)
      word.append(span)
      letters.push({ el: span, w: 62, g: 760 })
    })
  })

  const hero = document.querySelector('.hero')
  const pointer = { x: 0, y: 0, movedAt: -Infinity }
  addEventListener(
    'pointermove',
    e => {
      if (e.pointerType !== 'mouse') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.movedAt = performance.now()
    },
    { passive: true },
  )

  function updateLetters(now) {
    if (hero.getBoundingClientRect().bottom < 0) return
    const idle = now - pointer.movedAt > 2200
    const radius = Math.max(220, innerWidth * 0.2)
    const centers = letters.map(({ el }) => {
      const r = el.getBoundingClientRect()
      return [r.left + r.width / 2, r.top + r.height / 2]
    })

    letters.forEach((letter, i) => {
      let t
      if (idle) {
        t = ((Math.sin(now * 0.0015 - i * 0.6) + 1) / 2) * (innerWidth < 560 ? 0.3 : 0.5)
      } else {
        const dx = pointer.x - centers[i][0]
        const dy = (pointer.y - centers[i][1]) * 0.6
        t = clamp(1 - Math.hypot(dx, dy) / radius, 0, 1)
        t = t * t * (3 - 2 * t)
      }
      letter.w += (62 + t * 88 - letter.w) * 0.1
      letter.g += (760 + t * 140 - letter.g) * 0.1
      letter.el.style.setProperty('--w', letter.w.toFixed(1))
      letter.el.style.setProperty('--g', letter.g.toFixed(0))
    })
  }

  // Ticker drifts on its own and speeds up / leans with scroll velocity
  const track = document.querySelector('.ticker-track')
  const firstSet = track.querySelector('.ticker-set')
  for (let i = 0; i < 3; i++) {
    const copy = firstSet.cloneNode(true)
    copy.setAttribute('aria-hidden', 'true')
    track.append(copy)
  }
  let setWidth = firstSet.offsetWidth
  let tickerX = 0
  let tickerDir = 1

  function updateTicker(dt, velocity) {
    if (Math.abs(velocity) > 0.5) tickerDir = Math.sign(velocity)
    tickerX -= tickerDir * (0.05 + Math.abs(velocity) * 0.012) * dt
    if (tickerX <= -setWidth) tickerX += setWidth
    if (tickerX > 0) tickerX -= setWidth
    const skew = clamp(velocity * -0.12, -10, 10)
    track.style.transform = `translate3d(${tickerX}px, 0, 0) skewX(${skew}deg)`
  }

  // About paragraph lights up word by word as it scrolls through
  const aboutText = document.querySelector('[data-words]')
  const highlight = new Set(['disappears', 'unglamorous', 'TypeScript,'])
  const words = aboutText.textContent.trim().split(/\s+/)
  aboutText.textContent = ''
  const wordEls = words.map((word, i) => {
    const span = document.createElement('span')
    span.className = highlight.has(word) ? 'word hot' : 'word'
    span.textContent = word
    aboutText.append(span)
    if (i < words.length - 1) aboutText.append(' ')
    return span
  })
  let litCount = -1

  function updateWords() {
    const r = aboutText.getBoundingClientRect()
    const vh = innerHeight
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.45 + r.height), 0, 1)
    const count = Math.round(p * wordEls.length)
    if (count === litCount) return
    wordEls.forEach((el, i) => el.classList.toggle('lit', i < count))
    litCount = count
  }

  // "Let's talk" stretches open on the width axis while it scrolls in
  const stretch = document.querySelector('[data-stretch]')

  const STRETCH_END = 120

  // size the title so the fully stretched state fills the line exactly
  function fitStretch() {
    stretch.style.fontSize = ''
    const current = stretch.style.getPropertyValue('--w')
    stretch.style.setProperty('--w', STRETCH_END)
    const scale = stretch.clientWidth / stretch.scrollWidth
    stretch.style.fontSize = `${parseFloat(getComputedStyle(stretch).fontSize) * Math.min(1, scale)}px`
    stretch.style.setProperty('--w', current || 50)
  }

  function updateStretch() {
    const r = stretch.getBoundingClientRect()
    const vh = innerHeight
    const p = easeOut(clamp((vh - r.top) / (vh * 0.75), 0, 1))
    stretch.style.setProperty('--w', (50 + p * (STRETCH_END - 50)).toFixed(1))
  }

  const progressBar = document.querySelector('.progress')
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight
    progressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
  }

  // Project panels: wipe in once, tilt toward the cursor
  const projects = document.querySelectorAll('.project')
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('in')
        revealObserver.unobserve(entry.target)
      })
    },
    { threshold: 0.2 },
  )
  projects.forEach(p => revealObserver.observe(p))

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.project-visual').forEach(panel => {
      panel.addEventListener('pointermove', e => {
        const r = panel.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        panel.style.setProperty('--ry', `${x * 7}deg`)
        panel.style.setProperty('--rx', `${y * -7}deg`)
      })
      panel.addEventListener('pointerleave', () => {
        panel.style.setProperty('--ry', '0deg')
        panel.style.setProperty('--rx', '0deg')
      })
    })

    document.querySelectorAll('.magnetic').forEach(button => {
      const label = button.querySelector('span')
      button.addEventListener('pointermove', e => {
        const r = button.getBoundingClientRect()
        const x = e.clientX - r.left - r.width / 2
        const y = e.clientY - r.top - r.height / 2
        button.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`
        label.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`
      })
      button.addEventListener('pointerleave', () => {
        button.style.transform = ''
        label.style.transform = ''
      })
    })
    document.querySelectorAll('.magnetic').forEach(b => {
      b.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    })
  }

  const copyButton = document.querySelector('[data-copy]')
  copyButton.addEventListener('click', async () => {
    const label = copyButton.querySelector('span')
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy)
      label.textContent = 'Copied'
    } catch {
      label.textContent = copyButton.dataset.copy
    }
    clearTimeout(copyButton.resetTimer)
    copyButton.resetTimer = setTimeout(() => {
      label.textContent = 'Copy email'
    }, 1800)
  })

  // Canvas visuals, one per project

  function qrScanner() {
    const N = 25
    const level = new Float32Array(N * N)
    const target = new Uint8Array(N * N)
    const inFinderZone = (x, y) =>
      (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
    const finderCell = (x, y) => {
      const lx = x >= N - 8 ? x - (N - 7) : x
      const ly = y >= N - 8 ? y - (N - 7) : y
      if (lx < 0 || ly < 0 || lx > 6 || ly > 6) return 0
      const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6
      const eye = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
      return ring || eye ? 1 : 0
    }
    const seedRow = y => {
      for (let x = 0; x < N; x++) {
        const i = y * N + x
        target[i] = inFinderZone(x, y) ? finderCell(x, y) : Math.random() < 0.48 ? 1 : 0
      }
    }
    for (let y = 0; y < N; y++) seedRow(y)
    level.set(target)

    let scan = 0
    let dir = 1
    let lastRow = -1

    return {
      update(dt) {
        scan += dir * dt * 0.00032
        if (scan > 1) (scan = 1), (dir = -1)
        if (scan < 0) (scan = 0), (dir = 1)
        const row = Math.min(N - 1, Math.floor(scan * N))
        if (row !== lastRow) {
          seedRow(row)
          lastRow = row
        }
        const k = Math.min(1, dt * 0.01)
        for (let i = 0; i < level.length; i++) level[i] += (target[i] - level[i]) * k
      },
      draw(ctx, w, h) {
        ctx.fillStyle = INK
        ctx.fillRect(0, 0, w, h)
        const size = Math.min(w, h) * 0.6
        const cell = size / N
        const x0 = (w - size) / 2
        const y0 = (h - size) / 2
        const scanRow = scan * N

        for (let y = 0; y < N; y++) {
          const near = Math.abs(y + 0.5 - scanRow) < 1.2
          for (let x = 0; x < N; x++) {
            const v = level[y * N + x]
            if (v < 0.03) continue
            ctx.globalAlpha = v
            ctx.fillStyle = near ? SIGNAL : PAPER
            ctx.fillRect(x0 + x * cell + 0.6, y0 + y * cell + 0.6, cell - 1.2, cell - 1.2)
          }
        }
        ctx.globalAlpha = 1

        const lineY = y0 + scan * size
        const trail = ctx.createLinearGradient(0, lineY, 0, lineY - dir * cell * 5)
        trail.addColorStop(0, 'rgba(255, 74, 28, 0.35)')
        trail.addColorStop(1, 'rgba(255, 74, 28, 0)')
        ctx.fillStyle = trail
        const pad = cell * 2
        ctx.fillRect(x0 - pad, Math.min(lineY, lineY - dir * cell * 5), size + pad * 2, cell * 5)
        ctx.fillStyle = SIGNAL
        ctx.fillRect(x0 - pad, lineY - 1, size + pad * 2, 2)

        // viewfinder corners
        const m = cell * 3
        const len = size * 0.14
        ctx.strokeStyle = PAPER
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ;[
          [x0 - m, y0 - m, 1, 1],
          [x0 + size + m, y0 - m, -1, 1],
          [x0 - m, y0 + size + m, 1, -1],
          [x0 + size + m, y0 + size + m, -1, -1],
        ].forEach(([cx, cy, sx, sy]) => {
          ctx.beginPath()
          ctx.moveTo(cx, cy + sy * len)
          ctx.lineTo(cx, cy)
          ctx.lineTo(cx + sx * len, cy)
          ctx.stroke()
        })
      },
    }
  }

  function promptStream() {
    const lines = []
    let typing = 0
    let revealed = 0
    let pause = 0
    let scroll = 0

    const makeLine = kind => {
      const tokens = []
      const limit = rand(0.4, 0.95)
      let used = 0
      while (used < limit) {
        const t = rand(0.04, 0.16)
        if (used + t > limit && tokens.length) break
        tokens.push({ w: t, hot: kind === 'out' && Math.random() < 0.1 })
        used += t + 0.015
      }
      return { kind, tokens }
    }
    const nextKind = () => {
      const last = lines[lines.length - 1]
      if (!last) return 'in'
      const outsInRow = lines.slice(-4).filter(l => l.kind === 'out').length
      if (last.kind === 'in') return Math.random() < 0.4 ? 'in' : 'out'
      return outsInRow >= 3 || Math.random() < 0.2 ? 'gap' : 'out'
    }
    const pushLine = () => {
      const kind = nextKind()
      lines.push(kind === 'gap' ? { kind, tokens: [] } : makeLine(kind))
      if (lines.length > 40) {
        lines.shift()
        typing--
      }
    }
    for (let i = 0; i < 4; i++) pushLine()

    return {
      update(dt, now, h) {
        const lineH = h / 12
        const line = lines[typing]
        if (pause > 0) {
          pause -= dt
        } else if (revealed < line.tokens.length) {
          revealed += dt * (line.kind === 'in' ? 0.008 : 0.016)
        } else {
          typing++
          revealed = 0
          pause = line.kind === 'gap' ? 120 : rand(160, 520)
          if (typing >= lines.length) pushLine()
        }
        const targetScroll = Math.max(0, (typing - 8) * lineH)
        scroll += (targetScroll - scroll) * Math.min(1, dt * 0.006)
      },
      draw(ctx, w, h, now) {
        ctx.fillStyle = INK
        ctx.fillRect(0, 0, w, h)
        const lineH = h / 12
        const padX = w * 0.08
        const textX = padX + w * 0.1
        const usable = w - textX - padX
        const barH = Math.max(6, lineH * 0.34)

        ctx.save()
        ctx.beginPath()
        ctx.rect(0, lineH * 0.6, w, h - lineH * 1.2)
        ctx.clip()

        lines.forEach((line, li) => {
          if (li > typing) return
          const y = lineH * 1.2 + li * lineH - scroll
          if (y < -lineH || y > h + lineH) return
          if (line.kind === 'gap') return
          const shown = li < typing ? line.tokens.length : revealed

          ctx.globalAlpha = 0.35
          ctx.fillStyle = line.kind === 'in' ? SIGNAL : PAPER
          ctx.beginPath()
          ctx.arc(padX + barH / 2, y + barH / 2, barH / 2.6, 0, Math.PI * 2)
          ctx.fill()

          let x = textX + (line.kind === 'out' ? usable * 0.05 : 0)
          line.tokens.forEach((token, ti) => {
            const amount = clamp(shown - ti, 0, 1)
            if (amount <= 0) return
            const tw = token.w * usable * amount
            ctx.globalAlpha = (line.kind === 'in' ? 0.95 : 0.5) * (0.4 + amount * 0.6)
            ctx.fillStyle = token.hot ? SIGNAL : PAPER
            if (token.hot) ctx.globalAlpha = 1
            ctx.beginPath()
            ctx.roundRect(x, y, tw, barH, barH / 2)
            ctx.fill()
            x += token.w * usable + usable * 0.015
          })

          if (li === typing && Math.floor(now / 420) % 2 === 0) {
            const partial = line.tokens.slice(0, Math.floor(shown))
            let cx = textX + (line.kind === 'out' ? usable * 0.05 : 0)
            partial.forEach(t => (cx += t.w * usable + usable * 0.015))
            const frac = shown % 1
            if (line.tokens[Math.floor(shown)]) cx += line.tokens[Math.floor(shown)].w * usable * frac
            ctx.globalAlpha = 1
            ctx.fillStyle = SIGNAL
            ctx.fillRect(cx + 3, y - barH * 0.35, 3, barH * 1.7)
          }
        })
        ctx.restore()
        ctx.globalAlpha = 1

        const fade = ctx.createLinearGradient(0, 0, 0, lineH * 2.4)
        fade.addColorStop(0, INK)
        fade.addColorStop(1, 'rgba(20, 18, 16, 0)')
        ctx.fillStyle = fade
        ctx.fillRect(0, 0, w, lineH * 2.4)
      },
    }
  }

  function eventCalendar() {
    const COLS = 7
    const ROWS = 5
    const SLOTS = 3
    const taken = new Set()
    const events = []
    let spawnIn = 0
    let today = 9
    let todayIn = 2400

    const slotKey = (row, col, slot) => `${row}:${col}:${slot}`
    const spawn = now => {
      const row = Math.floor(Math.random() * ROWS)
      const col = Math.floor(Math.random() * COLS)
      const span = 1 + Math.floor(Math.random() * Math.min(4, COLS - col))
      for (let slot = 0; slot < SLOTS; slot++) {
        let free = true
        for (let c = col; c < col + span; c++) if (taken.has(slotKey(row, c, slot))) free = false
        if (!free) continue
        for (let c = col; c < col + span; c++) taken.add(slotKey(row, c, slot))
        events.push({ row, col, span, slot, born: now, life: rand(5000, 9000), hot: Math.random() < 0.25 })
        return
      }
    }

    return {
      update(dt, now) {
        spawnIn -= dt
        if (spawnIn <= 0) {
          spawn(now)
          spawnIn = rand(350, 900)
        }
        todayIn -= dt
        if (todayIn <= 0) {
          today = (today + 1) % (ROWS * COLS)
          todayIn = 2400
        }
        for (let i = events.length - 1; i >= 0; i--) {
          const e = events[i]
          if (now - e.born > e.life + 600) {
            for (let c = e.col; c < e.col + e.span; c++) taken.delete(slotKey(e.row, c, e.slot))
            events.splice(i, 1)
          }
        }
      },
      draw(ctx, w, h, now) {
        ctx.fillStyle = INK
        ctx.fillRect(0, 0, w, h)
        const pad = w * 0.07
        const headH = h * 0.08
        const cw = (w - pad * 2) / COLS
        const ch = (h - pad * 2 - headH) / ROWS
        const top = pad + headH

        ctx.fillStyle = PAPER
        ctx.globalAlpha = 0.35
        for (let c = 0; c < COLS; c++) {
          ctx.beginPath()
          ctx.roundRect(pad + c * cw + 6, pad + headH * 0.2, cw * 0.32, Math.max(4, headH * 0.22), 3)
          ctx.fill()
        }

        ctx.globalAlpha = 1
        ctx.strokeStyle = 'rgba(236, 231, 220, 0.12)'
        ctx.lineWidth = 1
        for (let r = 0; r <= ROWS; r++) {
          ctx.beginPath()
          ctx.moveTo(pad, top + r * ch + 0.5)
          ctx.lineTo(w - pad, top + r * ch + 0.5)
          ctx.stroke()
        }
        for (let c = 0; c <= COLS; c++) {
          ctx.beginPath()
          ctx.moveTo(pad + c * cw + 0.5, top)
          ctx.lineTo(pad + c * cw + 0.5, top + ROWS * ch)
          ctx.stroke()
        }

        const tr = Math.floor(today / COLS)
        const tc = today % COLS
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.004)
        ctx.fillStyle = SIGNAL
        ctx.globalAlpha = 0.12 + pulse * 0.1
        ctx.fillRect(pad + tc * cw + 1, top + tr * ch + 1, cw - 1, ch - 1)
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(pad + tc * cw + cw - 10, top + tr * ch + 10, 3.5, 0, Math.PI * 2)
        ctx.fill()

        const slotH = (ch - 24) / SLOTS
        const pillH = Math.max(5, slotH * 0.62)
        events.forEach(e => {
          const age = now - e.born
          const grow = easeOut(clamp(age / 700, 0, 1))
          const shrink = easeOut(clamp((age - e.life) / 600, 0, 1))
          const full = e.span * cw - 8
          const x = pad + e.col * cw + 4 + full * shrink
          const pw = full * grow * (1 - shrink)
          if (pw < 1) return
          const y = top + e.row * ch + 22 + e.slot * slotH
          ctx.fillStyle = e.hot ? SIGNAL : PAPER
          ctx.globalAlpha = e.hot ? 1 : 0.8
          ctx.beginPath()
          ctx.roundRect(x, y, pw, pillH, pillH / 2)
          ctx.fill()
        })
        ctx.globalAlpha = 1
      },
    }
  }

  const makers = { qr: qrScanner, stream: promptStream, calendar: eventCalendar }
  const visuals = [...document.querySelectorAll('[data-visual]')].map(canvas => {
    const scene = makers[canvas.dataset.visual]()
    const item = { canvas, ctx: canvas.getContext('2d'), scene, w: 0, h: 0, visible: false }
    // run the scene for a few seconds up front so it never opens on an empty panel
    for (let t = 16; t < 6000; t += 16) scene.update(16, t - 6000 + performance.now(), 400)
    new ResizeObserver(() => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      item.w = canvas.clientWidth
      item.h = canvas.clientHeight
      canvas.width = Math.round(item.w * dpr)
      canvas.height = Math.round(item.h * dpr)
      item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduceMotion) renderStill(item)
    }).observe(canvas)
    return item
  })

  function renderStill(item) {
    if (item.w) item.scene.draw(item.ctx, item.w, item.h, performance.now())
  }

  const visualObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = visuals.find(v => v.canvas === entry.target)
      item.visible = entry.isIntersecting
    })
  })
  visuals.forEach(v => visualObserver.observe(v.canvas))

  const remeasure = () => {
    setWidth = firstSet.offsetWidth
    fitStretch()
  }
  fitStretch()
  addEventListener('resize', remeasure)
  document.fonts?.ready.then(remeasure)

  if (reduceMotion) {
    wordEls.forEach(el => el.classList.add('lit'))
    stretch.style.setProperty('--w', STRETCH_END)
    addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return
  }

  let lastTime = performance.now()
  let lastScroll = scrollY
  let velocity = 0

  function frame(now) {
    const dt = Math.min(64, now - lastTime)
    lastTime = now
    const delta = scrollY - lastScroll
    lastScroll = scrollY
    velocity += ((delta / dt) * 16 - velocity) * 0.15

    updateLetters(now)
    updateTicker(dt, velocity)
    updateWords()
    updateStretch()
    updateProgress()

    visuals.forEach(item => {
      if (!item.visible || !item.w) return
      item.scene.update(dt, now, item.h)
      item.scene.draw(item.ctx, item.w, item.h, now)
    })

    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()

(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const smooth = t => t * t * (3 - 2 * t)

  const clock = document.getElementById('clock')
  const timeFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const updateClock = () => {
    clock.textContent = timeFormat.format(new Date())
  }
  updateClock()
  setInterval(updateClock, 15000)

  // Screenshots on the hero get tossed onto the page and can be dragged and thrown.
  const hero = document.querySelector('.hero')
  let topZ = 10

  const prints = [...document.querySelectorAll('.print')].map((el, i) => {
    el.draggable = false
    return {
      el,
      x: 0,
      y: 0,
      rot: 0,
      vx: 0,
      vy: 0,
      vr: 0,
      depth: [0.12, 0.3, 0.2, 0.08, 0.38][i % 5],
      mode: 'waiting',
      held: false,
      dragged: false,
    }
  })

  function toss(print) {
    const rect = print.el.getBoundingClientRect()
    print.y = -rect.bottom - 40
    print.x = (Math.random() - 0.5) * 160
    print.rot = (Math.random() - 0.5) * 50
    print.vy = 0
    print.mode = 'falling'
    print.el.classList.add('landed')
  }

  prints.forEach(print => {
    if (reduceMotion) {
      print.mode = 'free'
      print.el.classList.add('landed')
    } else {
      setTimeout(() => toss(print), 250 + Number(print.el.dataset.delay || 0))
    }

    let startX = 0
    let startY = 0
    let fromX = 0
    let fromY = 0
    let lastX = 0
    let lastY = 0
    let lastT = 0

    print.el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return
      print.held = true
      print.dragged = false
      print.mode = 'free'
      print.el.setPointerCapture(e.pointerId)
      print.el.classList.add('held')
      print.el.style.zIndex = ++topZ
      startX = lastX = e.clientX
      startY = lastY = e.clientY
      fromX = print.x
      fromY = print.y
      lastT = performance.now()
      print.vx = print.vy = 0
    })

    print.el.addEventListener('pointermove', e => {
      if (!print.held) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.hypot(dx, dy) > 6) print.dragged = true
      print.x = fromX + dx
      print.y = fromY + dy
      const now = performance.now()
      const dt = Math.max(1, now - lastT)
      print.vx = print.vx * 0.6 + ((e.clientX - lastX) / dt) * 16 * 0.4
      print.vy = print.vy * 0.6 + ((e.clientY - lastY) / dt) * 16 * 0.4
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
    })

    const release = () => {
      if (!print.held) return
      print.held = false
      print.el.classList.remove('held')
    }
    print.el.addEventListener('pointerup', release)
    print.el.addEventListener('pointercancel', release)

    // a drag shouldn't also follow the link
    print.el.addEventListener('click', e => {
      if (print.dragged) e.preventDefault()
    })
  })

  function updatePrints(step) {
    const heroRect = hero.getBoundingClientRect()
    if (heroRect.bottom < 0) return
    const scrolled = reduceMotion ? 0 : -heroRect.top

    prints.forEach(p => {
      if (p.mode === 'waiting') return

      if (p.mode === 'falling') {
        // underdamped spring back to its spot, so it lands with a small bounce
        p.vx += -p.x * 0.05 * step
        p.vy += -p.y * 0.05 * step
        p.vr += -p.rot * 0.05 * step
        const damp = Math.pow(0.78, step)
        p.vx *= damp
        p.vy *= damp
        p.vr *= damp
        p.x += p.vx * step
        p.y += p.vy * step
        p.rot += p.vr * step
        if (Math.abs(p.y) < 0.3 && Math.abs(p.vy) < 0.05 && Math.abs(p.rot) < 0.05) {
          p.x = p.y = p.rot = 0
          p.vx = p.vy = p.vr = 0
          p.mode = 'free'
        }
      } else if (p.held) {
        const lean = clamp(p.vx * 0.9, -16, 16)
        p.rot += (lean - p.rot) * 0.2 * step
      } else {
        p.x += p.vx * step
        p.y += p.vy * step
        const friction = Math.pow(0.9, step)
        p.vx *= friction
        p.vy *= friction
        p.rot += (clamp(p.vx * 0.9, -16, 16) - p.rot) * 0.1 * step

        // keep it on the page: bounce off the sides of the hero
        const r = p.el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        if (cx < 0 && p.vx < 0) p.vx *= -0.5
        if (cx > innerWidth && p.vx > 0) p.vx *= -0.5
        if (cy < heroRect.top + 40 && p.vy < 0) p.vy *= -0.5
        if (cy > heroRect.bottom && p.vy > 0) p.vy *= -0.5
        if (cx < -r.width / 2) p.x += 2 * step
        if (cx > innerWidth + r.width / 2) p.x -= 2 * step
      }

      const parallax = scrolled * p.depth
      p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - parallax).toFixed(1)}px) rotate(calc(var(--r) + ${p.rot.toFixed(2)}deg))`
    })
  }

  // CEIT: the dashboard rises in, the phone drifts, the label prints once
  const once = (selector, className, threshold) => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add(className)
          observer.unobserve(entry.target)
        })
      },
      { threshold },
    )
    document.querySelectorAll(selector).forEach(el => observer.observe(el))
  }
  once('[data-rise]', 'in', 0.15)
  once('.printer', 'printing', 0.8)

  const drifters = [...document.querySelectorAll('[data-drift]')]
  function updateDrift() {
    drifters.forEach(el => {
      const r = el.parentElement.getBoundingClientRect()
      const offset = r.top + r.height / 2 - innerHeight / 2
      el.style.transform = `translateY(${(offset * Number(el.dataset.drift)).toFixed(1)}px)`
    })
  }

  // PH Traffic Index: a day of hourly readings. It fills as you scroll, and on hover
  // the fill follows the mouse so you can slide through the day.
  const hours = document.querySelector('[data-hours]')
  const hourRow = hours.querySelector('.hours-row')
  const hourLabel = hours.querySelector('[data-hour-label]')
  const hourHint = hours.querySelector('.hours-hint')
  const hourCells = Array.from({ length: 24 }, () => hourRow.appendChild(document.createElement('span')))
  const defaultLabel = hourLabel.textContent
  let hoursFilled = -1
  let pointerHour = null

  const hourName = i => {
    const h = i % 12 === 0 ? 12 : i % 12
    return `${h}:07 ${i < 12 ? 'AM' : 'PM'}`
  }

  function setHours(filled) {
    if (filled === hoursFilled) return
    hoursFilled = filled
    hourCells.forEach((cell, i) => {
      cell.classList.toggle('read', i < filled)
      cell.classList.toggle('latest', i === filled - 1 && (pointerHour !== null || filled < 24))
    })
  }

  const hourFromPointer = e => {
    const r = hourRow.getBoundingClientRect()
    return clamp(Math.floor(((e.clientX - r.left) / r.width) * 24), 0, 23)
  }

  hours.addEventListener('pointermove', e => {
    pointerHour = hourFromPointer(e)
    hourLabel.textContent = `Reading ${pointerHour + 1} of 24, taken at ${hourName(pointerHour)}`
    hourHint.style.visibility = 'hidden'
  })
  hours.addEventListener('pointerleave', () => {
    pointerHour = null
    hoursFilled = -1
    hourLabel.textContent = defaultLabel
    hourHint.style.visibility = ''
  })

  if (!matchMedia('(hover: hover)').matches) hourHint.textContent = 'Drag across the hours'

  function updateHours() {
    if (pointerHour !== null) {
      setHours(pointerHour + 1)
      return
    }
    const r = hours.getBoundingClientRect()
    const p = reduceMotion ? 1 : clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.6), 0, 1)
    setHours(Math.round(p * 24))
  }

  // Trackage: type the install command, then scroll the site inside the frame
  const typed = document.querySelector('[data-type]')
  const command = typed.dataset.type
  if (reduceMotion) {
    typed.textContent = command
  } else {
    const typeObserver = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return
        typeObserver.disconnect()
        let i = 0
        const next = () => {
          typed.textContent = command.slice(0, ++i)
          if (i < command.length) {
            const pause = command[i - 1] === ' ' ? 260 : 55 + Math.random() * 110
            setTimeout(next, pause)
          }
        }
        setTimeout(next, 500)
      },
      { threshold: 1 },
    )
    typeObserver.observe(typed.parentElement)
  }

  const pan = document.querySelector('[data-pan]')
  const panView = pan.querySelector('.browser-view')
  const panImg = pan.querySelector('img')
  function updatePan() {
    const r = pan.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) return
    const p = clamp((innerHeight * 0.8 - r.top) / (innerHeight * 0.8 + r.height), 0, 1)
    const travel = panImg.offsetHeight - panView.offsetHeight
    panImg.style.transform = `translateY(${(-travel * smooth(p)).toFixed(1)}px)`
  }

  const copyButton = document.querySelector('[data-copy]')
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy)
      copyButton.textContent = 'Copied'
    } catch {
      copyButton.textContent = 'Copy failed, select it above'
    }
    clearTimeout(copyButton.resetTimer)
    copyButton.resetTimer = setTimeout(() => {
      copyButton.textContent = 'Copy email'
    }, 1800)
  })

  let last = performance.now()
  function frame(now) {
    const step = Math.min(4, (now - last) / 16.67)
    last = now
    updatePrints(step)
    updateHours()
    if (!reduceMotion) {
      updateDrift()
      updatePan()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()

/* 하랑솔루션 영상 공통 엔진: 배경·파티클·카메라 흔들림·글자 분해·선 그리기·CTA·미리보기.
   각 페이지는 COPY, build(), timeline() 을 정의하고 마지막에 Engine.boot(build, timeline) 을 부른다. */
(function () {
  const C = window.CUES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(20261112);
  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  function splitChars(el) {
    const out = [];
    (function walk(node) {
      for (const ch of Array.from(node.childNodes)) {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const s of Array.from(ch.textContent)) { const sp = document.createElement("span"); sp.className = "c"; sp.textContent = s; frag.appendChild(sp); out.push(sp); }
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && ch.tagName !== "BR") {
          if (ch.classList.contains("goldtext")) {
            ch.classList.remove("goldtext"); const before = out.length; walk(ch);
            for (let i = before; i < out.length; i++) out[i].classList.add("goldtext");
          } else walk(ch);
        }
      }
    })(el);
    return out;
  }

  function logoHTML(size, company) {
    const s = size;
    return `<svg width="${s}" height="${s}" viewBox="0 0 120 120">
      <defs><linearGradient id="lg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1D4E89"/><stop offset="1" stop-color="#10243E"/></linearGradient></defs>
      <rect x="2" y="2" width="116" height="116" rx="32" fill="url(#lg${s})" stroke="rgba(235,199,94,.55)" stroke-width="3"/>
      <path d="M22 86 C 44 86, 50 58, 66 52 S 88 42, 96 30" fill="none" stroke="#EBC75E" stroke-width="10" stroke-linecap="round"/>
      <circle cx="96" cy="30" r="9" fill="#FFF1B8"/>
    </svg><span class="wm" style="font-size:${Math.round(s * 0.62)}px">${company}</span>`;
  }

  const tl = gsap.timeline({ paused: true });
  const SHAKES = [];
  const PART = { a: 0.35 };
  const frameHooks = [];
  const asyncHooks = [];   // 프레임마다 기다려야 하는 일(예: 실사 장면 그림 불러오기)
  function shake(at, amp, dur = 0.35, freq = 26) { SHAKES.push({ at, amp, dur, freq }); }

  function showScene(id, at, until) {
    const el = document.getElementById(id);
    if (at <= 0) { gsap.set(el, { visibility: "visible", opacity: 1 }); tl.set(el, { visibility: "hidden", opacity: 0 }, until); return; }
    tl.set(el, { visibility: "visible" }, at);
    tl.to(el, { opacity: 1, duration: 0.001, ease: "none" }, at);
    tl.set(el, { visibility: "hidden", opacity: 0 }, until);
  }
  function popChars(chars, at, o = {}) {
    tl.fromTo(chars, { opacity: 0, y: o.y ?? 60, scale: o.scale ?? 1, filter: `blur(${o.blur ?? 10}px)` },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: o.dur ?? 0.5, ease: o.ease ?? "expo.out", stagger: o.stagger ?? 0.025 }, at);
  }
  function initPath(p) { if (!p.dataset.len) { const l = p.getTotalLength(); p.dataset.len = l; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; } return +p.dataset.len; }
  function draw(id, at, dur, opts = {}) {
    const p = typeof id === "string" ? document.getElementById(id) : id; const L = initPath(p);
    const head = opts.head ? document.getElementById(opts.head) : null;
    const o = { v: 0 };
    tl.to(o, { v: 1, duration: dur, ease: opts.ease || "power2.inOut", onUpdate() {
      p.style.strokeDashoffset = L * (1 - o.v);
      if (head) { const pt = p.getPointAtLength(L * o.v); head.setAttribute("transform", `translate(${pt.x} ${pt.y})`); }
    } }, at);
    if (head) { tl.to(head, { opacity: 1, duration: 0.12 }, at); if (opts.hideHead !== false) tl.to(head, { opacity: 0, duration: 0.2 }, at + dur - 0.05); }
  }
  function comet(svg, id, r = 60) {
    const g = svgEl("g", { id, opacity: 0 }, svg);
    svgEl("circle", { r, fill: "url(#cometGrad)" }, g); svgEl("circle", { r: r * 0.22, fill: "#FFFDF2" }, g);
    return g;
  }

  /* 신청 화면: 버튼·손가락·고리 맥박을 한 번에 */
  function ctaHand(svg) {
    svgEl("circle", { class: "tapRing", cx: 46, cy: 40, r: 26, fill: "none", stroke: "#fff", "stroke-width": 5, opacity: 0 }, svg);
    svgEl("path", { d: "M46 40 L46 98 M46 98 C 46 98, 30 92, 26 104 C 24 112, 44 132, 60 140 L 104 140 C 112 122, 118 104, 112 84 L 112 76 C 112 66, 98 64, 96 72 C 96 62, 82 60, 80 70 C 80 60, 66 58, 64 68 L 64 40 C 64 28, 46 28, 46 40 Z",
      fill: "#fff", stroke: "#10243E", "stroke-width": 5, "stroke-linejoin": "round" }, svg);
  }
  function ctaAnim(root, at, o) {
    const q = s => root.querySelector(s);
    tl.fromTo(q(".ctaLogo"), { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)", immediateRender: false }, o.logo);
    tl.fromTo(q(".ctaBtn"), { opacity: 0, scale: 0.6, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2.2)", immediateRender: false }, o.button);
    tl.fromTo(q(".ctaWays"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, o.button + 0.3);
    if (q(".ctaFoot")) tl.fromTo(q(".ctaFoot"), { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, o.button + 0.5);
    const hand = q(".hand"), btn = q(".ctaBtn");
    tl.fromTo(hand, { opacity: 0, x: 140, y: 160, rotation: 10 }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, o.tap - 0.55);
    tl.to(hand, { scale: 0.88, duration: 0.08, transformOrigin: "30% 20%" }, o.tap);
    tl.to(btn, { scale: 0.95, duration: 0.08 }, o.tap);
    tl.to(hand, { scale: 1, duration: 0.2 }, o.tap + 0.1);
    tl.to(btn, { scale: 1, duration: 0.3, ease: "back.out(3)" }, o.tap + 0.1);
    tl.fromTo(q(".tapRing"), { opacity: 0.9, attr: { r: 10 } }, { opacity: 0, attr: { r: 70 }, duration: 0.5, ease: "power2.out", immediateRender: false }, o.tap);
    tl.to(hand, { opacity: 0, x: 80, y: 120, duration: 0.4, ease: "power2.in" }, o.tap + 0.9);
    for (let t = o.tap + 0.2; t < o.end - 0.3; t += 1.0)
      tl.fromTo(q(".ctaRing"), { opacity: 0.8, scale: 1 }, { opacity: 0, scale: 1.14, duration: 0.8, ease: "power2.out", immediateRender: false }, t);
  }

  function buildParticles() {
    const pw = $("#particles");
    for (let i = 0; i < 34; i++) {
      const p = document.createElement("div"); p.className = "p";
      const s = 6 + rnd() * 26; p.style.width = p.style.height = s + "px";
      p.dataset.x = rnd() * 1080; p.dataset.y = rnd() * 2100; p.dataset.v = 20 + rnd() * 60; p.dataset.a = 0.25 + rnd() * 0.75; p.dataset.ph = rnd() * 6.28;
      pw.appendChild(p);
    }
  }
  function onFrame(t) {
    let sx = 0, sy = 0;
    for (const s of SHAKES) {
      const dt = t - s.at; if (dt < 0 || dt > s.dur) continue;
      const k = Math.pow(1 - dt / s.dur, 2);
      sx += Math.sin(dt * s.freq * 6.283) * s.amp * k; sy += Math.cos(dt * s.freq * 5.1) * s.amp * 0.7 * k;
    }
    const cam = $("#cam"); const base = gsap.getProperty(cam, "scale");
    cam.style.transform = `translate(${sx}px, ${sy}px) scale(${base})`;
    for (const p of $$("#particles .p")) {
      const y = ((+p.dataset.y - t * +p.dataset.v) % 2100 + 2100) % 2100 - 90;
      const x = +p.dataset.x + Math.sin(t * 0.8 + +p.dataset.ph) * 30;
      p.style.transform = `translate(${x}px, ${y}px)`;
      p.style.opacity = PART.a * +p.dataset.a * (0.6 + 0.4 * Math.sin(t * 2 + +p.dataset.ph));
    }
    const f = Math.floor(t * 30);
    $("#grain").style.backgroundPosition = `${(f * 73) % 256}px ${(f * 151) % 256}px`;
    for (const h of frameHooks) h(t);
  }
  function seek(t) { tl.time(Math.min(t, tl.duration()), false); onFrame(t); }
  async function seekAsync(t) { seek(t); if (asyncHooks.length) await Promise.all(asyncHooks.map(h => h(t))); }

  async function boot(build, timeline, audioPath) {
    await document.fonts.load('900 100px "Pretendard Variable"');
    await document.fonts.ready;
    buildParticles();
    build();
    timeline();
    tl.set("#cam", { scale: 1 }, 0);
    tl.to({}, { duration: 0.001 }, C.duration);
    window.__seek = seekAsync; window.__duration = C.duration;
    const params = new URLSearchParams(location.search);
    if (params.has("render")) { await seekAsync(0); return true; }
    const st = $("#stage");
    const fit = () => { const s = Math.min(innerWidth / 1080, (innerHeight - 50) / 1920); st.style.transform = `scale(${s})`; st.style.left = ((innerWidth - 1080 * s) / 2) + "px"; };
    fit(); addEventListener("resize", fit);
    const ui = $("#ui"); ui.style.display = "flex";
    const audio = new Audio(audioPath);
    const scrub = $("#scrub"), tc = $("#tc"); scrub.max = C.duration;
    let playing = false, t0 = 0, startAt = 0;
    const tick = () => {
      if (!playing) return;
      let t = audio.readyState >= 2 && !audio.paused ? audio.currentTime : (performance.now() - startAt) / 1000 + t0;
      if (t >= C.duration) { playing = false; t = C.duration; }
      seekAsync(t); scrub.value = t; tc.textContent = t.toFixed(2); requestAnimationFrame(tick);
    };
    $("#play").onclick = () => {
      playing = !playing;
      if (playing) { t0 = +scrub.value >= C.duration ? 0 : +scrub.value; startAt = performance.now(); audio.currentTime = t0; audio.play().catch(() => {}); tick(); }
      else audio.pause();
    };
    scrub.oninput = () => { playing = false; audio.pause(); seekAsync(+scrub.value); tc.textContent = (+scrub.value).toFixed(2); };
    await seekAsync(+(params.get("t") || 0));
    return true;
  }

  window.Engine = { C, $, $$, rnd, svgEl, splitChars, logoHTML, tl, shake, PART, frameHooks, asyncHooks, showScene, popChars, initPath, draw, comet, ctaHand, ctaAnim, boot };
})();

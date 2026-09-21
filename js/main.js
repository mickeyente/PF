document.getElementById('year').textContent = new Date().getFullYear();
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- mobile nav ---- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ---- product accordion ---- */
document.querySelectorAll('.product').forEach(p => {
  p.addEventListener('click', () => {
    const wasOpen = p.classList.contains('open');
    document.querySelectorAll('.product.open').forEach(o => o.classList.remove('open'));
    if (!wasOpen) p.classList.add('open');
  });
});

/* ---- scroll progress bar ---- */
const progressFill = document.getElementById('progressFill');
function updateProgress(){
  const h = document.documentElement;
  const scrolled = h.scrollTop || document.body.scrollTop;
  const height = h.scrollHeight - h.clientHeight;
  progressFill.style.width = height > 0 ? Math.min(100, (scrolled / height) * 100) + '%' : '0%';
}
document.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

/* ---- reveal-on-scroll ---- */
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window && !prefersReducedMotion){
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}

/* ---- scroll-spy nav ---- */
const navSections = ['products','approach','clients','location'].map(id => document.getElementById(id)).filter(Boolean);
const navLinkEls = document.querySelectorAll('[data-nav-link]');
if('IntersectionObserver' in window && navSections.length){
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        navLinkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  navSections.forEach(s => spyObserver.observe(s));
}

/* ---- hero cursor glow (desktop / fine pointer only) ---- */
const heroSection = document.querySelector('.hero');
const heroGlow = document.getElementById('heroGlow');
if(heroSection && heroGlow && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion){
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroGlow.style.setProperty('--mx', x + '%');
    heroGlow.style.setProperty('--my', y + '%');
  });
}

/* ---- rotating brand mark tied to scroll (a quiet nod to the logo's own motion) ---- */
const heroMark = document.getElementById('heroMark');
if(heroMark && !prefersReducedMotion){
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(!ticking){
      requestAnimationFrame(() => {
        heroMark.style.transform = 'rotate(' + (window.scrollY * 0.06) + 'deg)';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

      // subtle parallax for the hero mark image
      const markImg = document.querySelector('.mark-frame img');
      if(markImg && !prefersReducedMotion){
        let parallaxTick = false;
        window.addEventListener('scroll', () => {
          if(!parallaxTick){
            requestAnimationFrame(() => {
              const rect = markImg.getBoundingClientRect();
              const pct = (rect.top + rect.height/2 - window.innerHeight/2) / (window.innerHeight/2);
              const y = Math.max(-12, Math.min(12, pct * 12));
              markImg.style.transform = `translateY(${y}px)`;
              parallaxTick = false;
            });
            parallaxTick = true;
          }
        }, { passive: true });
      }

/* ---- ticker + live market mood ---- */
const instruments = [
  { key: 'ngxasi', name: 'NGX ASI', base: 101245, dp: 0, suffix: '' },
  { key: 'usdngn', name: 'USD/NGN', base: 1548.20, dp: 2, suffix: '' },
  { key: 'tbill', name: '91-Day T-Bill', base: 18.35, dp: 2, suffix: '%' },
  { key: 'mmkt', name: 'Money Mkt Avg. Yield', base: 19.10, dp: 2, suffix: '%' },
  { key: 'fgnbond', name: 'FGN Bond 10Y', base: 17.60, dp: 2, suffix: '%' },
  { key: 'ngxbnk', name: 'NGX Banking Idx', base: 892.4, dp: 1, suffix: '' }
];
let state = {};
instruments.forEach(i => state[i.key] = { val: i.base, chg: 0 });

function fmt(n, dp){
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function renderGroup(){
  return instruments.map(i => {
    const s = state[i.key];
    const dir = s.chg >= 0 ? 'up' : 'down';
    const arrow = s.chg >= 0 ? '▲' : '▼';
    // include raw numeric value in a data attribute so we can animate it
    return `<span class="tick" data-key="${i.key}">
      <span class="name">${i.name}</span>
      <span class="val" data-num="${s.val}">${fmt(s.val, i.dp)}${i.suffix}</span>
      <span class="chg ${dir}">${arrow} ${fmt(Math.abs(s.chg), 2)}%</span>
    </span>`;
  }).join('');
}

// animate a numeric value in place from `from` -> `to`
function animateValue(el, from, to, dp, suffix, duration = 700){
  from = Number(from) || 0;
  to = Number(to) || 0;
  const start = performance.now();
  const fmtLocal = (n) => n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  function step(now){
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out
    const cur = from + (to - from) * eased;
    el.textContent = fmtLocal(cur) + (suffix || '');
    if(t < 1) requestAnimationFrame(step);
    else el.dataset.num = String(to);
  }
  requestAnimationFrame(step);
}
const track = document.getElementById('tickerTrack');
function buildTicker(){
  const note = '<span class="ticker-note">Illustrative snapshot · updates periodically</span>';
  track.innerHTML = `<div class="ticker-group">${renderGroup()}${note}</div><div class="ticker-group">${renderGroup()}${note}</div>`;
}
const moodChip = document.getElementById('moodChip');
function updateMoodChip(){
  if(!moodChip) return;
  const avg = instruments.reduce((sum, i) => sum + state[i.key].chg, 0) / instruments.length;
  let label, cls;
  if(avg > 0.12){ label = "Market pulse: broadly firmer today"; cls = ''; }
  else if(avg < -0.12){ label = "Market pulse: broadly softer today"; cls = 'down'; }
  else { label = "Market pulse: fairly flat today"; cls = ''; }
  moodChip.className = 'mood-chip' + (cls ? ' ' + cls : '');
  moodChip.innerHTML = '<span class="dot"></span> ' + label;
}
function updateTicker(){
  // update state with small simulated moves, recording previous values
  instruments.forEach(i => {
    const s = state[i.key];
    const pctMove = (Math.random() - 0.5) * (i.dp === 0 ? 0.4 : 0.6);
    const prev = s.val;
    const next = Math.max(0, s.val * (1 + pctMove / 100));
    s.val = next;
    s.chg = pctMove;
    s._prev = prev;
  });

  // animate DOM updates
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    const i = instruments.find(x => x.key === key);
    const s = state[key];
    const dir = s.chg >= 0 ? 'up' : 'down';
    const arrow = s.chg >= 0 ? '▲' : '▼';
    const valEl = el.querySelector('.val');
    // animate numeric transition
    const from = Number(valEl.dataset.num || s._prev || 0);
    animateValue(valEl, from, s.val, i.dp, i.suffix, 700);
    const chgEl = el.querySelector('.chg');
    chgEl.className = 'chg ' + dir;
    chgEl.textContent = arrow + ' ' + fmt(Math.abs(s.chg), 2) + '%';
  });
  updateMoodChip();
}
buildTicker();
updateTicker();
setInterval(updateTicker, 3200);

/* ---- live Lagos clock + open/closed status ---- */
function getLagosParts(){
  const fmtr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, weekday: 'short'
  });
  const parts = fmtr.formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t)?.value;
  return {
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
    hour: parseInt(get('hour'), 10),
    weekday: get('weekday')
  };
}
function updateLagosClock(){
  const { time, hour, weekday } = getLagosParts();
  const isWeekday = !['Sat','Sun'].includes(weekday);
  const isOpen = isWeekday && hour >= 8 && hour < 17;
  [
    { clock: 'lagosClock', chip: 'statusChip' },
    { clock: 'lagosClock2', chip: 'statusChip2' }
  ].forEach(({ clock, chip }) => {
    const clockEl = document.getElementById(clock);
    const chipEl = document.getElementById(chip);
    if(clockEl) clockEl.textContent = time + ' WAT';
    if(chipEl){
      chipEl.className = 'status-chip ' + (isOpen ? 'open' : 'closed');
      chipEl.innerHTML = '<span class="dot"></span>' + (isOpen ? 'Open now' : 'Closed now');
    }
  });
}
updateLagosClock();
setInterval(updateLagosClock, 1000);

/* ---- testimonial carousel ---- */
const carouselTrack = document.getElementById('carouselTrack');
const carouselDotsWrap = document.getElementById('carouselDots');
if(carouselTrack && carouselDotsWrap){
  const slides = carouselTrack.querySelectorAll('.quote');
  let current = 0;
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    carouselDotsWrap.appendChild(dot);
  });
  const dots = carouselDotsWrap.querySelectorAll('button');
  function goToSlide(i){
    current = i;
    carouselTrack.style.transform = 'translateX(-' + (i * 100) + '%)';
    dots.forEach((d, di) => d.classList.toggle('active', di === i));
  }
  let autoplay;
  function startAutoplay(){
    if(prefersReducedMotion) return;
    autoplay = setInterval(() => goToSlide((current + 1) % slides.length), 6000);
  }
  function stopAutoplay(){ clearInterval(autoplay); }
  startAutoplay();
  const carouselWrap = document.getElementById('testimonialCarousel');
  carouselWrap.addEventListener('mouseenter', stopAutoplay);
  carouselWrap.addEventListener('mouseleave', startAutoplay);
  carouselWrap.addEventListener('focusin', stopAutoplay);
  carouselWrap.addEventListener('focusout', startAutoplay);
}

/* ---- chat: uses the sample capability when this page is opened as a Claude
   artifact, and falls back to a small local concierge when it's opened as a
   plain file (e.g. in VS Code / any regular browser) so it always works ---- */
const chatLauncher = document.getElementById('chatLauncher');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

let sampleFn = null;
const SYSTEM_PROMPT = `You are the website concierge for Possibility Fund Limited, a fund, portfolio and wealth management company. They offer: (1) Portfolio Management — discretionary, bespoke portfolios across equities, fixed income and money market instruments for individuals and institutions; (2) Mutual Funds — a pooled, professionally managed fund with daily-priced units, a low entry point; (3) a Money Market Fund that is launching soon (not yet open). Answer visitor questions about these products, how investing with the firm works in general terms, and encourage them to leave contact details or use the contact section for anything specific to their own money. Keep replies short (2-4 sentences), warm, plain-English, and never invent specific fees, minimums, returns, or performance figures you were not given — if asked for exact numbers, say a member of the team will confirm those directly. Always make clear you are not providing personalised financial advice.`;
let history = [];

async function initChat(){
  if(window.claude && typeof window.claude.use === 'function'){
    try{ sampleFn = await window.claude.use('sample'); }catch(e){ sampleFn = null; }
  }
  // Chat launcher stays visible either way — the local concierge below covers
  // the case where the AI-backed "sample" capability isn't available.
}
initChat();

/* Small local knowledge base used when there's no AI backend to call */
const LOCAL_FAQ = [
  { test: /portfolio/i, reply: "Portfolio Management is a discretionary mandate — we build you a mix of equities, fixed income and money market instruments around a written policy for your goals and risk appetite. It suits individuals and institutions who want a bespoke approach rather than a pooled fund." },
  { test: /mutual\s*fund/i, reply: "Our Mutual Fund pools your contribution with other unit holders under one strategy, with daily-priced units — a practical way to get diversified, professionally managed exposure without needing a large opening balance." },
  { test: /money\s*market/i, reply: "The Money Market Fund is launching soon — it's built for short-horizon capital, prioritising capital preservation and steady income over growth. Leave your details in the contact section and the team can notify you at launch." },
  { test: /(fee|charge|cost|minimum)/i, reply: "Fees and minimums vary by product and mandate size, so I won't guess a number here — a member of the team can confirm exact figures for your situation. Feel free to leave a message in the contact section." },
  { test: /(hour|open|closed|time)/i, reply: "Our office keeps standard business hours, Monday to Friday, 8:00–17:00 West Africa Time — you can see whether we're open right now in the Location section above." },
  { test: /(location|address|office|where)/i, reply: "We're based in Victoria Island, Lagos. There's a map and a 'Get directions' link in the Location section of this page." },
  { test: /(contact|phone|email|call|reach)/i, reply: "You can reach the team by email or phone in the Contact section below, or just leave your question here and we'll follow up." },
  { test: /(return|performance|yield|profit)/i, reply: "I can't quote specific returns or yields here — those depend on the product, timing and market conditions, and the team will walk you through real figures directly." },
  { test: /(risk|safe|guarantee)/i, reply: "All investing carries risk, including possible loss of principal — nothing here is a guarantee. We manage to a written risk policy for every mandate and are upfront about trade-offs when we talk." },
  { test: /(hi|hello|hey)/i, reply: "Hello! I can tell you about Portfolio Management, our Mutual Fund, or the upcoming Money Market Fund — what would you like to know?" }
];
function localAnswer(text){
  const hit = LOCAL_FAQ.find(f => f.test.test(text));
  if(hit) return hit.reply;
  return "Thanks for the question — I'm a simple offline concierge in this preview, so for anything beyond our product basics, please use the contact section and the team will get back to you directly.";
}

function addMsg(text, cls){
  const d = document.createElement('div');
  d.className = 'msg ' + cls;
  d.textContent = text;
  chatBody.appendChild(d);
  chatBody.scrollTop = chatBody.scrollHeight;
  return d;
}

chatLauncher.addEventListener('click', () => {
  chatPanel.classList.add('open');
  chatInput.focus();
});
chatClose.addEventListener('click', () => chatPanel.classList.remove('open'));

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 70) + 'px';
});
chatInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); }
});
chatSend.addEventListener('click', sendChat);

async function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  addMsg(text, 'user');
  history.push({ role: 'user', content: text });
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatSend.disabled = true;
  const botEl = addMsg('…', 'bot');

  if(sampleFn){
    const turns = [
      { role: 'user', content: SYSTEM_PROMPT },
      { role: 'assistant', content: 'Understood — I will answer as the Possibility Fund Limited concierge, keeping replies short and never inventing figures.' },
      ...history
    ];
    try{
      const result = await sampleFn(turns, {
        modelTier: 'quick',
        onText: ({ text }) => { botEl.textContent = text; chatBody.scrollTop = chatBody.scrollHeight; }
      });
      const finalText = (result && result.text) ? result.text : botEl.textContent;
      botEl.textContent = finalText;
      history.push({ role: 'assistant', content: finalText });
    }catch(err){
      botEl.textContent = "I couldn't reach the assistant just now — please try again, or reach the team directly via the contact section.";
    }finally{
      chatSend.disabled = false;
      chatBody.scrollTop = chatBody.scrollHeight;
    }
    return;
  }

  // Local fallback: a short simulated "typing" delay, then a matched answer.
  setTimeout(() => {
    const reply = localAnswer(text);
    botEl.textContent = reply;
    history.push({ role: 'assistant', content: reply });
    chatSend.disabled = false;
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 500 + Math.random() * 500);
}

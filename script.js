(() => {
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];

  // ========== LOADER - LOCK ENTRY UNTIL EVERY IMAGE LOADED ==========
  const loader = $('#loader');
  const loaderFill = $('#loaderFill');
  const loaderCount = $('#loaderCount');
  const loaderNum = $('#loaderNum');
  const loaderStatus = $('#loaderStatus');
  const loaderFiles = $('#loaderFiles');
  const loaderCar = $('#loaderCar');
  const loaderScan = $('#loaderScan');
  const body = document.body;

  // Prevent scroll immediately
  window.scrollTo(0,0);
  if (history.scrollRestoration) history.scrollRestoration = 'manual';
  body.classList.add('is-loading');

  // Collect every <img> + critical background images
  const imgElements = [...document.querySelectorAll('img')];
  // Deduplicate srcs
  const uniqueSrcs = [...new Set(imgElements.map(i => i.currentSrc || i.src).filter(Boolean))];
  // Also include images folder known list to be safe (covers not yet in DOM? but all are in DOM)
  const requiredAssets = uniqueSrcs;

  const total = requiredAssets.length || 1;
  let loaded = 0;
  let failed = 0;

  // Build file list UI
  if (loaderFiles) {
    requiredAssets.forEach(src => {
      const name = src.split('/').pop() || src;
      const span = document.createElement('span');
      span.dataset.src = src;
      span.innerHTML = `<span>${name.toUpperCase()}</span><span>QUEUED</span>`;
      loaderFiles.appendChild(span);
    });
  }

  function setFileStatus(src, status) {
    if (!loaderFiles) return;
    const el = loaderFiles.querySelector(`[data-src="${CSS.escape(src)}"]`) || 
               [...loaderFiles.children].find(c => c.dataset.src && src.includes(c.dataset.src.split('/').pop()));
    if (!el) return;
    el.className = status === 'loaded' ? 'loaded' : status === 'loading' ? 'loading' : '';
    const label = el.querySelector('span:last-child');
    if (label) label.textContent = status.toUpperCase();
  }

  function updateProgress() {
    const pct = Math.round((loaded / total) * 100);
    if (loaderFill) loaderFill.style.width = pct + '%';
    if (loaderCount) loaderCount.textContent = String(pct).padStart(2,'0') + '%';
    if (loaderNum) loaderNum.textContent = `${String(loaded).padStart(2,'0')} / ${String(total).padStart(2,'0')} ASSETS`;
    if (loaderCar) {
      // loader car gradually brightens with progress
      const b = 0.12 + (pct/100)*1.05;
      loaderCar.style.filter = `brightness(${b}) contrast(1.2) grayscale(${1 - pct/100})`;
    }
    if (loaderScan) {
      loaderScan.style.transform = `translateX(${-100 + (pct/100)*260}%)`;
    }
    if (loaderStatus) {
      if (pct < 30) loaderStatus.textContent = 'MACHINING LIGHT • LOADING SCULPTURE';
      else if (pct < 70) loaderStatus.textContent = 'FORGING SURFACES • READING REFLECTIONS';
      else if (pct < 100) loaderStatus.textContent = 'CALIBRATING PRECISION • ALMOST READY';
      else loaderStatus.textContent = 'SCULPTURE RENDERED • ENTERING VOID';
    }
  }

  // Preload with Image objects to guarantee load even if cached
  const promises = requiredAssets.map(src => {
    return new Promise(resolve => {
      setFileStatus(src, 'loading');
      const img = new Image();
      img.onload = () => {
        loaded++;
        setFileStatus(src, 'loaded');
        updateProgress();
        resolve({src, ok:true});
      };
      img.onerror = () => {
        failed++;
        loaded++; // count as loaded to not block forever, but mark
        setFileStatus(src, 'loaded');
        updateProgress();
        resolve({src, ok:false});
      };
      img.src = src;
      // If already complete (cached), trigger quickly
      if (img.complete) {
        // Defer to next tick to allow UI to paint initial state
        setTimeout(()=> {
          if (img.naturalWidth !== 0) {
            // already counted? avoid double - check if not yet counted via this img instance
            // simplified: if loaded already includes? we rely on onload will not fire again for complete, so manual
            // We'll ensure onload path still runs
          }
        }, 0);
      }
    });
  });

  // Also wait for fonts and window load for safety (minimum 800ms exhibition feel)
  const minTime = new Promise(r => setTimeout(r, 900));
  const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([...promises, minTime, fontReady]).then(() => {
    // Final tick to 100%
    loaded = total;
    updateProgress();

    // Exhibition pause before entry
    setTimeout(()=>{
      if (loader) {
        loader.classList.add('hidden');
        body.classList.remove('is-loading');
        body.style.pointerEvents = '';
        // Trigger hero entrance animation AFTER loader gone
        const heroTitleWords = $$('#heroTitle .word');
        heroTitleWords.forEach((w,i)=> {
          w.style.transitionDelay = (i*0.08)+'s';
          w.classList.add('show');
        });
      }
      // Remove loader from DOM after transition
      setTimeout(()=> {
        if (loader) loader.style.display = 'none';
      }, 1100);
    }, 650);
  });

  // Safety: if something hangs, force entry after 8s
  setTimeout(()=>{
    if (loader && !loader.classList.contains('hidden')) {
      loaded = total;
      updateProgress();
      loader.classList.add('hidden');
      body.classList.remove('is-loading');
      setTimeout(()=> loader.style.display='none', 1100);
    }
  }, 8000);

  updateProgress();

  // ========== END LOADER ==========

  // clock
  const clockEl = $('#clock');
  setInterval(()=>{
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    const ss = String(now.getUTCSeconds()).padStart(2,'0');
    if(clockEl) clockEl.textContent = `${hh}:${mm}:${ss} UTC • MUSEUM MODE`;
  },1000);

  // cursor
  const cursor = $('#cursor');
  let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
  let curX = mouseX, curY = mouseY;
  if(cursor && window.innerWidth>980){
    window.addEventListener('mousemove', e=>{
      mouseX = e.clientX; mouseY = e.clientY;
      document.documentElement.style.setProperty('--mx', (e.clientX/window.innerWidth*100)+'%');
      document.documentElement.style.setProperty('--my', (e.clientY/window.innerHeight*100)+'%');
      const walkLens = $('#walkLens');
      if(walkLens) { walkLens.style.setProperty('--mx', e.clientX+'px'); walkLens.style.setProperty('--my', e.clientY+'px'); }
    });
    (function animateCursor(){
      curX += (mouseX - curX)*0.18;
      curY += (mouseY - curY)*0.18;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      requestAnimationFrame(animateCursor);
    })();
    $$('button, a, .swatch, .wheel-opt, .int-opt, .amb-opt, .g-item').forEach(el=>{
      el.addEventListener('mouseenter', ()=> cursor.classList.add('hover'));
      el.addEventListener('mouseleave', ()=> cursor.classList.remove('hover'));
    });
  }

  // progress + hero reveal
  const progress = $('#progress');
  const heroWrap = $('.hero-wrap');
  const heroImg = $('#heroCarImg');
  const sweep = $('#sweepLight');
  const scrollFill = $('#scrollFill');
  const lightPos = $('#lightPos');
  const callouts = $$('.callout');
  const heroStage = $('#heroStage');

  function onScroll(){
    const scY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const prog = docH>0 ? scY/docH : 0;
    if(progress) progress.style.width = (prog*100)+'%';

    if(heroWrap){
      const rect = heroWrap.getBoundingClientRect();
      const totalH = heroWrap.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / (totalH || 1)));
      if(heroImg){
        const bright = 0.08 + p*1.05;
        const blur = (1-p)*2;
        const scale = 0.96 + p*0.07;
        const contrast = 1.2 + p*0.15;
        const gray = 0.35 - p*0.35;
        heroImg.style.filter = `brightness(${bright}) contrast(${contrast}) grayscale(${gray}) blur(${blur}px)`;
        heroImg.style.transform = `scale(${scale})`;
      }
      if(sweep){
        const sweepX = -120 + p*290;
        sweep.style.setProperty('--sweep', sweepX+'%');
        sweep.style.opacity = p>0.05 ? 1 : 0;
      }
      const bloom = $('.bloom-layer');
      const refl = $('.vehicle-reflection');
      if(bloom) bloom.style.opacity = p*0.9;
      if(refl) { refl.style.opacity = p*0.7; refl.style.transform = `scaleY(${0.4 + p*0.6}) translateY(${p*6}px)`; }
      callouts.forEach((c,i)=>{
        if(p > 0.46 + i*0.12) c.classList.add('visible');
        else c.classList.remove('visible');
      });
      if(scrollFill) scrollFill.style.width = (p*100)+'%';
      const pctEl = $('.scroll-indicator .mono');
      if(pctEl) pctEl.textContent = `${Math.round(p*100).toString().padStart(2,'0')}% UNVEILED`;
      if(lightPos) lightPos.textContent = `LIGHT ${(p*180).toFixed(1)}° / REFLECTION ${p.toFixed(2)}`;
      const heroTitle = $('#heroTitle');
      if(heroTitle) heroTitle.style.letterSpacing = `${-0.06 + p*0.03}em`;
    }

    const walkSection = $('#walk');
    if(walkSection){
      const steps = $$('.walk-step');
      const imgs = $$('.walk-img');
      const camAngleEl = $('#camAngle');
      const focusEl = $('#focusPoint');
      const wRect = walkSection.getBoundingClientRect();
      if(wRect.top < window.innerHeight*0.2 && wRect.bottom > window.innerHeight*0.2){
        let activeIndex = 0;
        let minDist = Infinity;
        steps.forEach((s,i)=>{
          const r = s.getBoundingClientRect();
          const center = r.top + r.height/2;
          const dist = Math.abs(center - window.innerHeight/2);
          if(dist < minDist){ minDist = dist; activeIndex = i; }
        });
        steps.forEach((s,i)=> s.classList.toggle('active', i===activeIndex));
        imgs.forEach((img,i)=> img.classList.toggle('active', i===activeIndex));
        const angles = ['12.4° FRONT','18.7° QUARTER','32.1° REAR','5.2° MACRO','-4.8° FLOW','0.0° MATERIAL'];
        const focuses = ['QUARTER PANEL','SIDE TENSION LINE','BRAKE BEAM','FORGED RIM','AERO SHEET','CARBON WEAVE'];
        if(camAngleEl) camAngleEl.textContent = angles[activeIndex] || '';
        if(focusEl) focusEl.textContent = focuses[activeIndex] || '';
      }
    }

    const perf = $('#perf');
    if(perf){
      const r = perf.getBoundingClientRect();
      if(r.top < window.innerHeight*0.7 && !perf.dataset.animated){
        perf.dataset.animated = '1';
        animatePerf();
      }
    }
    $$('.reveal').forEach(el=>{
      const rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight*0.85) el.classList.add('show');
    });
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  function animatePerf(){
    $$('.perf-num').forEach(el=>{
      const target = parseFloat(el.dataset.target);
      const isFloat = target % 1 !== 0;
      const dur = 1600;
      const start = performance.now();
      function tick(now){
        const t = Math.min(1, (now-start)/dur);
        const eased = 1 - Math.pow(1-t,3);
        const cur = eased * target;
        if(isFloat){
          el.innerHTML = `<em>${Math.floor(cur)}</em>.<em>${((cur%1).toFixed(1).split('.')[1])}</em>`;
        } else {
          el.innerHTML = `<em>${Math.floor(cur)}</em>`;
        }
        if(t<1) requestAnimationFrame(tick);
        else el.innerHTML = isFloat ? `<em>${target.toFixed(1).split('.')[0]}</em>.<em>${target.toFixed(1).split('.')[1]}</em>` : `<em>${target}</em>`;
      }
      requestAnimationFrame(tick);
    });
    $$('.perf-bar-fill').forEach(f=>{
      f.style.width = f.dataset.fill+'%';
    });
  }

  const menuBtn = $('#menuBtn');
  const overlay = $('#overlayMenu');
  if(menuBtn && overlay){
    menuBtn.addEventListener('click', ()=>{
      if(body.classList.contains('is-loading')) return;
      const open = overlay.classList.toggle('open');
      menuBtn.classList.toggle('active', open);
      body.style.overflow = open ? 'hidden' : '';
    });
    $$('.overlay-link').forEach(l=>{
      l.addEventListener('click', e=>{
        e.preventDefault();
        const href = l.getAttribute('href');
        overlay.classList.remove('open');
        menuBtn.classList.remove('active');
        body.style.overflow='';
        setTimeout(()=>{
          const target = $(href);
          if(target) target.scrollIntoView({behavior:'smooth'});
        }, 200);
      });
    });
  }

  $$('[data-tilt]').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left)/rect.width -0.5;
      const y = (e.clientY - rect.top)/rect.height -0.5;
      card.style.transform = `perspective(1000px) rotateY(${x*6}deg) rotateX(${-y*6}deg)`;
    });
    card.addEventListener('mouseleave', ()=> card.style.transform='perspective(1000px) rotateY(0) rotateX(0)');
  });

  const interiorImg = $('#interiorImg');
  const interior = $('#interior');
  if(interior && interiorImg){
    window.addEventListener('scroll', ()=>{
      const r = interior.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top)/ (window.innerHeight + r.height)));
      interiorImg.style.transform = `scale(${1.08 - p*0.06}) translateY(${p*-18}px)`;
    }, {passive:true});
  }

  const configCar = $('#configCar');
  const configTint = $('#configTint');
  const finishName = $('#finishName');
  const wheelName = $('#wheelName');
  const interiorName = $('#interiorName');
  const ambient = $('#ambient');
  const ambientName = $('#ambientName');
  const configStage = $('#configStage');

  const finishes = {
    graphite: {tint:'transparent', filter:'brightness(1) contrast(1.06)', name:'GRAPHITE MONOLITH'},
    aluminum: {tint:'rgba(200,207,214,0.55)', filter:'brightness(1.18) contrast(1.05) saturate(0.3)', name:'RAW ALUMINIUM'},
    carbon: {tint:'rgba(20,20,20,0.2)', filter:'brightness(0.7) contrast(1.2)', name:'EXPOSED CARBON'},
    ice: {tint:'rgba(243,245,247,0.6)', filter:'brightness(1.32) contrast(0.9) saturate(0)', name:'POLAR GLASS WHITE'},
    red: {tint:'rgba(255,30,30,0.68)', filter:'brightness(0.95) contrast(1.2)', name:'BRAKE LIGHT EDITION'}
  };
  $$('#finishSwatches .swatch').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#finishSwatches .swatch').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.finish;
      const cfg = finishes[f];
      if(configTint){ configTint.style.background = cfg.tint; configTint.style.opacity = f==='graphite' ? '0' : '1'; }
      if(configCar) configCar.style.filter = cfg.filter;
      if(finishName) finishName.textContent = cfg.name;
      configStage.style.boxShadow = f==='red' ? '0 0 80px rgba(255,30,30,0.18)' : 'none';
    });
  });
  $$('#wheelOptions .wheel-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#wheelOptions .wheel-opt').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const map = {aerodisc:'AERODISC 21"', monoblock:'MONOBLOCK 21"', hollow:'HOLLOW SPOKE 21"'};
      if(wheelName) wheelName.textContent = map[btn.dataset.wheel];
      if(configCar){ configCar.style.transform = 'scale(1.02)'; setTimeout(()=> configCar.style.transform='scale(1)', 220); }
    });
  });
  $$('#interiorOptions .int-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#interiorOptions .int-opt').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(interiorName) interiorName.textContent = btn.dataset.name;
    });
  });
  $$('#ambientOptions .amb-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#ambientOptions .amb-opt').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(ambientName) ambientName.textContent = btn.dataset.name;
      const amb = btn.dataset.amb;
      if(ambient){
        if(amb==='white') ambient.style.setProperty('--amb','rgba(232,238,245,0.28)');
        if(amb==='red') ambient.style.setProperty('--amb','rgba(255,30,30,0.26)');
        if(amb==='off') ambient.style.setProperty('--amb','rgba(0,0,0,0)');
      }
    });
  });

  const endingLight = $('#endingLight');
  const ending = $('#ending');
  if(endingLight && ending){
    ending.addEventListener('mousemove', e=>{
      const rect = ending.getBoundingClientRect();
      const x = ((e.clientX - rect.left)/rect.width)*100;
      const y = ((e.clientY - rect.top)/rect.height)*100;
      endingLight.style.background = `radial-gradient(ellipse at ${x}% ${y}%, rgba(255,255,255,0.12), transparent 62%)`;
    });
  }

  const modal = $('#modal');
  const reserveBtn = $('#reserveBtn');
  const finalReserve = $('#finalReserve');
  const modalClose = $('#modalClose');
  const modalBg = $('#modalBg');
  function openModal(){ modal.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; }
  if(reserveBtn) reserveBtn.addEventListener('click', openModal);
  if(finalReserve) finalReserve.addEventListener('click', openModal);
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modalBg) modalBg.addEventListener('click', closeModal);

  let holdTimer=null;
  if(reserveBtn){
    reserveBtn.addEventListener('mousedown', ()=>{
      if(body.classList.contains('is-loading')) return;
      reserveBtn.style.transform='scale(0.98) translateY(2px)';
      holdTimer = setTimeout(openModal, 450);
    });
    window.addEventListener('mouseup', ()=>{
      reserveBtn.style.transform='';
      clearTimeout(holdTimer);
    });
  }
  const footerTop = $('.ending-footer span:last-child');
  if(footerTop){
    footerTop.style.cursor='pointer';
    footerTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  }
  const manifestoTitle = $('#manifestoTitle');
  if(manifestoTitle){
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{
        if(ent.isIntersecting){
          $$('.e-line', manifestoTitle).forEach((line,i)=>{
            line.style.transform = `translateY(${100 - i*6}%)`;
            line.style.transition = `transform 1.1s ${i*0.08}s cubic-bezier(.16,1,.3,1)`;
            setTimeout(()=> line.style.transform='translateY(0)', 50);
          });
        }
      });
    }, {threshold:0.3});
    observer.observe(manifestoTitle);
  }
  $$('.massive.small').forEach(el=>{
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ el.classList.add('reveal','show'); } });
    }, {threshold:0.2});
    io.observe(el);
  });

})();

import { genId } from '../../utils/genId.js';

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const SVG_PREV = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const SVG_NEXT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
const SVG_CLOSE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

/**
 * Рендер слайдера в контейнер.
 * @param {string|HTMLElement} container - id элемента или сам DOM-элемент
 * @param {string[]} imageUrls - массив URL изображений
 * @param {{ ease?: string }} [options] - опции (ease для анимации)
 */
export function renderSlider(container, imageUrls, options = {}) {
    const dataset = Array.isArray(imageUrls) ? imageUrls : [];
    const ease = options.ease || EASE;
    const sldID = genId();

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const html = buildSliderHTML(sldID, dataset, ease);
    el.innerHTML = html;
    initSlider(sldID, dataset, ease);
}

function buildSliderHTML(sldID, dataset, ease) {
    let slides = '';
    if (dataset.length > 0) {
        slides += `<div class="slide"><img src="${dataset[dataset.length - 1]}" alt=""></div>`;
    }
    dataset.forEach((img, i) => {
        slides += `<div class="slide"><img src="${img}" alt="slide ${i + 1}" class="sld-img" data-src="${img}"></div>`;
    });
    if (dataset.length > 0) {
        slides += `<div class="slide"><img src="${dataset[0]}" alt=""></div>`;
    }
    return `
    <div id="sld-${sldID}" class="prxz-slider">
        <button class="sld-btn prev" type="button" aria-label="Назад">${SVG_PREV}</button>
        <div class="sld-track">${slides}</div>
        <button class="sld-btn next" type="button" aria-label="Вперёд">${SVG_NEXT}</button>
        <div class="sld-dots"></div>
    </div>
    <style>${sliderStyle(sldID, ease)}</style>`;
}

function sliderStyle(id, ease) {
    const s = `#sld-${id}`;
    return `
${s}{--sld-radius:16px;--sld-edge:rgba(255,255,255,.10);--sld-shadow:0 18px 60px rgba(0,0,0,.20);--sld-shadow2:0 10px 30px rgba(0,0,0,.16);--sld-ui-bg:rgba(18,18,20,.55);--sld-ui-bg2:rgba(255,255,255,.10);--sld-ui-stroke:rgba(255,255,255,.16);--sld-ui-text:#fff;--sld-ease:${ease};position:relative;width:100%;height:100%;overflow:hidden;border-radius:var(--sld-radius);background:radial-gradient(120% 120% at 10% 0%, rgba(255,255,255,.08), transparent 60%),linear-gradient(180deg, rgba(10,10,12,1), rgba(10,10,12,1));box-shadow:var(--sld-shadow);isolation:isolate}
${s}:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 10%, rgba(0,0,0,.10), transparent 55%),linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.35));mix-blend-mode:multiply;opacity:.85;z-index:2}
${s}:after{content:"";position:absolute;inset:-1px;pointer-events:none;border-radius:calc(var(--sld-radius) + 1px);border:1px solid var(--sld-edge);opacity:.9;z-index:3}
${s} .sld-track{display:flex;transition:transform .7s var(--sld-ease);height:100%;flex-shrink:0;will-change:transform;position:relative;z-index:1}
${s} .slide{flex-shrink:0;min-width:0;height:100%;display:flex;align-items:stretch;justify-content:stretch;padding:0;box-sizing:border-box;background:#0a0a0c}
${s} .slide img{width:100%;height:100%;object-fit:cover;display:block;transform:translateZ(0)}
${s} .slide img.sld-img{cursor:pointer;transition:transform .45s var(--sld-ease),filter .45s var(--sld-ease);filter:saturate(1.02) contrast(1.02)}
${s} .slide img.sld-img:active{transform:scale(.99)}

${s} .sld-btn{position:absolute;top:50%;transform:translateY(-50%);border:none;cursor:pointer;padding:0;z-index:10;border-radius:999px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:var(--sld-ui-text);background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));box-shadow:0 10px 28px rgba(0,0,0,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);outline:none;transition:transform .2s ease,background .2s ease,box-shadow .2s ease,opacity .2s ease}
${s} .sld-btn svg{display:block;opacity:.95}
${s} .sld-btn:hover{transform:translateY(-50%) scale(1.06);background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));box-shadow:0 14px 36px rgba(0,0,0,.45)}
${s} .sld-btn:active{transform:translateY(-50%) scale(.98)}
${s} .sld-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,255,255,.26),0 14px 36px rgba(0,0,0,.45)}
${s} .sld-btn.prev{left:14px}
${s} .sld-btn.next{right:14px}

${s} .sld-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;padding:8px 10px;border-radius:999px;background:rgba(10,10,12,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.10)}
${s} .dot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.42);cursor:pointer;transition:transform .25s ease,background .25s ease,width .25s ease,opacity .25s ease;opacity:.9}
${s} .dot:hover{background:rgba(255,255,255,.78);transform:scale(1.12)}
${s} .dot.active{width:22px;background:rgba(255,255,255,.92);opacity:1;box-shadow:0 8px 18px rgba(0,0,0,.28)}

@media (prefers-reduced-motion: reduce){
  ${s} .sld-track{transition:none!important}
  ${s} .slide img.sld-img{transition:none!important}
  ${s} .sld-btn{transition:none!important}
  ${s} .dot{transition:none!important}
}

.sld-fs-modal{position:fixed;inset:0;z-index:9999;background:radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.06), transparent 55%),rgba(0,0,0,.88);overflow:hidden;opacity:0;visibility:hidden;transition:opacity .28s ease,visibility .28s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sld-fs-modal.is-open{opacity:1;visibility:visible}
.sld-fs-modal:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(90% 70% at 50% 15%, rgba(0,0,0,.12), transparent 55%),linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.35));opacity:.9}
.sld-fs-modal .sld-track{position:absolute;inset:0;display:flex;transition:transform .7s ${ease};height:100%;will-change:transform}
.sld-fs-modal .slide{flex-shrink:0;min-width:0;height:100%;display:flex;align-items:stretch;justify-content:stretch;background:#0a0a0c}
.sld-fs-modal .slide img{width:100%;height:100%;object-fit:contain;display:block}
.sld-fs-modal .sld-btn{position:absolute;top:50%;transform:translateY(-50%);border:none;cursor:pointer;padding:0;z-index:10;border-radius:999px;width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
.sld-fs-modal .sld-btn:hover{background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));transform:translateY(-50%) scale(1.06);box-shadow:0 18px 44px rgba(0,0,0,.52)}
.sld-fs-modal .sld-btn:active{transform:translateY(-50%) scale(.98)}
.sld-fs-modal .sld-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,255,255,.24),0 18px 44px rgba(0,0,0,.52)}
.sld-fs-modal .sld-btn.prev{left:18px}
.sld-fs-modal .sld-btn.next{right:18px}
.sld-fs-modal .sld-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:9px;z-index:10;padding:9px 12px;border-radius:999px;background:rgba(10,10,12,.22);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)}
.sld-fs-modal .dot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.38);cursor:pointer;transition:transform .25s ease,background .25s ease,width .25s ease,opacity .25s ease;opacity:.85}
.sld-fs-modal .dot:hover{background:rgba(255,255,255,.75);transform:scale(1.12)}
.sld-fs-modal .dot.active{width:24px;background:rgba(255,255,255,.92);opacity:1;box-shadow:0 12px 26px rgba(0,0,0,.35)}
.sld-fs-modal .sld-fs-close{position:absolute;top:16px;right:16px;width:44px;height:44px;border:none;background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));color:#ff4d4f;cursor:pointer;border-radius:50%;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(0,0,0,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.sld-fs-modal .sld-fs-close svg{display:block;opacity:.95}
.sld-fs-modal .sld-fs-close:hover{background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));transform:scale(1.06);box-shadow:0 16px 40px rgba(0,0,0,.5)}
.sld-fs-modal .sld-fs-close:active{transform:scale(.98)}

@media (prefers-reduced-motion: reduce){
  .sld-fs-modal,.sld-fs-modal .sld-track{transition:none!important}
  .sld-fs-modal .sld-btn,.sld-fs-modal .dot,.sld-fs-modal .sld-fs-close{transition:none!important}
}`;
}

function initSlider(sldID, dataset, ease) {
    const container = document.querySelector(`#sld-${sldID}`);
    if (!container) return;
    const track = container.querySelector('.sld-track');
    const slides = container.querySelectorAll('.slide');
    const prevBtn = container.querySelector('.prev');
    const nextBtn = container.querySelector('.next');
    const dotsContainer = container.querySelector('.sld-dots');
    const slideCount = dataset.length;
    let currentIndex = 1;
    const t = `transform .6s ${ease}`;

    for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    const dots = container.querySelectorAll('.dot');

    const totalSlides = slides.length;
    function getSlideWidth() {
        return container.clientWidth || (slides[0] && slides[0].offsetWidth) || 0;
    }
    function updateSlider() {
        if (!totalSlides) return;
        const w = getSlideWidth();
        if (w <= 0) return;
        slides.forEach(s => { s.style.flex = '0 0 ' + w + 'px'; s.style.width = w + 'px'; });
        track.style.transform = `translateX(-${currentIndex * w}px)`;
        const ai = currentIndex - 1;
        if (ai >= 0 && ai < slideCount) dots.forEach((d, i) => d.classList.toggle('active', i === ai));
    }
    track.style.transition = 'none';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateSlider();
            track.style.transition = t;
        });
    });
    function goToSlide(index) {
        if (index < 0 || index >= slideCount) return;
        currentIndex = index + 1;
        updateSlider();
    }

    function nextSlide() {
        if (currentIndex >= slides.length - 1) return;
        currentIndex++;
        updateSlider();
        if (currentIndex === slides.length - 1) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = 1;
                updateSlider();
                setTimeout(() => { track.style.transition = t; }, 50);
            }, 600);
        }
    }
    function prevSlide() {
        if (currentIndex <= 0) return;
        currentIndex--;
        updateSlider();
        if (currentIndex === 0) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = slides.length - 2;
                updateSlider();
                setTimeout(() => { track.style.transition = t; }, 50);
            }, 600);
        }
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    window.addEventListener('resize', updateSlider);

    function openFS(startRealIndex) {
        const total = dataset.length;
        if (!total) return;
        const modal = document.createElement('div');
        modal.className = 'sld-fs-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Просмотр');

        let fsSlides = '';
        fsSlides += `<div class="slide"><img src="${dataset[total - 1]}" alt=""></div>`;
        dataset.forEach((img) => { fsSlides += `<div class="slide"><img src="${img}" alt=""></div>`; });
        fsSlides += `<div class="slide"><img src="${dataset[0]}" alt=""></div>`;

        modal.innerHTML = `
            <button class="sld-fs-close" type="button" aria-label="Закрыть">${SVG_CLOSE}</button>
            <button class="sld-btn prev" type="button" aria-label="Назад">${SVG_PREV}</button>
            <div class="sld-track">${fsSlides}</div>
            <button class="sld-btn next" type="button" aria-label="Вперёд">${SVG_NEXT}</button>
            <div class="sld-dots"></div>
        `;

        const fsTrack = modal.querySelector('.sld-track');
        const fsSlideEls = modal.querySelectorAll('.slide');
        const fsPrev = modal.querySelector('.prev');
        const fsNext = modal.querySelector('.next');
        const fsDotsWrap = modal.querySelector('.sld-dots');
        const fsClose = modal.querySelector('.sld-fs-close');
        let fsIndex = Math.max(0, Math.min(total - 1, startRealIndex)) + 1;
        const fsT = `transform .6s ${ease}`;

        for (let i = 0; i < total; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.dataset.index = i;
            dot.addEventListener('click', () => goToFS(i));
            fsDotsWrap.appendChild(dot);
        }
        const fsDots = fsDotsWrap.querySelectorAll('.dot');

        function getFSW() { return modal.clientWidth || (fsSlideEls[0] && fsSlideEls[0].offsetWidth) || 0; }
        function updateFS() {
            const w = getFSW();
            if (w <= 0) return;
            fsSlideEls.forEach(s => { s.style.flex = '0 0 ' + w + 'px'; s.style.width = w + 'px'; });
            fsTrack.style.transform = `translateX(-${fsIndex * w}px)`;
            const ai = fsIndex - 1;
            if (ai >= 0 && ai < total) fsDots.forEach((d, i) => d.classList.toggle('active', i === ai));
        }
        function goToFS(i) { fsIndex = i + 1; updateFS(); }
        function nextFS() {
            if (fsIndex >= fsSlideEls.length - 1) return;
            fsIndex++; updateFS();
            if (fsIndex === fsSlideEls.length - 1) {
                setTimeout(() => {
                    fsTrack.style.transition = 'none';
                    fsIndex = 1;
                    updateFS();
                    setTimeout(() => { fsTrack.style.transition = fsT; }, 50);
                }, 600);
            }
        }
        function prevFS() {
            if (fsIndex <= 0) return;
            fsIndex--; updateFS();
            if (fsIndex === 0) {
                setTimeout(() => {
                    fsTrack.style.transition = 'none';
                    fsIndex = fsSlideEls.length - 2;
                    updateFS();
                    setTimeout(() => { fsTrack.style.transition = fsT; }, 50);
                }, 600);
            }
        }

        function closeFSModal() {
            if (!modal._closeFS) return;
            modal._closeFS = null;
            modal.classList.remove('is-open');
            setTimeout(() => {
                if (modal.parentNode) modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }

        fsClose.addEventListener('click', closeFSModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeFSModal(); });
        fsPrev.addEventListener('click', prevFS);
        fsNext.addEventListener('click', nextFS);
        window.addEventListener('resize', updateFS);

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        fsTrack.style.transition = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateFS();
                fsTrack.style.transition = fsT;
                modal.classList.add('is-open');
            });
        });

        modal._closeFS = closeFSModal;
    }

    document.addEventListener('keydown', e => {
        const modal = document.querySelector('.sld-fs-modal.is-open');
        if (modal && modal._closeFS) {
            if (e.key === 'Escape') return modal._closeFS();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        }
        if (e.key === 'ArrowLeft') prevSlide();
        else if (e.key === 'ArrowRight') nextSlide();
    });
    container.querySelectorAll('.slide img.sld-img').forEach(img => {
        img.addEventListener('click', e => {
            e.stopPropagation();
            const idx = currentIndex - 1;
            openFS(idx);
        });
    });
}

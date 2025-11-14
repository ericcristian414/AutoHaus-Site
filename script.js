(function(){
  try {
    const path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html') {
      if (window.innerWidth <= 680) {
        window.location.replace('android/index-android.html');
      } else {
        window.location.replace('desktop/index-desktop.html');
      }
    }
  } catch(e){ console.warn('redirect check failed', e); }
})();

const loadFragment = async (url, selector) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const html = await response.text();
    const container = document.querySelector(selector);
    if (!container) {
      console.error(`Container não encontrado: ${selector}`);
      return false;
    }
    container.innerHTML = html;
    return true;
  } catch (error) {
    console.error(`Falha ao carregar ${url}:`, error);
    return false;
  }
};

const setHeaderVar = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const h = header.offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
};

const setCurrentPageLink = () => {
  const currentPath = window.location.pathname;
  
  const pageMap = {
    'index-desktop.html': 'index-desktop.html',
    'como-funciona.html': 'como-funciona.html',
    'aplicativo.html': 'aplicativo.html',
    'galery.html': 'galery.html',
    'contato.html': 'contato.html'
  };
  
  let currentPage = '';
  for (const [key, value] of Object.entries(pageMap)) {
    if (currentPath.includes(value)) {
      currentPage = value;
      break;
    }
  }
  
  if (!currentPage && (currentPath.endsWith('/desktop/') || currentPath.endsWith('/') || currentPath.includes('index'))) {
    currentPage = 'index-desktop.html';
  }
  
  console.log('Página atual detectada:', currentPage);
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('current');
  });
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPage) {
      link.classList.add('current');
      console.log('Link marcado como atual:', linkHref);
    }
    
    if (currentPage === 'index-desktop.html' && linkHref === 'index-desktop.html') {
      link.classList.add('current');
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const isMobile = window.innerWidth <= 680;
  const headerFile = isMobile ? 'header-mobile.html' : 'header-desktop.html';

  console.log(`Carregando: ${headerFile}`);

  const [headerLoaded, footerLoaded] = await Promise.all([
    loadFragment(headerFile, '#header-placeholder'),
    loadFragment('footer.html', '#footer-placeholder')
  ]);

  if (headerLoaded && isMobile) {
    const menuToggle = document.getElementById('nav-toggle');
    const menuNav = document.getElementById('site-nav');

    if (menuToggle && menuNav) {
      menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!isExpanded));
        menuNav.classList.toggle('open');
      });

      menuNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menuNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  if (headerLoaded) {
    setTimeout(() => {
      setCurrentPageLink();
      setHeaderVar();
    }, 100);

    initThemeToggle();
  }

  if (footerLoaded) {
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  setHeaderVar();
  window.addEventListener('resize', setHeaderVar);
});



(function(){
  const init = () => {
    const prevBtn = document.querySelector('.stack-prev');
    const nextBtn = document.querySelector('.stack-next');
    const cards = Array.from(document.querySelectorAll('.stack-card'));
    if (!cards.length) return;
    let current = 0;
    let animating = false;
    const count = cards.length;

    const applyPositions = () => {
      for (let i=0;i<count;i++){
        const el = cards[i];
        el.classList.remove('pos-0','pos-1','pos-2','pos-3');
      }
      const mapPos = (offset) => (current + offset) % count;
      cards[mapPos(0)].classList.add('pos-0');
      cards[mapPos(1)].classList.add('pos-1');
      cards[mapPos(2)].classList.add('pos-2');
      cards[mapPos(3)].classList.add('pos-3');
    };

    applyPositions();

    const move = (dir) => {
      if (animating) return;
      animating = true;
      if (dir === 1) {
        current = (current + 1) % count;
      } else {
        current = (current - 1 + count) % count;
      }
      applyPositions();
      setTimeout(()=> animating = false, 650);
    };

    nextBtn && nextBtn.addEventListener('click', ()=> move(1));
    prevBtn && prevBtn.addEventListener('click', ()=> move(-1));

    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') move(1);
      if (ev.key === 'ArrowLeft') move(-1);
    });

    let startX = null, startTime = null;
    const stage = document.querySelector('.stack-stage');
    if (stage) {
      stage.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startTime = Date.now();
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointerup', (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        const dt = Date.now() - startTime;
        if (Math.abs(dx) > 40 && dt < 800) {
          if (dx < 0) move(1); else move(-1);
        }
        startX = null;
      });
      stage.addEventListener('pointercancel', ()=> startX = null);
    }

    const live = stage;
    if (live) {
      const observer = new MutationObserver(()=>{
        const front = document.querySelector('.pos-0 img');
        if (front) {
          const alt = front.getAttribute('alt') || 'Imagem';
          live.setAttribute('aria-label', 'Card atual: ' + alt);
        }
      });
      observer.observe(stage, { subtree: true, attributes: false, childList: false, characterData: false });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

function initThemeToggle(){
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const root = document.documentElement;
  const body = document.body;

  let dark = true;
  try {
    const saved = localStorage.getItem('pref-theme-dark');
    if (saved !== null) dark = saved === '1';
  } catch(e){}

  const applyTheme = () => {
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    body.classList.toggle('dark', dark);
    body.classList.toggle('light', !dark);

    try { root.setAttribute('data-theme', dark ? 'dark' : 'light'); } catch(e){}

    toggle.classList.toggle('dark', dark);
    toggle.classList.toggle('light', !dark);
    toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');

    try {
      toggle.style.setProperty('--theme-rot', dark ? '180deg' : '0deg');
      root.style.setProperty('--theme-rot', dark ? '180deg' : '0deg');
    } catch(e){}

    try { localStorage.setItem('pref-theme-dark', dark ? '1' : '0'); } catch(e) {}
  };

  const toggleTheme = () => {
    dark = !dark;
    applyTheme();
  };

  toggle.addEventListener('click', toggleTheme);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTheme(); }
  });

  applyTheme();
}

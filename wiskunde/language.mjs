const key='aoc-wiskunde-language';

export function readLanguage(fallback='nl') {
  try {
    const saved=localStorage.getItem(key);
    if(saved==='nl'||saved==='en') return saved;
    const previous=JSON.parse(localStorage.getItem('aoc-wiskunde-v1'))?.lang;
    if(previous==='nl'||previous==='en') return previous;
  } catch {}
  return fallback;
}

export function bindLanguage(change) {
  for(const lang of ['nl','en']){
    document.getElementById(lang).onclick=()=>{
      try { localStorage.setItem(key,lang); } catch {}
      change(lang);
    };
  }
  window.addEventListener('pageshow',event=>{
    if(event.persisted) change(readLanguage(document.documentElement.lang));
  });
}

export function renderLanguage(lang,title,skip) {
  const nl=lang==='nl';
  document.documentElement.lang=lang;
  document.title=title;
  document.querySelector('.skip').textContent=skip;
  document.querySelector('.theme-toggle').textContent=nl?'Donkere modus':'Dark mode';
  document.getElementById('languages').setAttribute('aria-label',nl?'Taal':'Language');
  for(const option of ['nl','en']){
    document.getElementById(option).setAttribute('aria-pressed',String(lang===option));
  }
}

const index=document.querySelector('.practice-index');
if(index){
  function renderIndex(lang){
    const title=lang==='nl'?'Wiskunde oefenen':'Maths practice';
    renderLanguage(lang,title,lang==='nl'?'Naar de onderwerpen':'Skip to topics');
    document.getElementById('practice-title').textContent=title;
    for(const node of index.querySelectorAll('[data-en]')) node.textContent=node.dataset[lang];
  }
  bindLanguage(renderIndex);
  renderIndex(readLanguage());
}

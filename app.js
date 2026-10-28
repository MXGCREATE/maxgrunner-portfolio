(async function(){
'use strict';
let all = Array.isArray(window.MAX_PROJECTS)?window.MAX_PROJECTS:[];
let siteCopy={};
let galleryOrder={};
await Promise.all([
 (async()=>{
   try{
     const r=await fetch(new URL('./data/projects.json',document.baseURI),{cache:'no-store'});
     if(!r.ok)throw new Error('Projects request failed');
     const data=await r.json();
     if(Array.isArray(data))all=data;
   }catch(e){console.warn('Using bundled project catalog fallback.',e)}
 })(),
 (async()=>{
   try{
     const r=await fetch(new URL('./data/gallery-order.json',document.baseURI),{cache:'no-store'});
     if(!r.ok)throw new Error('Gallery order unavailable');
     const data=await r.json();
     if(data&&typeof data==='object'&&!Array.isArray(data))galleryOrder=data;
   }catch(e){console.warn('Using existing gallery order fallback.',e)}
 })(),
 (async()=>{
   try{
     const r=await fetch(new URL('./data/site.json',document.baseURI),{cache:'no-store'});
     if(r.ok){const data=await r.json();if(data&&typeof data==='object')siteCopy=data}
   }catch(e){console.warn('Using built-in site copy.',e)}
 })()
]);
/* Keep the original All Work category-slot pattern, but let each category
   have its own independently editable presentation order. Missing titles
   (including newly added videos) remain visible after the ranked projects. */
function applyCategoryOrder(items,orders){
 const keys=['commercial','documentary','culture'];
 const ranked={},cursor={};
 for(const key of keys){
  const requested=Array.isArray(orders[key])?orders[key]:[];
  const rank=new Map();
  requested.forEach((title,i)=>{if(typeof title==='string'&&!rank.has(title))rank.set(title,i)});
  ranked[key]=items.filter(p=>p.category_key===key)
   .map((project,index)=>({project,index}))
   .sort((a,b)=>{
    const ai=rank.has(a.project.title)?rank.get(a.project.title):Number.MAX_SAFE_INTEGER;
    const bi=rank.has(b.project.title)?rank.get(b.project.title):Number.MAX_SAFE_INTEGER;
    return ai-bi||a.index-b.index;
   }).map(x=>x.project);
  cursor[key]=0;
 }
 return items.map(p=>ranked[p.category_key]?ranked[p.category_key][cursor[p.category_key]++]:p);
}
const ordered=applyCategoryOrder(all,galleryOrder);
const featured=all.filter(p=>Number(p.featured_film_order)>0).sort((a,b)=>Number(a.featured_film_order)-Number(b.featured_film_order));
let activeFeature=0, category='commercial', view='grid', screenList=[], screenIndex=0;
const $=id=>document.getElementById(id);
const fmt=n=>String(n).padStart(2,'0');
const categoryLabels={commercial:'Commercial',documentary:'Documentary',culture:'Music & Culture'};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeHttps(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch{return ''}}
function imgSrc(p){
 const candidate=p.uploaded_thumbnail||p.thumbnail_image_url||'';
 const url=String(candidate||'').trim();
 if(url.startsWith('./assets/')||url.startsWith('assets/'))return new URL(url,document.baseURI).href;
 // CMS saves uploads with a root-relative path. Normalize it so it also works
 // at the GitHub Pages project subpath and later at the custom domain root.
 if(url.startsWith('/assets/'))return new URL('.'+url,document.baseURI).href;
 if(url.startsWith('/maxgrunner-portfolio/assets/'))return new URL('./'+url.split('/assets/')[1].replace(/^/,'assets/'),document.baseURI).href;
 return safeHttps(url)||p.preview_image_url||'';
}
function assignImage(img,p){
 const remote=imgSrc(p),backup=p.preview_image_url||'';
 img.alt='Thumbnail for '+p.title;
 if(!remote){img.style.display='none';return}
 img.onerror=()=>{if(backup && !img.src.endsWith(backup.replace(/^\.\//,''))){img.onerror=()=>{img.style.display='none'};img.src=backup}else{img.style.display='none'}};
 img.onload=()=>{img.style.display='block';if(img.nextElementSibling?.classList.contains('thumb-placeholder'))img.nextElementSibling.classList.add('hidden')};
 img.src=remote;
}
/* Featured films use the same full-resolution artwork as the gallery.
   Keep the smaller bundled stills as phone-only error fallbacks, rather than
   stretching them across the hero on high-density screens. */
function assignFeaturedImage(img,p){
 const mobile=window.matchMedia('(max-width:680px)').matches;
 const backup=mobile?({
  'Get Real: Pool Day':'./assets/previews/pool-day.jpg',
  'Get Real: Skater Dog':'./assets/previews/skater-dog.jpg'
 })[p.title]:null;
 assignImage(img,backup&&!p.preview_image_url?{...p,preview_image_url:backup}:p);
}
function renderFeatured(){
 if(!featured.length){$('feature-frame').hidden=true;return}
 const p=featured[activeFeature];
 assignFeaturedImage($('feature-image'),p);
 $('feature-title').textContent=p.title.replace('Get Real: ','');
 $('feature-subtitle').textContent=[p.title.replace('Get Real: ',''),p.roles,p.year].filter(Boolean).join(' / ').toUpperCase();
 $('feature-count').textContent=fmt(activeFeature+1)+' / '+fmt(featured.length);
 $('feature-play').setAttribute('aria-label','Watch '+p.title);
 $('feature-tabs').innerHTML='';
 for(let i=0;i<featured.length;i++){
  const f=featured[i],b=document.createElement('button');b.type='button';b.className='feature-tab'+(activeFeature===i?' active':'');b.textContent=f.title.replace('Get Real: ','');b.setAttribute('aria-pressed',activeFeature===i?'true':'false');
  b.addEventListener('click',()=>{activeFeature=i;renderFeatured()});$('feature-tabs').append(b);
 }
}
function entries(){return ordered.filter(p=>category==='all'||p.category_key===category)}
function renderFilters(){
 const values=[['commercial','Commercial'],['documentary','Documentary'],['culture','Music & culture'],['all','All work']];const target=$('category-filters');target.innerHTML='';
 for(const [k,label] of values){const b=document.createElement('button');b.type='button';b.className='filter-button'+(k===category?' active':'');b.textContent=label;b.setAttribute('aria-pressed',k===category?'true':'false');b.addEventListener('click',()=>{category=k;renderWork()});target.append(b)}
}
function card(p,order){
 const article=document.createElement('article');article.className='project-card';const button=document.createElement('button');button.type='button';button.className='project-card-button';button.setAttribute('aria-label','Watch '+p.title+' — '+p.brand);
 const thumb=document.createElement('div');thumb.className='thumbnail-wrap';const img=document.createElement('img');img.className='thumbnail';img.loading='lazy';img.decoding='async';const placeholder=document.createElement('div');placeholder.className='thumb-placeholder';placeholder.textContent=p.brand||p.title;thumb.append(img,placeholder);assignImage(img,p);
 const m=document.createElement('div');m.className='work-metadata';m.innerHTML='<span>'+esc(p.brand)+'</span><span>'+esc(p.year||'YEAR TBC')+'</span>';
 const title=document.createElement('div');title.className='work-title-line';const h=document.createElement('h3');h.textContent=p.title;const a=document.createElement('span');a.className='arrow';a.textContent='↗';a.setAttribute('aria-hidden','true');title.append(h,a);
 const role=document.createElement('p');role.className='work-role';role.textContent=p.roles||'';button.append(thumb,m,title,role);button.addEventListener('click',()=>openScreen(p,entries()));article.append(button);return article;
}
function indexRow(p,n){const b=document.createElement('button');b.type='button';b.className='index-row';b.setAttribute('aria-label','Watch '+p.title);b.innerHTML='<span class="index-no">'+fmt(n+1)+'</span><span class="index-title">'+esc(p.title)+'</span><span class="index-brand">'+esc(p.brand)+'</span><span class="index-role">'+esc(p.roles)+'</span><span class="index-year">'+esc(p.year||'—')+'</span>';b.addEventListener('click',()=>openScreen(p,entries()));return b;}
function renderWork(){
 const list=entries();$('nav-total').textContent=fmt(all.length);
 $('project-count').textContent=fmt(list.length)+' PROJECT'+(list.length===1?'':'S');
 $('grid-toggle').classList.toggle('active',view==='grid');$('index-toggle').classList.toggle('active',view==='index');
 $('grid-toggle').setAttribute('aria-pressed',String(view==='grid'));$('index-toggle').setAttribute('aria-pressed',String(view==='index'));
 $('projects-grid').hidden=view!=='grid';$('projects-index').hidden=view!=='index';
 const cards=$('projects-grid'),index=$('projects-index');cards.innerHTML='';index.innerHTML='';
 if(view==='grid')list.forEach((p,i)=>cards.append(card(p,i)));else list.forEach((p,i)=>index.append(indexRow(p,i)));
 if(!list.length){const msg=document.createElement('p');msg.textContent='No projects in this category.';(view==='grid'?cards:index).append(msg)}
 renderFilters();
}
function videoEmbed(p){
 const source=safeHttps(p.vimeo_url);
 if(source){
  const u=new URL(source),host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
   const id=host==='player.vimeo.com'&&parts[0]==='video'?parts[1]:parts[0];
   const hash=(host==='player.vimeo.com'?u.searchParams.get('h'):parts[1])||u.searchParams.get('h')||'';
   if(/^\d+$/.test(id||'')){
    const player=new URL('https://player.vimeo.com/video/'+id);
    if(/^[a-f0-9]{6,}$/.test(hash))player.searchParams.set('h',hash);
    return player.href;
   }
  }
 }
 const existing=safeHttps(p.vimeo_embed_url);
 if(existing && new URL(existing).hostname==='player.vimeo.com')return existing;
 const yt=safeHttps(p.youtube_url);
 if(yt){
  const u=new URL(yt),host=u.hostname.toLowerCase();
  const id=host==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:(host==='youtube.com'||host==='www.youtube.com'?u.searchParams.get('v'):null);
  if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
 }
 return '';
}
function populateScreen(){
 const p=screenList[screenIndex];if(!p)return;
 $('screening-title').textContent=p.title;
 $('screening-description').textContent=p.description||'';
 $('screening-brand').textContent=[p.brand,categoryLabels[p.category_key]].filter(Boolean).join(' / ').toUpperCase();
 $('screening-role').textContent=p.roles||'—';$('screening-year').textContent=p.year||'Not provided';
 const u=safeHttps(p.vimeo_url)||safeHttps(p.original_project_url);$('screening-external').href=u||'#';$('screening-external').textContent=p.vimeo_url?'WATCH ON VIMEO ↗':'ORIGINAL PROJECT ↗';
 const holder=$('screening-player');holder.replaceChildren();const embed=videoEmbed(p);
 if(embed){const frame=document.createElement('iframe');frame.title=p.title+' video player';frame.src=embed;frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';holder.append(frame)}
 else{const fallback=document.createElement('div');fallback.className='screening-fallback';fallback.textContent='Video currently unavailable.';holder.append(fallback)}
 $('screening-prev').disabled=screenList.length<2;$('screening-next').disabled=screenList.length<2;
}
function openScreen(p,list){screenList=list.slice();screenIndex=screenList.indexOf(p);if(screenIndex<0){screenList=[p];screenIndex=0}populateScreen();const dialog=$('screening');if(!dialog.open)dialog.showModal();}
function shiftScreen(d){screenIndex=(screenIndex+d+screenList.length)%screenList.length;populateScreen()}
$('feature-play').addEventListener('click',()=>{if(featured.length)openScreen(featured[activeFeature],featured)});
$('feature-next').addEventListener('click',()=>{if(featured.length){activeFeature=(activeFeature+1)%featured.length;renderFeatured()}});
$('grid-toggle').addEventListener('click',()=>{view='grid';renderWork()});
$('index-toggle').addEventListener('click',()=>{view='index';renderWork()});
$('screening-close').addEventListener('click',()=>$('screening').close());
$('screening-next').addEventListener('click',()=>shiftScreen(1));
$('screening-prev').addEventListener('click',()=>shiftScreen(-1));
$('screening').addEventListener('close',()=>{$('screening-player').replaceChildren()});
$('screening').addEventListener('click',e=>{if(e.target===$('screening'))$('screening').close()});
document.addEventListener('keydown',e=>{if($('screening').open){if(e.key==='ArrowRight')shiftScreen(1);else if(e.key==='ArrowLeft')shiftScreen(-1)}});

function applySiteCopy(c){
 if(!c||typeof c!=='object')return;
 const set=(id,key)=>{const el=$(id);if(el&&typeof c[key]==='string')el.textContent=c[key]};
 set('hero-eyebrow','hero_eyebrow');
 set('hero-subtitle','hero_subtitle');
 const name=$('main-title');
 if(name){
  if(typeof c.hero_name_bold==='string'&&name.firstChild)name.firstChild.textContent=c.hero_name_bold;
  if(typeof c.hero_name_light==='string'&&name.querySelector('span'))name.querySelector('span').textContent=c.hero_name_light;
 }
 set('feature-badge','featured_badge');
 set('feature-caption','featured_caption');
 set('logos-caption','logos_caption');
 set('work-kicker-text','work_section_label');
 const work=$('work-title');
 if(work){
  if(typeof c.work_heading_lead==='string'&&work.firstChild)work.firstChild.textContent=c.work_heading_lead+' ';
  if(typeof c.work_heading_tail==='string'&&work.querySelector('em'))work.querySelector('em').textContent=c.work_heading_tail;
 }
 set('about-kicker-text','about_section_label');
 if(typeof c.about_headline==='string'){
  const title=$('about-title');
  if(title){
   title.replaceChildren();
   const lines=c.about_headline.split(/\r?\n/);
   lines.forEach((line,i)=>{if(i)title.append(document.createElement('br'));title.append(document.createTextNode(line))});
  }
 }
 ['bio1','bio2','bio3'].forEach((field,i)=>{
   const p=document.querySelectorAll('.about-copy p')[i];
   if(p&&typeof c[field]==='string')p.textContent=c[field];
 });
 set('contact-kicker-text','contact_section_label');
 const contact=$('contact-headline');
 if(contact&&(typeof c.contact_headline_bold==='string'||typeof c.contact_headline_light==='string')){
   const bold=typeof c.contact_headline_bold==='string'?c.contact_headline_bold:"LET'S MAKE";
   const light=typeof c.contact_headline_light==='string'?c.contact_headline_light:"SOMETHING.";
   const em=document.createElement('em');em.textContent=light;
   contact.replaceChildren(document.createTextNode(bold),document.createElement('br'),em);
 }
 set('contact-intro','contact_intro');
 set('contact-button','contact_button');
 set('footer-tagline','footer_tagline');
}
$('copyright-year').textContent=new Date().getFullYear();
applySiteCopy(siteCopy);
renderFeatured();renderWork();
})();


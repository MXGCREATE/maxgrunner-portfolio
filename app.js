(function(){
'use strict';
const all = Array.isArray(window.MAX_PROJECTS)?window.MAX_PROJECTS:[];
const ordered = all.slice().sort((a,b)=>{
 const ax=Number(a.selected_work_order)||999, bx=Number(b.selected_work_order)||999;
 return ax-bx || a.id-b.id;
});
const featured=all.filter(p=>Number(p.featured_film_order)>0).sort((a,b)=>Number(a.featured_film_order)-Number(b.featured_film_order));
let activeFeature=0, category='commercial', view='grid', screenList=[], screenIndex=0;
const $=id=>document.getElementById(id);
const fmt=n=>String(n).padStart(2,'0');
const categoryLabels={commercial:'Commercial',documentary:'Documentary',culture:'Music & Culture'};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeHttps(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch{return ''}}
function imgSrc(p){const url=p.thumbnail_image_url||'';return (typeof url==='string' && url.startsWith('./assets/thumbnails/'))?url:(safeHttps(url)||p.preview_image_url||'')}
function assignImage(img,p){
 const remote=imgSrc(p),backup=p.preview_image_url||'';
 img.alt='Thumbnail for '+p.title;
 if(!remote){img.style.display='none';return}
 img.onerror=()=>{if(backup && !img.src.endsWith(backup.replace(/^\.\//,''))){img.onerror=()=>{img.style.display='none'};img.src=backup}else{img.style.display='none'}};
 img.onload=()=>{img.style.display='block';if(img.nextElementSibling?.classList.contains('thumb-placeholder'))img.nextElementSibling.classList.add('hidden')};
 img.src=remote;
}
function renderFeatured(){
 if(!featured.length){$('feature-frame').hidden=true;return}
 const p=featured[activeFeature];
 assignImage($('feature-image'),p);
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
 const url=safeHttps(p.vimeo_embed_url);
 if(url && new URL(url).hostname==='player.vimeo.com')return url;
 const yt=safeHttps(p.youtube_url);
 if(yt && (new URL(yt).hostname==='www.youtube.com'||new URL(yt).hostname==='youtube.com'))return 'https://www.youtube-nocookie.com/embed/'+new URL(yt).searchParams.get('v');
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
function openScreen(p,list){screenList=list.slice();screenIndex=screenList.findIndex(x=>x.original_id===p.original_id);if(screenIndex<0){screenList=[p];screenIndex=0}populateScreen();const dialog=$('screening');if(!dialog.open)dialog.showModal();}
function shiftScreen(d){screenIndex=(screenIndex+d+screenList.length)%screenList.length;populateScreen()}
$('feature-play').addEventListener('click',()=>{if(featured.length)openScreen(featured[activeFeature],featured)});
$('feature-next').addEventListener('click',()=>{activeFeature=(activeFeature+1)%featured.length;renderFeatured()});
$('grid-toggle').addEventListener('click',()=>{view='grid';renderWork()});
$('index-toggle').addEventListener('click',()=>{view='index';renderWork()});
$('screening-close').addEventListener('click',()=>$('screening').close());
$('screening-next').addEventListener('click',()=>shiftScreen(1));
$('screening-prev').addEventListener('click',()=>shiftScreen(-1));
$('screening').addEventListener('close',()=>{$('screening-player').replaceChildren()});
$('screening').addEventListener('click',e=>{if(e.target===$('screening'))$('screening').close()});
document.addEventListener('keydown',e=>{if($('screening').open){if(e.key==='ArrowRight')shiftScreen(1);else if(e.key==='ArrowLeft')shiftScreen(-1)}});
$('copyright-year').textContent=new Date().getFullYear();
renderFeatured();renderWork();
})();

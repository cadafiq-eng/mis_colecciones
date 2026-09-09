/* Enhancements keep the existing Supabase account and collection schema. */
let importBusy=false, favoritesOnly=false;
function renderCollections(filter=''){
  const list=document.getElementById('colList');list.replaceChildren();
  const q=CatalogTools.norm(filter);let count=0;
  for(const col of app.collections){
    const all=Array.isArray(col.items)?col.items:[];
    const items=all.filter(i=>(!favoritesOnly||i.favorite)&&(CatalogTools.norm(col.name).includes(q)||CatalogTools.matches(i,q)));
    if((q||favoritesOnly)&&!items.length&&!(!favoritesOnly&&CatalogTools.norm(col.name).includes(q)))continue;
    const card=document.createElement('button');card.className='col-card';card.style.textAlign='left';card.style.color='inherit';
    card.textContent=(col.emoji||'📁')+' '+col.name+' · '+items.length+' elementos';card.onclick=()=>openCol(col.id);list.append(card);count++;
    if(q||favoritesOnly)for(const item of items){
      const row=document.createElement('button');row.className='item-card';row.style.color='inherit';row.style.textAlign='left';
      row.textContent=(item.favorite?'★ ':'')+(item.title||item.content||item.url||'Nota');row.onclick=()=>{openCol(col.id);};list.append(row);
    }
  }
  if(!count){const p=document.createElement('p');p.textContent='No hay resultados.';list.append(p);}
}
function renderItems(col){
  const list=document.getElementById('itemsList');list.replaceChildren();
  (col.items||[]).forEach((item,idx)=>{
    const card=document.createElement('article');card.className='item-card';
    const body=document.createElement('div');body.className='item-body';
    const title=document.createElement('div');title.className='item-title';title.textContent=item.title||item.content||'Sin título';body.append(title);
    const detail=document.createElement('p');detail.className='item-note';detail.textContent=[item.url||item.pageUrl,item.content,item.note,...(item.alternativeNotes||[]),(item.tags||[]).join(' · ')].filter(Boolean).join('\n');detail.style.whiteSpace='pre-wrap';detail.style.overflowWrap='anywhere';body.append(detail);
    const actions=document.createElement('div');actions.className='item-actions';
    const button=(text,fn)=>{const b=document.createElement('button');b.className='item-btn open';b.textContent=text;b.onclick=fn;actions.append(b);return b;};
    if(item.url||item.pageUrl)button('Abrir',()=>openUrl(item.url||item.pageUrl));
    button(item.favorite?'★ Favorito':'☆ Favorito',async()=>{
      const items=col.items.map((v,n)=>n===idx?{...v,favorite:!v.favorite}:v);
      if(await updateCollection(col.id,{items})){col.items=items;renderItems(col);}
    });
    button('Etiquetas',async()=>{
      const text=prompt('Etiquetas separadas por comas',(item.tags||[]).join(', '));if(text===null)return;
      const tags=[...new Set(text.split(',').map(s=>s.trim()).filter(Boolean))];
      const items=col.items.map((v,n)=>n===idx?{...v,tags}:v);
      if(await updateCollection(col.id,{items})){col.items=items;renderItems(col);}
    });
    button('Borrar',()=>deleteItem(idx));card.append(body,actions);list.append(card);
  });
  if(!col.items?.length)list.textContent='Colección vacía.';
}
function openUrl(url){if(!CatalogTools.safeUrl(url)){toast('Enlace no permitido','#e94560');return;}window.open(url,'_blank','noopener,noreferrer');}
async function doImport(file){
  if(importBusy)return;
  importBusy=true;document.getElementById('importBtn').disabled=true;
  let completed=0,added=0;
  try{
    const incoming=CatalogTools.validate(JSON.parse(await file.text()));
    const fresh=await sb.from('collections').select('*').eq('user_id',app.userId);
    if(fresh.error)throw fresh.error;
    app.collections=fresh.data||[];
    if(!confirm('Importar '+incoming.length+' colecciones y fusionar enlaces idénticos por colección? Se descargará primero un respaldo de tus datos actuales.'))return;
    doExport();
    for(const col of incoming){
      const existing=app.collections.find(c=>CatalogTools.norm(c.name)===CatalogTools.norm(col.name));
      const merged=CatalogTools.mergeItems(existing?.items||[],col.items);
      let result;
      if(existing){
        let request=sb.from('collections').update({items:merged.items,updated_at:new Date().toISOString()}).eq('id',existing.id).eq('user_id',app.userId);
        if(existing.updated_at)request=request.eq('updated_at',existing.updated_at);
        result=await request.select();
        if(!result.error&&!result.data?.length)throw Error('La colección cambió en otro dispositivo. Reintenta con los datos actualizados.');
      }else result=await sb.from('collections').insert({user_id:app.userId,name:col.name,emoji:col.emoji||'📁',items:merged.items,description:col.description||''}).select();
      if(result.error)throw result.error;
      if(!result.data?.length)throw Error('No se pudo verificar la colección guardada.');
      const saved=result.data[0],pos=app.collections.findIndex(c=>c.id===saved.id);
      if(pos<0)app.collections.push(saved);else app.collections[pos]=saved;
      completed++;added+=merged.added;
    }
    await loadCollections();alert('Importación terminada: '+completed+' colecciones procesadas; '+added+' elementos nuevos.');
  }catch(e){alert('Importación detenida tras '+completed+' colecciones: '+e.message+'. Lo ya guardado se conserva; puedes reintentar sin repetir enlaces idénticos.');await loadCollections();}
  finally{importBusy=false;document.getElementById('importBtn').disabled=false;document.getElementById('importFile').value='';}
}
document.addEventListener('DOMContentLoaded',()=>{
  const input=document.getElementById('searchInput');input.placeholder='Buscar título, enlace, nota o etiqueta…';
  const b=document.createElement('button');b.className='hbtn';b.textContent='☆ Favoritos';b.setAttribute('aria-pressed','false');
  b.onclick=()=>{favoritesOnly=!favoritesOnly;b.setAttribute('aria-pressed',String(favoritesOnly));b.textContent=favoritesOnly?'★ Solo favoritos':'☆ Favoritos';renderCollections(input.value);};input.parentElement.append(b);
});

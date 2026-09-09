/* Pure helpers shared by the UI and import tests. */
(function(root){
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const safeUrl=s=>{try{return ['http:','https:'].includes(new URL(s).protocol);}catch{return false;}};
  const key=i=>i.url||i.pageUrl ? 'url:'+(i.url||i.pageUrl) : 'text:'+(i.content||i.title||'');
  function matches(item,q){return norm([item.title,item.url,item.pageUrl,item.content,item.note,...(item.tags||[])].join(' ')).includes(norm(q));}
  function validate(data){
    const cols=Array.isArray(data)?data:data.collections;
    if(!Array.isArray(cols)||!cols.length)throw Error('No hay colecciones compatibles en el archivo.');
    return cols.map(c=>{
      if(!c||typeof c.name!=='string'||!c.name.trim()||!Array.isArray(c.items))throw Error('Cada colección necesita nombre e items.');
      c.items.forEach(i=>{
        if(!i||typeof i!=='object')throw Error('Elemento inválido.');
        for(const f of ['title','url','pageUrl','content','note'])if(i[f]!=null&&typeof i[f]!=='string')throw Error('Campo inválido: '+f);
        if((i.url||i.pageUrl)&&!safeUrl(i.url||i.pageUrl))throw Error('Solo se permiten enlaces HTTP o HTTPS.');
        if(i.tags!=null&&(!Array.isArray(i.tags)||i.tags.some(t=>typeof t!=='string')))throw Error('Etiquetas inválidas.');
      });
      return {...c,name:c.name.trim()};
    });
  }
  function mergeItems(existing,incoming){
    const result=existing.map(i=>({...i}));const lookup=new Map(result.map((i,n)=>[key(i),n]));let added=0;
    for(const item of incoming){
      const k=key(item);
      if(!lookup.has(k)){lookup.set(k,result.length);result.push({...item});added++;continue;}
      const old=result[lookup.get(k)];
      old.tags=[...new Set([...(old.tags||[]),...(item.tags||[])])];
      old.origins=[...new Map([...(old.origins||[]),...(item.origins||[])].map(o=>[JSON.stringify(o),o])).values()];
      if(!old.note)old.note=item.note||'';
      else if(item.note&&old.note!==item.note)old.alternativeNotes=[...new Set([...(old.alternativeNotes||[]),item.note])];
      if(!old.title)old.title=item.title;
      old.favorite=!!(old.favorite||item.favorite);
    }
    return {items:result,added};
  }
  root.CatalogTools={norm,safeUrl,key,matches,validate,mergeItems};
})(typeof module==='object'?module.exports:globalThis);

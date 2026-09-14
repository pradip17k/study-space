(function(root){
 function parseStreamLink(value){
  let url;
  try{url=new URL(value.trim());}catch{throw new Error('Paste a complete Spotify or YouTube link.');}
  if(url.protocol!=='https:' || url.username || url.password || url.port)throw new Error('Use a secure https:// Spotify or YouTube link.');
  const host=url.hostname.toLowerCase();
  if(host==='open.spotify.com'){
   const match=url.pathname.match(/^\/(?:intl-[a-zA-Z-]+\/)?(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]{22})\/?$/);
   if(!match)throw new Error('Use a Spotify song, album, playlist, show, or episode link.');
   return {provider:'Spotify',embed:`https://open.spotify.com/embed/${match[1]}/${match[2]}`,original:`https://open.spotify.com/${match[1]}/${match[2]}`};
  }
  if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(host)){
   let video=host==='youtu.be'?url.pathname.slice(1):url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)\/?$/)?.[1];
   const list=url.searchParams.get('list');
   if(video && !/^[A-Za-z0-9_-]{11}$/.test(video))throw new Error('That YouTube video link does not look complete.');
   if(list && !/^[A-Za-z0-9_-]{10,128}$/.test(list))throw new Error('That YouTube playlist link does not look complete.');
   if(!video && (!list || url.pathname!=='/playlist'))throw new Error('Use a YouTube video or playlist link, not a channel or search page.');
   const embed=new URL(`https://www.youtube-nocookie.com/embed/${video || 'videoseries'}`);
   embed.searchParams.set('playsinline','1');
   if(list)embed.searchParams.set('list',list);
   return {provider:'YouTube',embed:embed.href,original:video?`https://www.youtube.com/watch?v=${video}`:`https://www.youtube.com/playlist?list=${list}`};
  }
  throw new Error('Use an open.spotify.com, youtube.com, music.youtube.com, or youtu.be link.');
 }
 if(typeof module==='object' && module.exports)module.exports={parseStreamLink};
 else root.parseStreamLink=parseStreamLink;
})(typeof window==='undefined'?globalThis:window);

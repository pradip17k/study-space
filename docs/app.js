const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let mode = 'timer', duration = 25 * 60, remaining = duration, deadline = 0, running = false, completed = false;
const start = $('#start');
const display = $('#time-display');
const status = $('#session-status');
const minutes = $('#minutes');
const audio = { context: null, master: null, sources: new Map(), muted: false };
function enterFocus() { document.body.classList.add('focused'); $('#exit-focus').hidden = false; start.focus(); }
function leaveFocus() { document.body.classList.remove('focused'); $('#exit-focus').hidden = true; $('#session-name').focus(); }
function updateName() { $('#session-label').textContent = $('#session-name').value.trim() || 'Your focus session'; }
function setDuration(value) {
  if (!Number.isInteger(value) || value < 1 || value > 180) throw new Error('Choose a whole number from 1 to 180 minutes.');
  if (running) throw new Error('Pause the timer before changing its duration.');
  duration = value * 60; remaining = duration; completed = false; document.querySelector('#focus-message').textContent = ''; minutes.value = value;
  minutes.setCustomValidity('');
  $$('[data-minutes]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.minutes) === value)));
  render();
}
function setMode(value) {
  if (!['timer','clock'].includes(value)) throw new Error('Choose timer or clock.');
  if (mode !== value && running) { remaining = Math.max(0,(deadline - Date.now()) / 1000); running = false; }
  mode = value;
  $$('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  document.body.classList.toggle('clock-mode', mode === 'clock');
  $('#duration-settings').hidden = mode === 'clock';
  $('#progress-track').hidden = mode === 'clock';
  $('#reset').hidden = mode === 'clock';
  render();
}
function render() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',hour12:false});
  let text;
  if(mode === 'clock') text = formatter.format(now);
  else {
    const seconds = Math.ceil(remaining);
    text = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  }
  if(display.dataset.value !== text) {
    display.dataset.value = text;
    const parts = text.split(':');
    display.replaceChildren(document.createTextNode(parts[0]), Object.assign(document.createElement('span'),{textContent:':'}), document.createTextNode(parts[1]));
    display.setAttribute('aria-label',mode === 'clock' ? `Current time ${text}` : `${Math.floor(Math.ceil(remaining)/60)} minutes ${Math.ceil(remaining)%60} seconds remaining`);
  }
  $('#clock-detail').textContent = mode === 'clock' ? now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}) : completed ? 'You made time for what matters.' : running ? 'Nothing else needs your attention right now.' : remaining < duration ? 'Take a breath. Continue when you’re ready.' : 'A fresh start, whenever you’re ready.';
  $('#progress').style.width = `${Math.min(100,Math.max(0,(1 - remaining/duration)*100))}%`;
  start.textContent = mode === 'clock' ? '⛶  Enter focus' : running ? 'Ⅱ  Pause' : completed ? '↻  Begin again' : remaining < duration ? '▶  Continue' : '▶  Begin session';
  start.hidden = mode === 'clock' && document.body.classList.contains('focused');
  minutes.disabled = running;
  $$('[data-minutes]').forEach(button => button.disabled = running);
  $('#today').textContent = now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
}
function toggleSession() {
  if (mode === 'clock') { enterFocus(); render(); return; }
  if(running) { remaining = Math.max(0,(deadline-Date.now())/1000); running=false; status.textContent='PAUSED. TAKE YOUR TIME.'; }
  else {
    if (!minutes.checkValidity()) { minutes.reportValidity(); return; }
    if(completed || remaining <= 0){remaining=duration;completed=false;document.querySelector('#focus-message').textContent='';}
    deadline=Date.now()+remaining*1000; running=true;status.textContent='ONE THING AT A TIME.';enterFocus();
  }
  render();
}
function resetTimer() { document.querySelector('#focus-message').textContent=''; running=false;remaining=duration;completed=false;status.textContent='A FRESH START.';render(); }
$('#session-name').addEventListener('input',updateName);
minutes.addEventListener('input',()=>minutes.setCustomValidity(''));
minutes.addEventListener('change',()=>{try{setDuration(Number(minutes.value));}catch(error){minutes.setCustomValidity(error.message);minutes.reportValidity();}});
$$('[data-minutes]').forEach(button=>button.addEventListener('click',()=>setDuration(Number(button.dataset.minutes))));
$$('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$$('button[data-theme]').forEach(button=>button.addEventListener('click',()=>{
 document.documentElement.dataset.theme=button.dataset.theme;
 $$('button[data-theme]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 try{localStorage.setItem('study-space-theme',button.dataset.theme);}catch{}
}));
try { const theme=localStorage.getItem('study-space-theme'); if(['night','warm','light'].includes(theme)) $(`[data-theme="${theme}"]`).click(); } catch {}
start.addEventListener('click',toggleSession);
$('#reset').addEventListener('click',resetTimer);
$('#exit-focus').addEventListener('click',()=>{leaveFocus();render();});
$('#fullscreen').addEventListener('click',async()=>{
 try { if(document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen(); }
 catch {status.textContent='Fullscreen is unavailable in this browser. Focus mode still works.';}
});
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
document.addEventListener('keydown',event=>{if(event.key==='Escape' && document.body.classList.contains('focused')){leaveFocus();render();}});
setInterval(()=>{
 if(running){remaining=Math.max(0,(deadline-Date.now())/1000);if(remaining<=0){running=false;completed=true;status.textContent='SESSION COMPLETE. WELL DONE.';$('#focus-message').textContent='Session complete. Take a little break.';}}
 render();
},250);
function initAudio(){
 if(audio.context) return;
 const AudioContext = window.AudioContext || window.webkitAudioContext;
 if(!AudioContext) throw new Error('Audio is not supported in this browser.');
 audio.context=new AudioContext();audio.master=audio.context.createGain();audio.master.gain.value=audio.muted?0:.45;audio.master.connect(audio.context.destination);
}
function buildSound(kind){
 const ctx=audio.context;const gain=ctx.createGain();gain.gain.value=0;gain.connect(audio.master);
 const nodes=[];const startNodes=[];
 if(kind==='tones'){
  [130.81,196,261.63].forEach((frequency,index)=>{
   const oscillator=ctx.createOscillator();oscillator.type='sine';oscillator.frequency.value=frequency;
   const voice=ctx.createGain();voice.gain.value=.11;
   const lfo=ctx.createOscillator();lfo.frequency.value=.06+index*.015;
   const depth=ctx.createGain();depth.gain.value=.065;lfo.connect(depth).connect(voice.gain);
   oscillator.connect(voice).connect(gain);nodes.push(oscillator,voice,lfo,depth);startNodes.push(oscillator,lfo);
  });
 }else{
  const buffer=ctx.createBuffer(2,ctx.sampleRate*8,ctx.sampleRate);
  for(let channel=0;channel<2;channel++){
   const values=buffer.getChannelData(channel);let last=0;
   for(let index=0;index<values.length;index++){const white=Math.random()*2-1;if(kind==='noise'){last=(last+.02*white)/1.02;values[index]=last*3.5;}else values[index]=white*.65;}
  }
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
  const filter=ctx.createBiquadFilter();filter.type=kind==='rain'?'highpass':'lowpass';filter.frequency.value=kind==='rain'?650:kind==='waves'?800:400;
  source.connect(filter);
  if(kind==='waves'){
   const swell=ctx.createGain();swell.gain.value=.45;
   const lfo=ctx.createOscillator();lfo.frequency.value=.09;
   const depth=ctx.createGain();depth.gain.value=.35;lfo.connect(depth).connect(swell.gain);filter.connect(swell).connect(gain);
   nodes.push(swell,lfo,depth);startNodes.push(lfo);
  }else filter.connect(gain);
  nodes.push(source,filter);startNodes.push(source);
 }
 startNodes.forEach(node=>node.start());
 return {gain,nodes,startNodes};
}
function syncSound(){
 $$('[data-sound]').forEach(button=>{const on=audio.sources.has(button.dataset.sound);button.setAttribute('aria-pressed',String(on));button.querySelector('.sound-toggle').textContent=on?'−':'+';});
 $('#mute').setAttribute('aria-pressed',String(audio.muted));$('#mute').textContent=audio.muted?'♬  Unmute sounds':'♬  Mute all sounds';
 $('#audio-status').textContent=audio.muted?'Sounds muted.':audio.sources.size?`${audio.sources.size} sound${audio.sources.size===1?'':'s'} in your mix.`:'Choose a sound to begin listening.';
}
const pendingSounds=new Set();
async function toggleSound(kind){
 if(pendingSounds.has(kind))return;
 pendingSounds.add(kind);
 try{
  initAudio();await audio.context.resume();
  if(audio.sources.has(kind)){
   const sound=audio.sources.get(kind);audio.sources.delete(kind);
   sound.gain.gain.setTargetAtTime(0,audio.context.currentTime,.07);
   setTimeout(()=>{sound.startNodes.forEach(node=>node.stop());sound.nodes.forEach(node=>node.disconnect());sound.gain.disconnect();},400);
  }else{
   const sound=buildSound(kind);audio.sources.set(kind,sound);
   sound.gain.gain.setTargetAtTime(Number($(`[data-volume="${kind}"]`).value)/100,audio.context.currentTime,.2);
  }
  syncSound();
 }catch(error){$('#audio-status').textContent='Could not start audio. Try the sound again.';}finally{pendingSounds.delete(kind);}
}
$$('[data-sound]').forEach(button=>button.addEventListener('click',()=>toggleSound(button.dataset.sound)));
$$('[data-volume]').forEach(input=>input.addEventListener('input',()=>{const sound=audio.sources.get(input.dataset.volume);if(sound)sound.gain.gain.setTargetAtTime(Number(input.value)/100,audio.context.currentTime,.08);}));
$('#mute').addEventListener('click',()=>{audio.muted=!audio.muted;if(audio.master)audio.master.gain.setTargetAtTime(audio.muted?0:.45,audio.context.currentTime,.1);syncSound();});
window.addEventListener('pagehide',()=>{if(audio.context)audio.context.suspend();});
window.addEventListener('pageshow',()=>{if(audio.context?.state==='suspended' && audio.sources.size)$('#audio-status').textContent='Tap a sound to resume audio.';});
updateName();render();
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 try{Promise.resolve(document.modelContext.registerTool({name:'configure_study_session',title:'Configure study session',description:'Set a session name and timer duration while paused. Does not start the timer or audio.',inputSchema:{type:'object',properties:{name:{type:'string',maxLength:60},minutes:{type:'integer',minimum:1,maximum:180}},required:['name','minutes'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input || typeof input.name!=='string'||input.name.length>60||!Number.isInteger(input.minutes)||input.minutes<1||input.minutes>180||running)throw new Error('Use a name up to 60 characters and 1–180 whole minutes while the timer is paused.');setDuration(input.minutes);$('#session-name').value=input.name;updateName();return {name:input.name,minutes:input.minutes,running};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}


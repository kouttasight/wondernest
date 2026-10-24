/* Licensed acoustic instrumental; independent controls and speech ducking. */
(function(){
'use strict';
const $=id=>document.getElementById(id), audio=$('backgroundMusic');
let enabled=true,volume=.12,started=false,focused=true,failed=false,voiceActive=false;
let context=null,gain=null,connected=false,playPending=false;
try{const saved=JSON.parse(localStorage.getItem('wondernest.music.v1')||'null');if(saved){enabled=!!saved.enabled;volume=Math.max(0,Math.min(.5,Number(saved.volume)||0));}}catch{}
audio.loop=true;
function save(){try{localStorage.setItem('wondernest.music.v1',JSON.stringify({enabled,volume}));}catch{}}
function allowed(){return started&&enabled&&volume>0&&!failed&&focused&&!document.hidden&&!document.querySelector('dialog[open]');}
function level(){return allowed()?volume*(voiceActive?.18:1):0;}
function setLevel(){const value=level();if(gain&&context){gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(value,context.currentTime,voiceActive?.05:.25);}else audio.volume=value;}
function initialize(){
 if(connected)return;
 connected=true;
 try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(AudioCtx){context=new AudioCtx();gain=context.createGain();gain.gain.value=0;context.createMediaElementSource(audio).connect(gain);gain.connect(context.destination);audio.volume=1;}}catch{context=null;gain=null;}
}
function sync(){
 $('musicToggle').setAttribute('aria-pressed',String(enabled));
 $('musicToggle').textContent=enabled?'♫ Music on':'♫ Music off';
 $('musicEnabled').checked=enabled;$('introMusic').checked=enabled;
 $('musicVolume').value=Math.round(volume*100);$('musicVolumeValue').textContent=Math.round(volume*100)+'%';
 setLevel();
 if(!allowed()){audio.pause();return;}
 if(audio.paused&&!playPending){
  playPending=true;
  const resumed=context?.state==='suspended'?context.resume():Promise.resolve();
  Promise.resolve(resumed).then(()=>allowed()?audio.play():undefined).catch(()=>{$('musicNote').textContent='Tap Music to start the background track.';}).finally(()=>{playPending=false;if(!allowed())audio.pause();});
 }
}
function start(){started=true;focused=true;initialize();sync();}
$('storyStart').addEventListener('click',start);
$('musicToggle').addEventListener('click',()=>{enabled=!enabled;save();start();});
for(const id of ['musicEnabled','introMusic'])$(id).addEventListener('change',e=>{enabled=e.target.checked;save();if(started)start();else sync();});
$('musicVolume').addEventListener('input',e=>{volume=Number(e.target.value)/100;save();sync();});
for(const dialog of document.querySelectorAll('dialog')){
 new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('close',sync);
}
for(const event of ['play','pause','ended','error'])document.addEventListener(event,e=>{
 if(e.target.id!=='guideVoice')return;
 voiceActive=event==='play';setLevel();
},true);
audio.addEventListener('error',()=>{failed=true;audio.pause();$('musicNote').textContent='Music is unavailable here. The adventure still works.';});
document.addEventListener('visibilitychange',sync);
window.addEventListener('blur',()=>{focused=false;sync();});
window.addEventListener('focus',()=>{focused=true;sync();});
window.addEventListener('pagehide',()=>{focused=false;audio.pause();});
sync();
})();

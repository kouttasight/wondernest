(function(){
'use strict';
const M=WonderMissions,A=WonderArt,$=id=>document.getElementById(id);
const prefs={amount:2,choices:2,letterLimit:26,numberRange:5,wordLength:'all',words:true,speech:true,tones:false,volume:.35,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
const sessions=new Map();let current,paused=false,held=0,auto=null,jumpAt=0,walkUntil=0,facing=1,lastTime=0,scale=1,view=560,camera=0,blinkAt=0,finishedAt=0,pendingMission=null,taskChanged=false,currentSpoken='',context=null,oscillators=[];
// Pre-generated natural speech only. No browser TTS or electronic feedback tones.
let voicePlayer=null,voiceGeneration=0,audioReady=false;
function quiet(){voiceGeneration++;if(voicePlayer){voicePlayer.onended=null;voicePlayer.onerror=null;voicePlayer.pause();try{voicePlayer.currentTime=0;}catch{}}}
function playVoice(keys,allowStory=false){
 quiet();if(!audioReady||!prefs.speech||prefs.volume===0||(paused&&!(allowStory&&($('storyDialog').open||$('learningMenu').open))))return;
 const queue=keys.filter(k=>WonderVoice[k]).slice(0,3),generation=voiceGeneration;
 function next(){
  if(generation!==voiceGeneration||!prefs.speech||prefs.volume===0||(paused&&!(allowStory&&($('storyDialog').open||$('learningMenu').open))))return;
  const key=queue.shift();if(!key)return;
  if(!voicePlayer){voicePlayer=document.createElement('audio');voicePlayer.id='guideVoice';voicePlayer.hidden=true;voicePlayer.preload='auto';document.body.append(voicePlayer);}
  voicePlayer.dataset.clip=key;voicePlayer.src=WonderVoice[key].src;voicePlayer.volume=prefs.volume;
  voicePlayer.onended=next;
  voicePlayer.onerror=()=>{if(generation!==voiceGeneration)return;quiet();$('audioNote').textContent='Voice could not play here. Pictures and tasks still work.';};
  try{const playing=voicePlayer.play();playing?.catch?.(e=>{if(generation!==voiceGeneration||e.name==='AbortError')return;quiet();$('audioNote').textContent='Tap Hear to start the guide voice. Picture play still works.';});}catch{quiet();$('audioNote').textContent='Voice unavailable here. Picture play still works.';}
 }
 next();
}
function taskVoiceKeys(){
 const s=current.s;
 if(M.extraIds.includes(s.id))return learningVoiceKeys(s);
 if(s.done)return s.id==='words'?['word'+s.word.toLowerCase(),'complete']:s.id==='letters'&&chapters.every(id=>sessions.get(id)?.s.done)?['finish']:['complete'];
 if(s.id==='orchard')return s.picks.length<s.options.amount?['orchard']:!s.opened?['give']:['help'];
 if(s.id==='grow')return !s.opened?['colour'+M.colours[s.targetColour][0],'match']:s.phase==='plant'?['plant']:s.phase==='can'?['can']:s.phase==='water'?['pour']:s.phase==='pick'?['flower']:['give'];
 if(s.id==='water')return !s.opened?['bucket']:s.phase==='pick'?['flower']:s.phase==='give'?['give']:s.water<s.options.amount?['pump']:['pour'];
 if(s.id==='sort')return s.delivered.length===s.options.choices?['help']:s.carry?['colour'+M.colours[s.carry.colour][0],'match']:['pick'];
 if(s.id==='bridge')return s.placed.length===s.options.choices?['cross']:['shape'+M.shapeNames[s.carry?s.carry.shape:(s.variant+s.placed.length)%6],s.carry?'fit':'match'];
 if(s.id==='trail')return s.sequence<s.options.choices?['colour'+M.colours[(s.targetColour+s.sequence)%6][0],'follow']:!s.opened?['open']:['help'];
 if(s.id==='picnic')return !s.opened?['open']:s.picks.length<2?['carrots']:s.delivered.length<2?['plates']:['bell'];
 if(s.id==='letters')return s.placed.length===s.letters.length?['open']:s.carry?['letter'+s.carry.letter,'post']:['lettersPick'];
 return s.step===s.word.length?['word'+s.word.toLowerCase(),'wordUse']:s.carry?['wordFit']:['letter'+s.word[s.step],'wordPick'];
}
function actionVoice(id,result,before){
 if(result.done){playVoice(taskVoiceKeys());return;}
 const numbers=M.numberNames.slice(1).map(n=>n+'.'),i=numbers.indexOf(result.said);
 if(i>=0){playVoice(['count'+(i+1),...(before!==M.objective(current.s).label?taskVoiceKeys():[])]);return;}
 if(id==='bimi'){playVoice(['complete']);return;}
 if(current.s.id==='letters'&&id.startsWith('letter')){playVoice(['letter'+current.s.carry.letter,'post']);return;}
 if(current.s.id==='words'&&id==='block0'){playVoice(['letter'+current.s.carry.letter,'wordFit']);return;}
 playVoice(taskVoiceKeys());
}
function tone(){}
function feedback(text){$('feedback').textContent=text;}
function objectiveSpeech(){const s=current.s,o=M.objective(s);if(s.id==='words'&&!s.done&&!s.carry&&s.step<s.word.length)return 'Find letter '+M.letterNames[M.alphabet.indexOf(s.word[s.step])]+' for '+s.word.toLowerCase()+'.';if(s.id==='letters'&&s.carry)return 'Post '+M.letterNames[M.alphabet.indexOf(s.carry.letter)]+' in the matching box.';return o.label;}
function syncAudio(){const on=prefs.speech;$('soundToggle').disabled=false;$('soundToggle').setAttribute('aria-pressed',String(on));$('soundToggle').textContent=on?'♫ On':'♫ Off';$('hear').disabled=false;$('speech').checked=on;$('introSound').checked=on;$('volume').value=Math.round(prefs.volume*100);$('volumeValue').textContent=Math.round(prefs.volume*100)+'%';}
const chapters=['orchard','water','grow','sort','bridge','trail','picnic','letters'];
const story={
 orchard:['Apples for our picnic','Bimi is planning a garden picnic. First, Nori can gather apples and bring them to Bimi.','The apples are ready, and the picnic cloth is out. Next, the garden needs a drink.'],
 water:['A drink for the garden','Bimi would love flowers at the picnic. Take the bucket, fill it at the pump, and water the thirsty garden.','The thirsty flower has a drink. Now we can grow flowers for our picnic.'],
 grow:['Flowers for our friends','Nori and Bimi want flowers for the picnic. Choose the pictured seeds, plant them, water them, and share the flowers.','Our flowers have grown. Let’s put some flowers in coloured baskets.'],
 sort:['Decorate the picnic','Bimi has colourful baskets for the flowers. Carry each flower to the basket with the same colour.','The flower baskets are ready. Now we need a path across the stream.'],
 bridge:['A way across','The picnic meadow is across the stream. Nori can find the pictured shapes, fit the bridge pieces, and walk across.','Our bridge is ready. Bimi has left a colour trail to the picnic gate.'],
 trail:['Bimi’s colour trail','Bimi left a picture trail to help Nori find the gate. Follow each pictured colour, open the gate, and walk through.','The gate is open. It’s time to prepare the picnic for our two friends.'],
 picnic:['A place for each friend','Nori and Bimi are ready for a picnic. Open the hamper, collect two carrots, put one on each plate, and ring the bell.','One for Nori, one for Bimi. What a lovely picnic! Bimi has a thank-you surprise in Letterwood.'],
 letters:['A thank-you from Bimi','Bimi has written a little thank-you. Match the letters to the postboxes, then open Bimi’s envelope.','Thank you for helping! The apples, flowers, bridge and picnic are ready. Our garden picnic story is complete.'],
 words:['An extra word adventure','After the picnic, we can play with words. Copy the pictured word with letter blocks, then use what it makes.','You made a word and used it. You can try another word or return to our picnic story.']
};
Object.assign(story,{
 alphapicture:['Bimi’s alphabet book','Bimi is making a picture book for the picnic. Find the pictured letter, collect its picture, post it in the lowercase box, and bring the page to Bimi.','A new page for Bimi’s alphabet book! Choose another letter or another adventure.'],
 abcorder:['An alphabet garden path','Bimi needs letter signs on the garden path. Collect each pictured letter, put the letters in order, and open the gate.','The alphabet path is ready. Try a different group of letters whenever you like.'],
 numbermatch:['Counted picnic baskets','Bimi needs counted baskets for the picnic. Take the pictured number, match a basket with that many apples, and bring it to Bimi.','The counted basket is ready for Bimi. Choose another number or explore.'],
 numbertrail:['A trail to the picnic','Bimi has left number stepping stones along the path. Follow the pictured numbers in order, then open the picnic gate.','You followed the number trail and opened the way to the picnic.'],
 pack:['A basket for Bimi','Bimi has a number on the picnic basket. Carry apples one at a time, count them into the basket, then bring the full basket to Bimi.','The basket has just the pictured amount. Bimi says thank you!']
});
function learningVoiceKeys(s){
 if(s.done)return ['complete'];
 if(s.id==='alphapicture')return s.phase==='letter'?['letter'+s.focus,'lettersPick']:s.phase==='picture'?['vocab'+s.focus,'match']:s.phase==='post'?['letter'+s.focus,'post']:['give'];
 if(s.id==='abcorder')return s.step<3?['letter'+s.route[s.step],s.carry?'abcorder':'lettersPick']:!s.opened?['open']:['help'];
 if(s.id==='numbermatch')return s.opened?['give']:['count'+s.number,'match'];
 if(s.id==='numbertrail')return s.sequence<3?['count'+s.numberRoute[s.sequence],'numbertrail']:!s.opened?['open']:['help'];
 return s.packed===s.number?['give']:s.carry?['pack']:['pick'];
}
const sharedLearning={letters:new Set(),numbers:new Set(),words:new Set()};
let learningTab='alphabet',learningLetter='A',learningNumber=1,learningWord='UP';
function openLearning(tab='alphabet'){if(paused)return;stopMovement();quiet();paused=true;learningTab=tab;renderLearning();$('learningMenu').showModal();}
function renderLearning(){
 for(const b of document.querySelectorAll('[data-learning-tab]'))b.setAttribute('aria-pressed',String(b.dataset.learningTab===learningTab));
 for(const tab of ['alphabet','numbers','words'])$('learn-'+tab).hidden=tab!==learningTab;
 $('alphabetPicker').innerHTML=M.alphabet.split('').map(l=>`<button class="picker ${l===learningLetter?'selected':''} ${sharedLearning.letters.has(l)?'learned':''}" data-letter="${l}" aria-pressed="${l===learningLetter}">${l}<small>${l.toLowerCase()}</small></button>`).join('');
 for(const b of $('alphabetPicker').querySelectorAll('[data-letter]'))b.onclick=()=>{learningLetter=b.dataset.letter;renderLearning();};
 $('selectedLetter').textContent=learningLetter+' '+learningLetter.toLowerCase();$('letterWord').textContent=M.vocabulary[M.alphabet.indexOf(learningLetter)];$('letterPicture').innerHTML=A.icon('vocab',{word:M.vocabulary[M.alphabet.indexOf(learningLetter)]});
 $('letterExampleNote').textContent=learningLetter==='X'?'X is at the end of box.':'Find '+learningLetter+' at the start of '+M.vocabulary[M.alphabet.indexOf(learningLetter)]+'.';
 $('numberPicker').innerHTML=Array.from({length:prefs.numberRange},(_,i)=>`<button class="picker ${i+1===learningNumber?'selected':''} ${sharedLearning.numbers.has(i+1)?'learned':''}" data-number="${i+1}" aria-pressed="${i+1===learningNumber}">${i+1}</button>`).join('');
 for(const b of $('numberPicker').querySelectorAll('[data-number]'))b.onclick=()=>{learningNumber=Number(b.dataset.number);renderLearning();};
 $('selectedNumber').textContent=learningNumber;$('numberExample').innerHTML=A.icon('countbasket',{number:learningNumber});$('rangeToggle').textContent=prefs.numberRange===5?'Show numbers 1–10':'Use numbers 1–5';
 $('wordPicker').innerHTML=M.wordBank.map(w=>`<button class="word-picker ${w===learningWord?'selected':''} ${sharedLearning.words.has(w)?'learned':''}" data-word="${w}" aria-pressed="${w===learningWord}"><span>${A.icon('reveal',{word:w,filled:true})}</span><strong>${w}</strong></button>`).join('');
 for(const b of $('wordPicker').querySelectorAll('[data-word]'))b.onclick=()=>{learningWord=b.dataset.word;renderLearning();};
 $('selectedWord').textContent=learningWord;
}
function startLearning(id,variant){$('learningMenu').addEventListener('close',()=>{prefs.words=true;$('wordPlay').checked=true;loadMission(id,true,variant);},{once:true});$('learningMenu').close();}
function renderLearningHint(){
 const s=current.s;
 if(s.done){if(s.id==='alphapicture')sharedLearning.letters.add(s.focus);if(s.id==='abcorder')s.route.forEach(l=>sharedLearning.letters.add(l));if(s.id==='letters')s.letters.forEach(l=>sharedLearning.letters.add(l));if(s.id==='numbermatch'||s.id==='pack')sharedLearning.numbers.add(s.number);if(s.id==='numbertrail')s.numberRoute.forEach(n=>sharedLearning.numbers.add(n));if(s.id==='words')sharedLearning.words.add(s.word);}
 const letter=s.id==='alphapicture'?s.focus:s.id==='abcorder'?s.route[Math.min(s.step,2)]:s.id==='letters'?(s.carry?.letter||s.letters.find((_,i)=>!s.placed.includes(i))||s.letters[0]):null;
 $('learningHint').hidden=!letter&&s.id!=='words';
 if(letter){$('learningModel').textContent=letter+' '+letter.toLowerCase();$('nameHear').hidden=false;$('nameHear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['letter'+letter]);};$('wordHear').textContent='Hear picture word';$('wordHear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['vocab'+letter]);};$('learningExample').textContent=letter==='X'?'X at the end of box':M.vocabulary[M.alphabet.indexOf(letter)];}
 else if(s.id==='words'){$('learningModel').textContent=s.word;$('learningExample').textContent='Copy the letters, then use the word.';$('nameHear').hidden=true;$('wordHear').textContent='Hear word';$('wordHear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['word'+s.word.toLowerCase()]);};}
}
function storyMessage(){if(current.s.id==='letters'&&current.s.done&&!chapters.every(id=>sessions.get(id)?.s.done))return 'Thank you for delivering the letters! There are more picnic chapters to explore whenever you like.';return story[current.s.id][current.s.done?2:1];}
function renderStory(){
 const id=current.s.id,i=chapters.indexOf(id),entry=story[id];
 $('chapterLabel').textContent=i<0?'An optional extra':`Chapter ${i+1} · Bimi’s garden picnic`;
 $('storyLine').textContent=storyMessage();
 $('nextChapter').hidden=!current.s.done;
 $('nextChapter').textContent=i===7?'Visit our picnic →':i<0?'Back to our story →':'Next chapter →';
 $('storyKeepsakes').innerHTML=chapters.map((id,n)=>{const m=M.catalogue.find(x=>x.id===id),done=sessions.get(id)?.s.done;return `<button type="button" data-chapter="${id}" class="keepsake ${done?'saved':''} ${id===current.s.id?'here':''}" aria-label="Chapter ${n+1}: ${m.name}${done?', completed':''}" ${id===current.s.id?'aria-current="step"':''}><span aria-hidden="true">${A.icon(m.icon)}</span><small>${done?'✓':n+1}</small></button>`;}).join('');
 for(const b of $('storyKeepsakes').querySelectorAll('[data-chapter]'))b.onclick=()=>{if(!paused)loadMission(b.dataset.chapter);};
}
function showStory(){if(paused)return;stopMovement();quiet();paused=true;const entry=story[current.s.id];$('storyHeading').textContent=entry[0];$('storyText').textContent=storyMessage();$('storyDialog').showModal();if(audioReady)playVoice([current.s.done?'complete':current.s.id],true);}
function options(){return {amount:prefs.amount,choices:prefs.choices,letterLimit:prefs.letterLimit,wordLength:prefs.wordLength,numberRange:prefs.numberRange};}
function makeSession(id,variant=0){return {s:M.create(id,options(),variant),x:M.catalogue.find(m=>m.id===id).start,signature:JSON.stringify(options())};}
function stopMovement(){held=0;auto=null;walkUntil=0;jumpAt=0;$('nori').style.translate='';$('heldItem').style.translate='';$('effects').innerHTML='';}
function loadMission(id,force=false,variant=0){if(id==='words'&&!prefs.words)id='letters';stopMovement();quiet();if(force||!sessions.has(id)||sessions.get(id).signature!==JSON.stringify(options()))sessions.set(id,makeSession(id,variant));current=sessions.get(id);facing=1;finishedAt=current.s.done?performance.now():0;$('missionTitle').textContent=M.meta(current.s).name;$('missionDescription').textContent=M.meta(current.s).description;render();layout();feedback(objectiveSpeech());if(audioReady)playVoice([id]);}
function drawObjects(){
 $('objects').innerHTML='';
 for(const o of M.objects(current.s)){
  if(o.kind==='bimi'&&(!o.enabled||current.s.done))continue;
  if(current.s.done&&['cross','through','use','surprise','bell'].includes(o.id))continue;
  const b=document.createElement('button');b.type='button';b.className='world-object'+(o.goal?' goal':'')+(o.filled?' filled':'')+(o.kind==='bimi'?' friend-cue':'')+(current.s.done?' completed-object':'');b.dataset.object=o.id;b.dataset.goal=String(o.goal);b.setAttribute('aria-label',o.label);b.innerHTML=`<span class="object-picture">${A.icon(o.kind,o)}</span><span class="object-label">${o.label}</span>`;b.style.left=(o.x*scale)+'px';b.style.bottom=((o.kind==='bimi'?185:62)*scale)+'px';b.style.width=Math.max(48,85*scale)+'px';b.style.setProperty('--picture',Math.max(35,66*scale)+'px');b.disabled=!o.enabled||current.s.done;b.onclick=()=>walkTo(o.id,true);$('objects').append(b);
 }
}
function resultDecor(){const s=current.s;let html='';
 const place=(x,kind,data={},cls='')=>`<span class="world-result ${cls}" style="left:${x*scale}px;bottom:${62*scale}px;width:${Math.max(40,75*scale)}px">${A.icon(kind,data)}</span>`;
 if(s.id==='bridge')for(const i of s.placed)html+=`<span class="bridge-plank" style="left:${(2480+i*(320/s.options.choices))*scale}px;bottom:${45*scale}px;width:${(320/s.options.choices+3)*scale}px;height:${25*scale}px"></span>`;
 if(s.id==='orchard'&&s.opened){for(let i=0;i<s.options.amount;i++)html+=place(770+i*24,'apple',{},'small-result');if(s.done)html+=place(710,'picnic');}
 if(s.id==='grow'&&s.done)html+=place(1780,'flower',{colour:s.targetColour});
 if(s.id==='water'&&s.done)html+=place(1780,'flower',{colour:s.targetColour});
 if(s.id==='sort')for(const i of s.delivered)html+=place(1600+i*115,'flower',{colour:(s.targetColour+i)%6},'small-result');
 if(s.id==='picnic'&&s.done)html+=place(3650,'picnic');
 if(s.id==='bridge'&&s.done)html+=place(2970,'flag');
 if(s.id==='trail'&&s.done)html+=place(2920,'flag');
 if(s.id==='letters'&&s.done)html+=place(4770,'heart');
 if(s.id==='words'){html+=`<div class="word-bench" style="left:${4500*scale}px;bottom:${145*scale}px"><span class="bench-model">${s.word}</span><span class="bench-slots">${s.word.split('').map((l,i)=>`<span class="${i<s.step?'placed':''}">${l}</span>`).join('')}</span></div>`;if(s.done)html+=place(4780,'reveal',{word:s.word,filled:true});}
 if(s.id==='alphapicture'&&s.done)html+=place(4750,'letter',{letter:s.focus,lower:s.focus.toLowerCase()});
 if(s.id==='abcorder'){html+=`<div class="word-bench" style="left:${4500*scale}px;bottom:${145*scale}px"><span class="bench-model">${s.route.join(' ')}</span><span class="bench-slots">${s.route.map((l,i)=>`<span class="${i<s.step?'placed':''}">${l.toLowerCase()}</span>`).join('')}</span></div>`;if(s.opened)html+=place(4740,'gate',{open:true});}
 if(s.id==='numbermatch'&&s.done)html+=place(1760,'countbasket',{number:s.number});
 if(s.id==='pack'&&s.done)html+=place(750,'countbasket',{number:s.number});
 if(s.id==='numbertrail'&&s.opened)html+=place(2700,'gate',{open:true});
 $('results').innerHTML=html;
}
function render(){
 const s=current.s,obj=M.objective(s);$('adventure').dataset.mission=s.id;$('adventure').dataset.done=String(s.done);$('adventure').dataset.phase=s.phase;
 $('objective').textContent=obj.label;$('objectivePictures').innerHTML=obj.tokens.map(t=>`<span class="token ${t.filled?'token-filled':''}">${A.icon(t.kind,t)}</span>`).join('');
 $('steps').innerHTML=M.meta(s).steps.map((label,i)=>`<span class="step ${i<obj.step?'complete':i===obj.step?'current':''}"><i>${i<obj.step?'✓':i+1}</i><span>${label}</span></span>`).join('');
 currentSpoken=objectiveSpeech();$('doneNote').hidden=!s.done;$('doneNote').textContent=s.done?'Stay and explore, repeat this adventure, or choose another place.':'';
 let item=s.carry;if(!item&&s.inventory)item={kind:s.id==='orchard'?'apple':s.id==='picnic'?'carrot':'flower',colour:s.targetColour};
 $('inventory').innerHTML=item?A.icon(item.kind,{...item,amount:s.water,total:s.options.amount})+`<span>${s.inventory>1?s.inventory+' × ':''}${({apple:'Apples',carrot:'Carrots',seed:'Seeds',can:'Watering can',bucket:`Water ${s.water}/${s.options.amount}`,flower:'Flower',shape:M.shapeNames[item.shape],letter:item.letter,vocab:item.word,number:String(item.number),countbasket:(item.number||'')+' apples'})[item.kind]||'Carrying'}</span>`:'<span class="empty-paws">Ready to explore</span>';
 $('heldItem').innerHTML=item?A.icon(item.kind,{...item,amount:s.water,total:s.options.amount}):'';
 $('friend').style.left=M.meta(s).friend*scale+'px';
 drawObjects();resultDecor();updatePosition();renderStory();renderLearningHint();
}
function layout(){const width=$('stage').clientWidth;view=width<600?560:1000;scale=width/view;$('stage').style.height=(440*scale)+'px';$('world').style.width=(5000*scale)+'px';$('world').style.height=(440*scale)+'px';$('nori').style.width=(165*scale)+'px';$('nori').style.bottom=(54*scale)+'px';$('friend').style.width=(125*scale)+'px';$('friend').style.bottom=(54*scale)+'px';if(current){drawObjects();resultDecor();$('friend').style.left=M.meta(current.s).friend*scale+'px';updatePosition();}}
function primary(){const targets=M.objects(current.s).filter(o=>o.goal&&o.enabled);return targets.sort((a,b)=>Math.abs(a.x-current.x)-Math.abs(b.x-current.x))[0];}
function nearFriend(o){return Math.abs(o.x-M.meta(current.s).friend)<135;}
function reach(o){if(['cross','through'].includes(o.id))return 90;return nearFriend(o)?195:115;}
function shortAction(o){if(!o)return 'Explore';if(o.id==='packbasket')return 'Pack';if(o.id==='orderslot')return 'Place';if(o.id.startsWith('quantity'))return 'Match';if(o.id.startsWith('letterbox'))return 'Post';if(o.id==='abcgate'||o.id==='numbergate')return 'Open';if(o.id.startsWith('stone'))return 'Step';if(o.id.startsWith('pump'))return 'Pump';if(o.kind==='bimi')return 'Give';if(o.id==='through'||o.id==='cross')return 'Go';if(o.id==='wordslot')return 'Place';if(o.id.startsWith('postbox'))return 'Post';if(o.kind==='basket'&&current.s.id==='sort')return 'Put in';if(o.kind==='socket')return 'Fit';if(o.id.startsWith('plate'))return 'Give one';if(o.id==='can'||o.id==='bucket')return 'Take';if(o.id==='gate'||o.id==='hamper'||o.id==='surprise')return 'Open';if(o.id==='bell')return 'Ring';if(o.id==='thirsty')return current.s.phase==='pick'?'Pick':'Pour';if(o.id.startsWith('bed'))return current.s.phase==='plant'?'Plant':current.s.phase==='water'?'Water':'Pick';if(o.id==='use')return 'Use';if(o.id==='cloth')return 'Put out';return 'Pick up';}
function updatePosition(){if(!current)return;camera=Math.max(0,Math.min(5000-view,current.x-view*.34));$('world').style.transform=`translateX(${-camera*scale}px)`;$('nori').style.left=current.x*scale+'px';$('nori').classList.toggle('facing-left',facing<0);
 const i=Math.max(0,Math.min(4,Math.floor(current.x/1000)));$('placeName').textContent=['Orchard','Garden','Workshop','Picnic','Letterwood'][i];$('pathPosition').style.left=(current.x/5000*100)+'%';
 const o=primary();$('action').disabled=paused;if(current.s.done){$('actionIcon').innerHTML=A.icon('flag');$('actionLabel').textContent='Explore';$('action').setAttribute('aria-label','Explore after finishing this chapter');}else if(o){$('actionIcon').innerHTML=A.icon(o.kind,o);const near=Math.abs(o.x-current.x)<=reach(o);$('actionLabel').textContent=near?shortAction(o):'Go';$('action').setAttribute('aria-label',near?o.label:'Go to '+o.label.toLowerCase());}
}
function clampPosition(x){let limit=4910;if(current.s.id==='bridge'&&!current.s.done&&current.s.placed.length<current.s.options.choices)limit=2480+current.s.placed.length*(320/current.s.options.choices);return Math.max(90,Math.min(limit,x));}
function move(amount){if(paused)return;const next=clampPosition(current.x+amount);facing=amount<0?-1:1;if(next!==current.x){current.x=next;walkUntil=performance.now()+200;}updatePosition();}
function perform(id){if(paused)return;auto=null;held=0;const phaseBefore=current.s.phase;const objectBefore=M.objects(current.s).find(o=>o.id===id);const before=M.objective(current.s).label;const result=M.act(current.s,id);if(result.changed){if(!prefs.reduced&&objectBefore&&((id.startsWith('bed')&&phaseBefore==='water')||(id==='thirsty'&&phaseBefore==='pour'))){const e=document.createElement('span');e.className='water-effect';e.style.left=objectBefore.x*scale+'px';e.style.bottom=145*scale+'px';e.innerHTML='<svg viewBox="0 0 60 70" aria-hidden="true"><path d="M12 3Q-4 25 12 26Q28 25 12 3M43 18Q27 40 43 41Q59 40 43 18M24 43Q8 65 24 66Q40 65 24 43" fill="#81b7c6"/></svg>';$('effects').append(e);setTimeout(()=>e.remove(),450);}if(result.done)finishedAt=performance.now();render();tone();const after=M.objective(current.s).label;feedback(result.done?(current.s.id==='words'?current.s.word.toLowerCase()+'. You made it.':after):result.said+(before!==after?' '+objectiveSpeech():''));actionVoice(id,result,before);}else feedback(result.said);}
function walkTo(id,performOnArrival=false){if(paused)return;const o=M.objects(current.s).find(o=>o.id===id);if(!o||!o.enabled)return;held=0;const dest=clampPosition(nearFriend(o)?M.meta(current.s).friend-175:o.x-82);if(prefs.reduced){current.x=dest;facing=1;updatePosition();if(performOnArrival)perform(id);return;}auto={id,x:dest,perform:performOnArrival};if(Math.abs(dest-current.x)<3){auto=null;if(performOnArrival)perform(id);}}
function help(){if(paused)return;const o=primary();if(!o){feedback('We can explore or choose another adventure.');return;}document.querySelectorAll('.world-object').forEach(b=>b.classList.toggle('hinted',b.dataset.object===o.id));feedback('Let’s go together. '+o.label+'.');playVoice(['help']);walkTo(o.id,false);}
function openMap(){if(paused)return;stopMovement();quiet();paused=true;renderMap();$('map').showModal();}
function renderMap(){$('mapLearning').onclick=()=>{$('map').addEventListener('close',()=>openLearning(),{once:true});$('map').close();};const groups=['Orchard','Garden','Workshop','Picnic','Letterwood'];$('mapOverview').innerHTML=groups.map((g,i)=>`<button data-place="${g}" aria-label="Show ${g} adventures"><span>${A.icon(['apple','flower','bridge','picnic','letter'][i])}</span><small>${g}</small></button>`).join('');for(const b of $('mapOverview').querySelectorAll('[data-place]'))b.onclick=()=>{$('map').scrollTo({top:$('place-'+b.dataset.place).offsetTop-15,behavior:'auto'});};$('mapChoices').innerHTML=groups.map(group=>`<section class="map-place" id="place-${group}"><h3>${group}</h3><div class="map-grid">${M.catalogue.filter(m=>m.place===group&&(!m.optional||prefs.words)).map(m=>{const v=sessions.get(m.id);return `<button class="mission-card" data-mission="${m.id}"><span class="map-icon">${A.icon(m.icon)}</span><span><strong>${m.name}</strong><small>${v?(v.s.done?'Visit / play again':'Continue exploring'):m.description}</small></span></button>`;}).join('')}</div></section>`).join('');for(const b of $('mapChoices').querySelectorAll('[data-mission]'))b.onclick=()=>{pendingMission=b.dataset.mission;$('map').close();};}
function pause(kind){if(paused)return;stopMovement();quiet();paused=true;$('pauseTitle').textContent=kind==='stop'?'Stopped.':'A little rest.';$('pauseText').textContent='Your adventure is safe. Nori and Bimi can wait.';$('pause').showModal();updatePosition();}
function resume(){stopMovement();paused=false;quiet();updatePosition();}
for(const [id,dir] of [['left',-1],['right',1]]){const b=$(id);b.onpointerdown=e=>{if(paused)return;e.preventDefault();auto=null;b.setPointerCapture(e.pointerId);held=dir;move(dir*12);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{held=0;};b.onclick=e=>{if(e.detail===0){auto=null;move(dir*30);}};}
$('jump').onclick=()=>{if(!paused)jumpAt=performance.now();};$('action').onclick=()=>{if(paused)return;if(current.s.done){feedback('Explore with the arrows, choose Next chapter, or play again.');return;}const o=primary();if(!o)return;if(Math.abs(o.x-current.x)<=reach(o))perform(o.id);else walkTo(o.id,false);};
$('mapOpen').onclick=openMap;$('more').onclick=openMap;$('mapClose').onclick=()=>$('map').close();$('map').onclose=()=>{paused=false;if(pendingMission){const id=pendingMission;pendingMission=null;loadMission(id);}else resume();};
$('again').onclick=()=>{if(!paused)loadMission(current.s.id,true,current.s.done?current.s.variant+1:current.s.variant);};$('help').onclick=help;$('stop').onclick=()=>pause('stop');$('break').onclick=()=>pause('break');$('resume').onclick=()=>$('pause').close();$('pause').onclose=resume;
$('settingsOpen').onclick=()=>{if(paused)return;stopMovement();quiet();paused=true;$('settings').showModal();};$('settingsClose').onclick=()=>$('settings').close();$('settings').onclose=()=>{resume();if(taskChanged){taskChanged=false;const id=current.s.id==='words'&&!prefs.words?'letters':current.s.id;loadMission(id,true,current.s.variant);}else if(current.s.id==='words'&&!prefs.words)loadMission('letters');};
$('reduced').checked=prefs.reduced;$('reduced').onchange=e=>{prefs.reduced=e.target.checked;};for(const [id,key] of [['amount','amount'],['choices','choices'],['letterSet','letterLimit']])$(id).onchange=e=>{prefs[key]=Number(e.target.value);taskChanged=true;};$('wordLength').onchange=e=>{prefs.wordLength=e.target.value;taskChanged=true;};$('wordPlay').onchange=e=>{prefs.words=e.target.checked;};
$('storyOpen').onclick=showStory;
$('storyStart').onclick=()=>{audioReady=true;prefs.speech=$('introSound').checked;syncAudio();$('storyDialog').close();};
$('storyDialog').onclose=()=>{resume();if(audioReady)playVoice([current.s.id]);};
$('soundToggle').onclick=()=>{audioReady=true;prefs.speech=!prefs.speech;quiet();syncAudio();if(prefs.speech)playVoice(taskVoiceKeys());};
$('hear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(taskVoiceKeys());};
$('speech').onchange=e=>{prefs.speech=e.target.checked;audioReady=true;quiet();syncAudio();};
$('volume').oninput=e=>{prefs.volume=Number(e.target.value)/100;$('volumeValue').textContent=e.target.value+'%';if(voicePlayer)voicePlayer.volume=prefs.volume;if(prefs.volume===0)quiet();};
$('introSound').onchange=e=>{prefs.speech=e.target.checked;if(!prefs.speech)quiet();syncAudio();};
$('nextChapter').onclick=()=>{if(paused)return;const i=chapters.indexOf(current.s.id);loadMission(i===7?'picnic':i<0?'orchard':chapters[i+1]);};
$('videosOpen').onclick=()=>{if(paused)return;stopMovement();quiet();paused=true;$('videoChoices').hidden=true;$('videoGate').hidden=false;$('videos').showModal();};
$('videoUnlock').onclick=()=>{$('videoGate').hidden=true;$('videoChoices').hidden=false;$('youtubeLink').focus();};
$('videosClose').onclick=()=>$('videos').close();$('videos').onclose=resume;
for(const b of document.querySelectorAll('[data-learning-open]'))b.onclick=()=>openLearning(b.dataset.learningOpen);
for(const b of document.querySelectorAll('[data-learning-tab]'))b.onclick=()=>{quiet();learningTab=b.dataset.learningTab;renderLearning();};
$('learningClose').onclick=()=>$('learningMenu').close();$('learningMenu').onclose=resume;
$('alphabetName').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['letter'+learningLetter],true);};
$('alphabetWord').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['vocab'+learningLetter],true);};
$('numberHear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['count'+learningNumber],true);};
$('selectedWordHear').onclick=()=>{audioReady=true;prefs.speech=true;syncAudio();playVoice(['word'+learningWord.toLowerCase()],true);};
for(const b of document.querySelectorAll('[data-letter-mission]'))b.onclick=()=>startLearning(b.dataset.letterMission,M.alphabet.indexOf(learningLetter));
for(const b of document.querySelectorAll('[data-number-mission]'))b.onclick=()=>startLearning(b.dataset.numberMission,learningNumber-1);
$('rangeToggle').onclick=()=>{prefs.numberRange=prefs.numberRange===5?10:5;learningNumber=Math.min(learningNumber,prefs.numberRange);$('numberRange').value=prefs.numberRange;renderLearning();};
$('numberRange').onchange=e=>{prefs.numberRange=Number(e.target.value);taskChanged=true;};
$('wordMission').onclick=()=>{prefs.wordLength='all';$('wordLength').value='all';startLearning('words',M.wordBank.indexOf(learningWord));};
document.addEventListener('keydown',e=>{if(paused||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key===' '&&/BUTTON|A/.test(e.target.tagName))return;if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'){auto=null;held=-1;if(!e.repeat)move(-15);}if(e.key==='ArrowRight'){auto=null;held=1;if(!e.repeat)move(15);}if(e.key===' '&&!e.repeat)jumpAt=performance.now();});document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')held=0;});
window.addEventListener('blur',()=>{stopMovement();quiet();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)pause('break');});
function frame(now){const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;if(!paused&&current){if(held)move(held*190*dt);if(auto){const distance=auto.x-current.x;if(Math.abs(distance)<4){const a=auto;auto=null;current.x=a.x;updatePosition();if(a.perform)perform(a.id);}else move(Math.sign(distance)*Math.min(210*dt,Math.abs(distance)));}
 let foxFrame=0,bunnyFrame=0;if(!prefs.reduced){if(held||auto||now<walkUntil)foxFrame=1+Math.floor(now/175)%2;if(jumpAt)foxFrame=3;if(now-blinkAt>5700){bunnyFrame=1;if(now-blinkAt>5870)blinkAt=now;}}
 if(current.s.done)bunnyFrame=!prefs.reduced&&now-finishedAt<1100?3:2;
 $('noriSprite').style.backgroundPosition=foxFrame*100/3+'% 0%';$('friendSprite').style.backgroundPosition=bunnyFrame*100/3+'% 100%';$('noriSprite').style.transform=facing<0?'scaleX(-1)':'';
 if(jumpAt){const t=(now-jumpAt)/650;if(t>=1){jumpAt=0;$('nori').style.translate='';}else $('nori').style.translate=prefs.reduced?'0 -3px':`0 ${-Math.sin(t*Math.PI)*40*scale}px`;}
 }requestAnimationFrame(frame);}
$('scenery').innerHTML='<div class=photo-panel style="left:0%;background-image:url(picnic-panorama.png)"></div><div class=photo-panel style="left:33.333333%;background-image:url(stream-panorama.png)"></div><div class=photo-panel style="left:66.666666%;background-image:url(woodland-panorama.png)"></div>';new ResizeObserver(layout).observe($('stage'));syncAudio();loadMission('orchard');requestAnimationFrame(frame);showStory();
})();

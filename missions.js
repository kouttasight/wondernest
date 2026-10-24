/* Pure mission rules shared by the playable world and verification suite. */
(function(root){
'use strict';
const colours=[['Red','#b94d47'],['Blue','#507fb2'],['Yellow','#d9ad26'],['Green','#5d8b58'],['Orange','#d98036'],['Purple','#9872ac']];
const shapeNames=['Circle','Square','Triangle','Rectangle','Oval','Star'];
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const letterNames=['ay','bee','see','dee','ee','ef','jee','aitch','eye','jay','kay','el','em','en','oh','pee','cue','ar','ess','tee','you','vee','double you','ex','why','zed'];
const wordBank=['UP','IN','ON','GO','SUN','CUP','HAT','MAP'];
const catalogue=[
 {id:'orchard',name:'Apples for Mazidah',place:'Orchard',icon:'apple',start:90,friend:830,steps:['Pick','Carry','Share'],description:'Gather apples and bring them to Mazidah.'},
 {id:'grow',name:'Seed to flower',place:'Garden',icon:'flower',start:1050,friend:1850,steps:['Seeds','Plant','Water','Pick','Give'],description:'Plant seeds, water the beds and share flowers.'},
 {id:'sort',name:'Rainbow baskets',place:'Garden',icon:'basket',start:1090,friend:1870,steps:['Pick','Match','Deliver'],description:'Carry each flower to its coloured basket.'},
 {id:'water',name:'Fill & pour',place:'Garden',icon:'water',start:1060,friend:1840,steps:['Bucket','Pump','Carry','Pour','Pick','Give'],description:'Fill a bucket one pump at a time, then water a thirsty bed.'},
 {id:'bridge',name:'Build a bridge',place:'Workshop',icon:'bridge',start:2070,friend:3100,steps:['Find','Fit','Cross'],description:'Carry shapes to the bridge, then walk across.'},
 {id:'trail',name:'Colour gate',place:'Workshop',icon:'gate',start:2050,friend:3070,steps:['Look','Follow','Open','Go'],description:'Follow a pictured colour trail and open the gate.'},
 {id:'picnic',name:'One for each',place:'Picnic',icon:'picnic',start:3070,friend:3800,steps:['Open','Collect','Give','Ring'],description:'Open the hamper and prepare one place for each friend.'},
 {id:'letters',name:'Letter post',place:'Letterwood',icon:'letter',start:4050,friend:4840,steps:['Find','Carry','Post','Open'],description:'Find letters and deliver them to matching postboxes.'},
 {id:'words',name:'Word workshop',place:'Letterwood',icon:'word',start:4050,friend:4840,steps:['Look','Collect','Build','Use'],description:'Copy a short word with blocks, then use what you built.',optional:true}
];
function create(id,options={},variant=0){
 if(!catalogue.some(m=>m.id===id))throw Error('Unknown mission');
 const o={amount:2,choices:2,letterLimit:6,wordLength:'all',...options};o.amount=Math.max(1,Math.min(5,Number(o.amount)||2));
 const words=wordBank.filter(w=>o.wordLength==='all'||w.length===Number(o.wordLength));
 const s={id,options:o,variant,phase:'start',done:false,picks:[],delivered:[],beds:[0,0],carry:null,inventory:0,water:0,sequence:0,placed:[],step:0,opened:false,flower:false,word:words[variant%words.length]||'SUN',letters:[],targetColour:variant%6};
 s.letters=Array.from({length:Math.min(o.choices===3?3:2,o.letterLimit)},(_,i)=>alphabet[(variant+i)%o.letterLimit]);
 return s;
}
function meta(s){return catalogue.find(m=>m.id===s.id);}
function node(id,kind,x,label,goal=false,extra={}){return {id,kind,x,y:345,label,goal,enabled:true,...extra};}
function objects(s){
 const out=[],n=s.options.amount,c=s.targetColour;
 if(s.id==='orchard'){
  for(let i=0;i<n;i++)if(!s.picks.includes(i))out.push(node('apple'+i,'apple',250+i*105,'Pick apple',!s.carry));
  out.push(node('bimi','bimi',830,'Give apples to Mazidah',s.picks.length===n&&!s.opened,{enabled:!s.opened}));
  if(s.opened&&!s.done)out.push(node('cloth','picnic',710,'Put out the picnic cloth',true));
 }
 if(s.id==='grow'){
  if(!s.opened)for(let i=0;i<s.options.choices;i++)out.push(node('seed'+i,'seed',1150+i*115,colours[(c+i)%6][0]+' seeds',i===0,{colour:(c+i)%6}));
  for(let i=0;i<2;i++)out.push(node('bed'+i,s.beds[i]===2?'flower':s.beds[i]===1?'seedbed':'bed',1390+i*155,s.beds[i]===0?'Plant seeds':s.beds[i]===1?'Water the seeds':s.beds[i]===2?'Pick flower':'Flower picked',s.opened&&((s.phase==='plant'&&s.beds[i]===0)||(s.phase==='water'&&s.beds[i]===1)||(s.phase==='pick'&&s.beds[i]===2)),{colour:c,enabled:s.beds[i]!==3}));
  if(s.opened&&s.beds.every(v=>v>=1)&&!['water','pick','give','done'].includes(s.phase))out.push(node('can','can',1240,'Take watering can',true));
  if(s.phase==='give'||s.done)out.push(node('bimi','bimi',1850,'Give flowers to Mazidah',!s.done));
 }
 if(s.id==='sort'){
  const count=s.options.choices;
  for(let i=0;i<count;i++){if(!s.picks.includes(i))out.push(node('flower'+i,'flower',1210+i*145,colours[(c+i)%6][0]+' flower',!s.carry,{colour:(c+i)%6}));out.push(node('basket'+i,'basket',1600+i*115,colours[(c+i)%6][0]+' basket',s.carry?.index===i,{colour:(c+i)%6,filled:s.delivered.includes(i)}));}
  if(s.delivered.length===count&&!s.done)out.push(node('bimi','bimi',1870,'Show Mazidah the baskets',true));
 }
 if(s.id==='water'){
  if(!s.opened)out.push(node('bucket','bucket',1170,'Take empty bucket',true));
  out.push(node('pump','pump',1350,'Pump water',s.opened&&s.water<n&&!s.flower,{amount:s.water,total:n}));
  out.push(node('thirsty','flowerbed',1650,s.flower?'Pick flower':'Pour water on the bed',s.opened&&s.water===n&&!s.flower||s.phase==='pick',{bloom:s.flower,colour:c}));
  if(s.phase==='give'||s.done)out.push(node('bimi','bimi',1840,'Give flower to Mazidah',!s.done));
 }
 if(s.id==='bridge'){
  const count=s.options.choices;
  out.push(node('smallpiece','shape',1990,'Small '+shapeNames[s.variant%6].toLowerCase()+' piece',false,{shape:s.variant%6,small:true}));
  for(let i=0;i<count;i++){const shape=(s.variant+i)%6;if(!s.picks.includes(i))out.push(node('piece'+i,'shape',2160+i*125,'Big '+shapeNames[shape].toLowerCase()+' piece',!s.carry&&i===s.placed.length,{shape}));out.push(node('socket'+i,'socket',2480+(i+.5)*(320/count),shapeNames[shape]+' space',s.carry?.index===i,{shape,filled:s.placed.includes(i)}));}
  if(s.placed.length===count||s.done)out.push(node('cross','flag',2890,'Cross the bridge',!s.done));
 }
 if(s.id==='trail'){
  for(let i=0;i<s.options.choices;i++)out.push(node('post'+i,'post',2210+i*155,colours[(c+i)%6][0]+' stepping stone',s.sequence===i,{colour:(c+i)%6,filled:s.sequence>i}));
  out.push(node('gate','gate',2700,s.opened?'Walk through the gate':'Open gate',s.sequence===s.options.choices&&!s.opened,{open:s.opened}));
  if(s.opened&&!s.done)out.push(node('through','flag',2890,'Go through',true));
 }
 if(s.id==='picnic'){
  out.push(node('hamper','basket',3190,'Open picnic hamper',!s.opened,{filled:s.opened}));
  if(s.opened){for(let i=0;i<2;i++)if(!s.picks.includes(i))out.push(node('carrot'+i,'carrot',3300+i*115,'Pick carrot',s.picks.length<2));for(let i=0;i<2;i++)out.push(node('plate'+i,'plate',3500+i*275,i===0?'Nori’s plate':'Mazidah’s plate',s.inventory>0&&!s.delivered.includes(i),{filled:s.delivered.includes(i),recipient:i===0?'Nori':'Mazidah'}));}
  if(s.delivered.length===2&&!s.done)out.push(node('bell','bell',3690,'Ring the picnic bell',true));
 }
 if(s.id==='letters'){
  for(let i=0;i<s.letters.length;i++){if(!s.picks.includes(i))out.push(node('letter'+i,'letter',4160+i*145,'Find letter '+s.letters[i],!s.carry,{letter:s.letters[i]}));out.push(node('postbox'+i,'postbox',4550+i*115,'Post letter '+s.letters[i],s.carry?.index===i,{letter:s.letters[i].toLowerCase(),filled:s.placed.includes(i)}));}
  if(s.placed.length===s.letters.length&&!s.done)out.push(node('surprise','envelope',4840,'Open Mazidah’s letter',true));
 }
 if(s.id==='words'){
  const step=s.step,letter=s.word[step];
  if(step<s.word.length){if(!s.carry)for(let i=0;i<s.options.choices;i++){const l=alphabet[(alphabet.indexOf(letter)+i)%26];out.push(node('block'+i,'letter',4180+i*115,'Letter '+l,i===0,{letter:l}));}out.push(node('wordslot','wordslot',4570,'Place '+letter+' in the word',!!s.carry,{letter,word:s.word,step}));}
  else out.push(node('use','reveal',4780,s.word==='UP'?'Lift the flag':s.word==='IN'?'Put the ball in':s.word==='ON'?'Put the ball on':s.word==='GO'?'Open the path':'Open the picture',!s.done,{word:s.word,filled:s.done}));
 }
 return out;
}
function objective(s){
 const n=s.options.amount,c=colours[s.targetColour][0].toLowerCase(),goal=objects(s).find(o=>o.goal),base={label:'Explore together.',tokens:[],step:0,total:meta(s).steps.length};
 if(s.done)return {...base,label:({orchard:'A picnic for Mazidah. Thank you!',grow:'Flowers for Mazidah. Thank you!',sort:'Every flower has a basket.',water:'You helped the flower grow.',bridge:'The bridge is ready to cross.',trail:'The gate is open.',picnic:'One for Nori. One for Mazidah.',letters:'A letter from Mazidah!',words:s.word+'. You made it.'})[s.id],step:base.total,tokens:[{kind:'heart'}]};
 if(s.id==='orchard')return {...base,label:s.picks.length<n?`Pick ${n} ${n===1?'apple':'apples'}.`:!s.opened?'Bring the apples to Mazidah.':'Put out the picnic cloth.',step:s.picks.length<n?0:!s.opened?1:2,tokens:Array.from({length:n},(_,i)=>({kind:'apple',filled:i<s.picks.length}))};
 if(s.id==='grow')return {...base,label:!s.opened?`Find ${c} seeds.`:s.phase==='plant'?'Plant a seed in each bed.':s.phase==='can'?'Take the watering can.':s.phase==='water'?'Water the little seeds.':s.phase==='pick'?`Pick the ${c} flowers.`:'Bring the flowers to Mazidah.',step:!s.opened?0:s.phase==='plant'?1:['can','water'].includes(s.phase)?2:s.phase==='pick'?3:4,tokens:[{kind:goal?.kind||'flower',colour:s.targetColour}]};
 if(s.id==='sort')return {...base,label:s.delivered.length===s.options.choices?'Show Mazidah the baskets.':s.carry?`Put the ${colours[s.carry.colour][0].toLowerCase()} flower in its basket.`:'Pick a flower to carry.',step:s.delivered.length===s.options.choices?2:s.carry?1:0,tokens:s.carry?[{kind:'flower',colour:s.carry.colour},{kind:'basket',colour:s.carry.colour}]:[]};
 if(s.id==='water')return {...base,label:!s.opened?'Take the empty bucket.':s.phase==='pick'?'Pick the flower.':s.phase==='give'?'Give the flower to Mazidah.':s.water<n?`Pump ${n} ${n===1?'time':'times'} to fill the bucket.`:'Carry the water. Pour it on the bed.',step:!s.opened?0:s.phase==='pick'?4:s.phase==='give'?5:s.water<n?1:2,tokens:[{kind:s.phase==='give'?'flower':'bucket',amount:s.water,total:n}]};
 if(s.id==='bridge')return {...base,label:s.placed.length===s.options.choices?'Walk across your bridge.':s.carry?`Fit the ${shapeNames[s.carry.shape].toLowerCase()} in its space.`:`Find the big ${shapeNames[(s.variant+s.placed.length)%6].toLowerCase()} for the bridge.`,step:s.placed.length===s.options.choices?2:s.carry?1:0,tokens:s.carry?[{kind:'shape',shape:s.carry.shape},{kind:'socket',shape:s.carry.shape}]:s.placed.length<s.options.choices?[{kind:'shape',shape:(s.variant+s.placed.length)%6},{kind:'socket',shape:(s.variant+s.placed.length)%6}]:[]};
 if(s.id==='trail')return {...base,label:s.sequence<s.options.choices?`Step on ${colours[(s.targetColour+s.sequence)%6][0].toLowerCase()}.`:!s.opened?'Open the garden gate.':'Walk through the gate.',step:s.sequence===0?0:s.sequence<s.options.choices?1:!s.opened?2:3,tokens:Array.from({length:s.options.choices},(_,i)=>({kind:'swatch',colour:(s.targetColour+i)%6,filled:i<s.sequence}))};
 if(s.id==='picnic')return {...base,label:!s.opened?'Open the picnic hamper.':s.picks.length<2?`Collect two carrots.`:s.delivered.length<2?'One carrot on each plate.':'Ring the picnic bell.',step:!s.opened?0:s.picks.length<2?1:s.delivered.length<2?2:3,tokens:[{kind:'carrot',filled:s.delivered.includes(0)},{kind:'carrot',filled:s.delivered.includes(1)}]};
 if(s.id==='letters')return {...base,label:s.placed.length===s.letters.length?'Open Mazidah’s letter.':s.carry?`Post ${s.carry.letter} in its matching box.`:'Find a letter to deliver.',step:s.placed.length===s.letters.length?3:s.carry?1:0,tokens:s.letters.map((l,i)=>({kind:'letter',letter:l,lower:l.toLowerCase(),filled:s.placed.includes(i)}))};
 return {...base,label:s.step===s.word.length?(goal?.label||'Use the word you made')+'.':s.carry?'Put the letter in the word.':`Find ${s.word[s.step]} for ${s.word}.`,step:s.step===s.word.length?3:s.carry?2:1,tokens:[{kind:'reveal',word:s.word,filled:true},...s.word.split('').map((l,i)=>({kind:'letter',letter:l,filled:i<s.step}))]};
}
function finish(s){s.done=true;s.phase='done';s.carry=null;}
function act(s,id){
 const o=objects(s).find(o=>o.id===id);if(!o||s.done)return {changed:false,said:s.done?'We can play again, or choose another place.':'Look around.'};
 if(!o.goal||!o.enabled)return {changed:false,said:o.label+'.'};
 let said=o.label+'.';
 if(s.id==='orchard'){if(id.startsWith('apple')){s.picks.push(Number(id.slice(5)));s.inventory++;said=['','One.','Two.','Three.','Four.','Five.'][s.inventory];}else if(id==='bimi'){s.opened=true;s.inventory=0;s.phase='cloth';said='Apples for Mazidah. Thank you!';}else finish(s);}
 if(s.id==='grow'){
  if(id==='seed0'){s.opened=true;s.phase='plant';s.carry={kind:'seed',colour:s.targetColour};}
  else if(id.startsWith('bed')){const i=Number(id.slice(3));if(s.phase==='plant'){s.beds[i]=1;if(s.beds.every(v=>v===1)){s.phase='can';s.carry=null;}}else if(s.phase==='water'){s.beds[i]=2;if(s.beds.every(v=>v===2)){s.phase='pick';s.carry=null;}}else if(s.phase==='pick'){s.beds[i]=3;s.inventory++;if(s.beds.every(v=>v===3)){s.phase='give';s.carry={kind:'flower',colour:s.targetColour};}}}
  else if(id==='can'){s.phase='water';s.carry={kind:'can'};}
  else if(id==='bimi'){s.inventory=0;finish(s);said='Flowers for Mazidah. Thank you!';}
 }
 if(s.id==='sort'){if(id.startsWith('flower')){const i=Number(id.slice(6));s.picks.push(i);s.carry={kind:'flower',index:i,colour:(s.targetColour+i)%6};said=colours[s.carry.colour][0]+' flower.';}else if(id.startsWith('basket')){s.delivered.push(Number(id.slice(6)));s.carry=null;}else finish(s);}
 if(s.id==='water'){if(id==='bucket'){s.opened=true;s.carry={kind:'bucket'};s.phase='pump';}else if(id==='pump'){s.water++;said=['','One.','Two.','Three.','Four.','Five.'][s.water];if(s.water===s.options.amount)s.phase='pour';}else if(id==='thirsty'){if(s.phase==='pick'){s.phase='give';s.carry={kind:'flower',colour:s.targetColour};}else{s.flower=true;s.phase='pick';s.carry=null;said='Water in. A flower grows.';}}else finish(s);}
 if(s.id==='bridge'){if(id.startsWith('piece')){const i=Number(id.slice(5));s.picks.push(i);s.carry={kind:'shape',index:i,shape:(s.variant+i)%6};}else if(id.startsWith('socket')){s.placed.push(Number(id.slice(6)));s.carry=null;}else finish(s);}
 if(s.id==='trail'){if(id.startsWith('post')){s.sequence++;said=colours[o.colour][0]+'.';}else if(id==='gate'){s.opened=true;said='Open.';}else finish(s);}
 if(s.id==='picnic'){if(id==='hamper'){s.opened=true;}else if(id.startsWith('carrot')){s.picks.push(Number(id.slice(6)));s.inventory++;said=s.inventory===1?'One.':'Two.';}else if(id.startsWith('plate')){s.delivered.push(Number(id.slice(5)));s.inventory--;said='One for '+o.recipient+'.';}else{finish(s);said='Picnic ready.';}}
 if(s.id==='letters'){if(id.startsWith('letter')){const i=Number(id.slice(6));s.picks.push(i);s.carry={kind:'letter',index:i,letter:s.letters[i]};said=letterNames[alphabet.indexOf(s.letters[i])]+'.';}else if(id.startsWith('postbox')){s.placed.push(Number(id.slice(7)));s.carry=null;said='Letter in.';}else finish(s);}
 if(s.id==='words'){if(id==='block0'){s.carry={kind:'letter',letter:s.word[s.step]};said=letterNames[alphabet.indexOf(s.carry.letter)]+'.';}else if(id==='wordslot'){s.step++;s.carry=null;said=s.step===s.word.length?s.word.toLowerCase()+'.':'Letter in.';}else{finish(s);said=s.word.toLowerCase()+'.';}}
 return {changed:true,said,done:s.done};
}
const api={catalogue,colours,shapeNames,alphabet,letterNames,wordBank,create,meta,objects,objective,act};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WonderMissions=api;
})(typeof window!=='undefined'?window:globalThis);

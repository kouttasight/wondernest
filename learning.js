/* Extra missions: pure state transitions, shared by game and verification. */
(function(root){
function extend(M){
 const words=['UP','IN','ON','GO','SUN','CUP','HAT','MAP','CAT','DOG','BOX','BED','BUS','LOG','PIG','BAG'];
 const vocabulary=['apple','ball','cat','dog','egg','flower','gate','hat','insect','jug','key','leaf','map','nest','orange','pear','quilt','rabbit','sun','tree','umbrella','van','water','box','yarn','zip'];
 M.wordBank.splice(0,M.wordBank.length,...words);M.vocabulary=vocabulary;
 const extra=[
  {id:'alphapicture',name:'Bimi’s alphabet book',place:'Letterwood',icon:'letter',start:4050,friend:4840,steps:['Letter','Picture','Post','Share'],description:'Find a letter, collect its picture and deliver a page for Bimi’s book.'},
  {id:'abcorder',name:'ABC garden path',place:'Letterwood',icon:'letter',start:4050,friend:4840,steps:['Find','Place','Open','Visit'],description:'Build a short alphabet path, then open the gate to Bimi.'},
  {id:'numbermatch',name:'Number baskets',place:'Garden',icon:'number',start:1050,friend:1850,steps:['Number','Quantity','Deliver'],description:'Carry a number to a basket with that many apples, then give it to Bimi.'},
  {id:'numbertrail',name:'Counting stepping stones',place:'Workshop',icon:'number',start:2070,friend:3070,steps:['Count','Open','Walk'],description:'Follow a short number trail to open the picnic gate.'},
  {id:'pack',name:'Pack Bimi’s basket',place:'Orchard',icon:'countbasket',start:90,friend:830,steps:['Pick','Pack','Give'],description:'Carry apples one at a time and pack the pictured amount for Bimi.'}
 ];
 M.catalogue.push(...extra);M.extraIds=extra.map(x=>x.id);
 const create=M.create,objects=M.objects,objective=M.objective,act=M.act;
 const node=(id,kind,x,label,goal=false,data={})=>({id,kind,x,y:345,label,goal,enabled:true,...data});
 const alphabet=M.alphabet;
 M.create=function(id,options={},variant=0){
  const opts={...options,letterLimit:options.letterLimit??26,numberRange:Number(options.numberRange)===10?10:5};
  const s=create(id,opts,variant);
  if(id==='words'){const bank=words.filter(w=>opts.wordLength==='all'||!opts.wordLength||w.length===Number(opts.wordLength));s.word=bank[variant%bank.length];}
  s.focus=alphabet[((variant%26)+26)%26];s.number=variant%opts.numberRange+1;
  s.route=Array.from({length:3},(_,i)=>alphabet[Math.min(variant%26,23)+i]);
  s.numberRoute=Array.from({length:3},(_,i)=>Math.min(variant%opts.numberRange+1,opts.numberRange-2)+i);
  s.packed=0;
  if(id==='alphapicture')s.phase='letter';
  return s;
 };
 M.objects=function(s){
  if(!M.extraIds.includes(s.id))return objects(s);
  const out=[],count=s.options.choices===3?3:2,correct=s.variant%count;
  if(s.id==='alphapicture'){
   if(s.phase==='letter'||s.phase==='picture')for(let i=0;i<count;i++){const letter=alphabet[(alphabet.indexOf(s.focus)+(i-correct+count)%count)%26];out.push(node('choice'+i,s.phase==='letter'?'letter':'vocab',4160+i*120,s.phase==='letter'?'Find '+letter:'Collect '+vocabulary[alphabet.indexOf(letter)],i===correct,{letter,word:vocabulary[alphabet.indexOf(letter)]}));}
   if(s.phase==='post')for(let i=0;i<count;i++){const letter=alphabet[(alphabet.indexOf(s.focus)+(i-correct+count)%count)%26];out.push(node('letterbox'+i,'postbox',4550+i*110,'Post in '+letter.toLowerCase()+' box',i===correct,{letter:letter.toLowerCase()}));}
   if(s.phase==='share'||s.done)out.push(node('bimi','bimi',4840,'Give book page to Bimi',!s.done));
  }
  if(s.id==='abcorder'){
   if(s.step<3){const letter=s.route[s.step];if(!s.carry)for(let i=0;i<count;i++){const value=alphabet[(alphabet.indexOf(letter)+(i-correct+count)%count)%26];out.push(node('order'+i,'letter',4160+i*120,'Collect '+value,i===correct,{letter:value}));}out.push(node('orderslot','letter',4590,'Place '+letter+' on the path',!!s.carry,{letter:letter.toLowerCase()}));}
   else if(!s.opened)out.push(node('abcgate','gate',4740,'Open alphabet gate',true));
   else out.push(node('bimi','bimi',4840,'Visit Bimi along the alphabet path',!s.done));
  }
  if(s.id==='numbermatch'){
   if(!s.opened){if(!s.carry)for(let i=0;i<count;i++){const number=(s.number-1+(i-correct+count)%count)%s.options.numberRange+1;out.push(node('numeral'+i,'number',1170+i*120,'Take number '+number,i===correct,{number}));}else for(let i=0;i<count;i++){const number=(s.number-1+(i-correct+count)%count)%s.options.numberRange+1;out.push(node('quantity'+i,'countbasket',1510+i*125,'Basket of '+number+' '+(number===1?'apple':'apples'),i===correct,{number}));}}
   else out.push(node('bimi','bimi',1850,'Deliver the number basket to Bimi',!s.done));
  }
  if(s.id==='numbertrail'){
   for(let i=0;i<3;i++)out.push(node('stone'+i,'number',2210+i*140,'Step on '+s.numberRoute[i],s.sequence===i,{number:s.numberRoute[i],filled:s.sequence>i}));
   if(s.sequence===3&&!s.opened)out.push(node('numbergate','gate',2700,'Open the number gate',true));
   if(s.opened)out.push(node('through','flag',2890,'Walk to the picnic meadow',!s.done));
  }
  if(s.id==='pack'){
   if(s.packed<s.number&&!s.carry)out.push(node('supply','apple',250+(s.packed%2)*105,'Pick one apple',true));
   if(s.packed<s.number)out.push(node('packbasket','countbasket',640,'Put one apple in the basket',!!s.carry,{number:s.number,filledCount:s.packed}));
   if(s.packed===s.number)out.push(node('bimi','bimi',830,'Give '+s.number+' '+(s.number===1?'apple':'apples')+' to Bimi',!s.done));
  }
  return out;
 };
 M.objective=function(s){
  if(!M.extraIds.includes(s.id))return objective(s);
  const base={step:0,total:M.meta(s).steps.length,tokens:[]};
  if(s.done)return {...base,step:base.total,label:s.id==='alphapicture'?`${s.focus} ${s.focus.toLowerCase()}: a page for Bimi!`:s.id==='abcorder'?'The alphabet path is open.':s.id==='numbertrail'?'You followed the number trail.':`${s.number} ${s.number===1?'apple':'apples'} for Bimi. Thank you!`,tokens:[{kind:'heart'}]};
  if(s.id==='alphapicture')return {...base,step:['letter','picture','post','share'].indexOf(s.phase),label:s.phase==='letter'?`Find ${s.focus}.`:s.phase==='picture'?s.focus==='X'?'Find the box. X is at the end of box.':`Find ${vocabulary[alphabet.indexOf(s.focus)]} for ${s.focus}.`:s.phase==='post'?`Post the page in ${s.focus.toLowerCase()}.`:'Give Bimi the book page.',tokens:[{kind:'letter',letter:s.focus,lower:s.focus.toLowerCase()},{kind:'vocab',word:vocabulary[alphabet.indexOf(s.focus)]}]};
  if(s.id==='abcorder')return {...base,step:s.step<3?(s.carry?1:0):!s.opened?2:3,label:s.step<3?(s.carry?`Place ${s.route[s.step]} after its friends.`:`Find ${s.route[s.step]} for our path.`):!s.opened?'Open the alphabet gate.':'Visit Bimi on the new path.',tokens:s.route.map((l,i)=>({kind:'letter',letter:l,filled:i<s.step}))};
  if(s.id==='numbermatch')return {...base,step:s.opened?2:s.carry?1:0,label:s.opened?'Give Bimi the counted basket.':s.carry?`Find a basket of ${s.number} ${s.number===1?'apple':'apples'}.`:`Find number ${s.number}.`,tokens:[{kind:'number',number:s.number},{kind:'countbasket',number:s.number}]};
  if(s.id==='numbertrail')return {...base,step:s.sequence<3?0:!s.opened?1:2,label:s.sequence<3?`Step on ${s.numberRoute[s.sequence]}.`:!s.opened?'Open the number gate.':'Walk through to Bimi’s picnic.',tokens:s.numberRoute.map((n,i)=>({kind:'number',number:n,filled:i<s.sequence}))};
  return {...base,step:s.packed===s.number?2:s.carry?1:0,label:s.packed===s.number?`Give ${s.number} ${s.number===1?'apple':'apples'} to Bimi.`:s.carry?'Put one apple in the basket.':`Pack ${s.number} ${s.number===1?'apple':'apples'}. Pick one to carry.`,tokens:Array.from({length:s.number},(_,i)=>({kind:'apple',filled:i<s.packed}))};
 };
 M.act=function(s,id){
  if(!M.extraIds.includes(s.id))return act(s,id);
  const o=M.objects(s).find(o=>o.id===id);
  if(!o||s.done)return {changed:false,said:'We can explore together.'};
  if(!o.goal||!o.enabled)return {changed:false,said:o.label+'.'};
  let said=o.label+'.';
  if(s.id==='alphapicture'){if(s.phase==='letter')s.phase='picture';else if(s.phase==='picture'){s.phase='post';s.carry={kind:'vocab',word:vocabulary[alphabet.indexOf(s.focus)]};}else if(s.phase==='post'){s.phase='share';s.carry={kind:'letter',letter:s.focus};}else finish(s);}
  if(s.id==='abcorder'){if(id.startsWith('order')&&id!=='orderslot')s.carry={kind:'letter',letter:s.route[s.step]};else if(id==='orderslot'){s.step++;s.carry=null;}else if(id==='abcgate')s.opened=true;else finish(s);}
  if(s.id==='numbermatch'){if(id.startsWith('numeral'))s.carry={kind:'number',number:s.number};else if(id.startsWith('quantity')){s.opened=true;s.carry={kind:'countbasket',number:s.number};}else finish(s);}
  if(s.id==='numbertrail'){if(id.startsWith('stone')){s.sequence++;said=M.numberNames[o.number]+'.';}else if(id==='numbergate')s.opened=true;else finish(s);}
  if(s.id==='pack'){if(id==='supply')s.carry={kind:'apple'};else if(id==='packbasket'){s.carry=null;s.packed++;said=M.numberNames[s.packed]+'.';}else finish(s);}
  return {changed:true,said,done:s.done};
 };
 function finish(s){s.done=true;s.phase='done';s.carry=null;}
 M.numberNames=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
 return M;
}
if(typeof module!=='undefined'&&module.exports)module.exports=extend;else extend(root.WonderMissions);
})(typeof window!=='undefined'?window:globalThis);

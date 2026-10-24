export const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const VOCAB=['apple','ball','cat','dog','egg','flower','gate','hat','insect','jug','key','leaf','map','nest','orange','pear','quilt','rabbit','sun','tree','umbrella','van','water','xylophone','yarn','zip'];
export const WORDS=['UP','IN','ON','GO','SUN','CUP','HAT','MAP','CAT','DOG','BOX','BED','BUS','LOG','PIG','BAG'];
export const CHAPTERS=[
 {id:'apples',name:'Apples for Mazidah',subtitle:'A little kindness starts our picnic.',icon:'apple'},
 {id:'colours',name:'A drink for the flowers',subtitle:'Find a coloured can and help the garden grow.',icon:'water'},
 {id:'shapes',name:'The garden gate',subtitle:'Fit a shape and open the way to our picnic.',icon:'triangle'},
 {id:'alphabet',name:'Mazidah’s picture book',subtitle:'Bring a letter and its picture to our friend.',icon:'letter'},
 {id:'numbers',name:'Count a picnic basket',subtitle:'One apple at a time. Just the number we need.',icon:'basket'},
 {id:'words',name:'Words in the woodland',subtitle:'Find the letters, build a word, and see its picture.',icon:'book'}
];
export class Adventure {
 constructor(id='apples',options={}){this.id=id;this.choices=options.choices===3?3:2;this.number=Math.max(1,Math.min(10,options.number||3));this.letter=ALPHABET.includes(options.letter)?options.letter:'A';this.word=WORDS.includes(options.word)?options.word:'CAT';this.colour=options.colour||'red';this.shape=options.shape||'triangle';this.carry=null;this.delivered=0;this.step=0;this.done=false;this.removed=new Set();}
 get chapter(){return CHAPTERS.find(c=>c.id===this.id);}
 get goal(){if(this.done)return 'Mazidah says thank you. Explore, repeat, or choose another adventure.';if(this.carry)return this.id==='colours'?'Water the flowers.':this.id==='shapes'?'Fit the shape in the gate.':this.id==='words'?`Place ${this.carry.letter} on the book bench.`:'Bring it to Mazidah’s basket.';if(this.id==='apples'||this.id==='numbers')return `Pick ${this.number} apples for Mazidah. ${this.delivered} of ${this.number} shared.`;if(this.id==='colours')return `Find the ${this.colour} watering can.`;if(this.id==='shapes')return `Find the ${this.shape}.`;if(this.id==='alphabet')return this.step===0?`Find letter ${this.letter}.`:`Find the ${VOCAB[ALPHABET.indexOf(this.letter)]} picture.`;return `Find ${this.word[this.step]} for ${this.word}.`;}
 get progress(){return this.id==='apples'||this.id==='numbers'?`${this.delivered} / ${this.number}`:this.id==='alphabet'?`${this.step} / 3`:this.id==='words'?`${this.step} / ${this.word.length}`:this.done?'✓':'1 little task';}
 get voice(){if(this.done)return 'finish';if(this.carry)return this.id==='colours'?'pour':this.id==='shapes'?'fit':this.id==='words'?'wordFit':'give';if(this.id==='colours')return 'colour'+this.colour;if(this.id==='shapes')return 'shape'+this.shape;if(this.id==='alphabet')return this.step===0?'letter'+this.letter:'vocab'+this.letter;if(this.id==='words')return 'letter'+this.word[this.step];return 'orchard';}
 objects(){
  if(this.done)return [];
  const destination={id:'deliver',kind:this.id==='colours'?'flowers':this.id==='shapes'?'socket':this.id==='words'?'bench':'basket',x:this.id==='shapes'?6:this.id==='colours'?-5:1.3,z:this.id==='shapes'?-4:this.id==='colours'?-5:-4.2,label:this.id==='colours'?'Water flowers':this.id==='shapes'?'Fit shape':this.id==='words'?'Place letter':'Give to Mazidah',goal:!!this.carry};
  if(this.carry)return [destination];
  if(this.id==='apples'||this.id==='numbers')return Array.from({length:this.number+2},(_,i)=>({id:'apple'+i,kind:'apple',x:[-3.2,3.8,-5,5.4,-2,2.8,-4.2,4.4,0,6,-6,1][i],z:[1.4,.4,-1.4,-2.1,3.2,3.5,-3,2.4,-.3,1.8,3.1,2][i],label:'Pick apple',goal:true})).filter(o=>!this.removed.has(o.id));
  if(this.id==='colours')return [this.colour,...['red','blue','yellow'].filter(v=>v!==this.colour)].slice(0,this.choices).reverse().map((colour,i)=>({id:colour,kind:'can',colour,x:-4+i*3.4,z:.7,label:colour+' watering can',goal:colour===this.colour}));
  if(this.id==='shapes')return [this.shape,...['triangle','circle','square'].filter(v=>v!==this.shape)].slice(0,this.choices).reverse().map((shape,i)=>({id:shape,kind:'shape',shape,x:-3.8+i*3.4,z:.6,label:shape,goal:shape===this.shape}));
  const target=this.id==='alphabet'?this.letter:this.word[this.step],index=ALPHABET.indexOf(target),choices=[target,ALPHABET[(index+3)%26],ALPHABET[(index+9)%26]].slice(0,this.choices);if(index%2)choices.reverse();
  return choices.map((letter,i)=>({id:'choice'+i,kind:this.id==='alphabet'&&this.step===1?'picture':'letter',letter,word:VOCAB[ALPHABET.indexOf(letter)],x:-3.4+i*3.4,z:.5,label:this.id==='alphabet'&&this.step===1?VOCAB[ALPHABET.indexOf(letter)]:'Letter '+letter,goal:letter===target}));
 }
 act(id){const o=this.objects().find(o=>o.id===id);if(!o)return {changed:false};if(!o.goal)return {changed:false,text:`You found ${o.colour||o.shape||o.letter}. ${this.goal}`};if(id==='deliver'){
  this.carry=null;
  if(this.id==='apples'||this.id==='numbers'){this.delivered++;this.done=this.delivered===this.number;return {changed:true,text:`${this.delivered}. An apple for Mazidah.`,voice:'count'+this.delivered};}
  if(this.id==='words'){this.step++;this.done=this.step===this.word.length;return {changed:true,text:this.done?`${this.word.toLowerCase()}. You made a word!`:`${this.step} letter${this.step===1?'':'s'} placed.`,voice:this.done?'word'+this.word.toLowerCase():null};}
  this.done=true;if(this.id==='alphabet')this.step=3;
  return {changed:true,text:this.id==='colours'?'A drink for the flowers. They are growing!':this.id==='shapes'?'The shape fits. Our garden gate is open!':'A page for Mazidah. Thank you!',voice:'complete'};
 }
 if(this.id==='alphabet'&&this.step===0){this.step=1;return {changed:true,text:`${this.letter}. Now find its picture.`,voice:'vocab'+this.letter};}
 this.carry={...o};if(o.kind==='apple')this.removed.add(o.id);
 if(this.id==='alphabet')this.step=2;
 return {changed:true,text:this.id==='words'?`You have ${o.letter}. Bring it to the bench.`:'Nori is carrying it. Let’s take it together.',voice:this.id==='words'?'letter'+o.letter:null};
 }
}

(function(){
const A=WonderArt,original=A.icon;
const svg=body=>`<svg viewBox="0 0 90 90" aria-hidden="true">${body}</svg>`;
const line='stroke="#5b705d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
function picture(word){
 const legacy={apple:'apple',flower:'flower',gate:'gate'};
 if(legacy[word])return original(legacy[word]);
 const reveal={hat:'HAT',map:'MAP',sun:'SUN',cup:'CUP'};if(reveal[word])return original('reveal',{word:reveal[word],filled:true});
 const drawings={
 water:`<path d="M45 4C36 22 16 39 16 57a29 29 0 0 0 58 0C74 39 54 22 45 4Z" fill="#a2c7d1" ${line}/><path d="M28 50q-8 18 8 23" fill="none" stroke="#e9f3ef" stroke-width="5" stroke-linecap="round"/>`,
 rabbit:`<ellipse cx="33" cy="22" rx="9" ry="21" fill="#e8e2ea" ${line}/><ellipse cx="58" cy="22" rx="9" ry="21" fill="#e8e2ea" ${line}/><path d="M33 9v24m25-24v24" stroke="#d1a4aa" stroke-width="5"/><ellipse cx="45" cy="56" rx="29" ry="25" fill="#f2edf0" ${line}/><circle cx="34" cy="52" r="3"/><circle cx="57" cy="52" r="3"/><path d="m41 62 4 5 5-5" fill="#c58f9b"/><path d="m58 75 14-5v13Z" fill="#9c83ad"/>`,
 ball:`<circle cx="45" cy="45" r="32" fill="#b8d0bb" ${line}/><path d="M20 25q35 2 50 40M18 67q10-30 55-40" fill="none" ${line}/>` ,
 cat:`<path d="M20 36 18 10l24 16 20-16 10 28v24Q46 89 20 62Z" fill="#d9b389" ${line}/><circle cx="34" cy="45" r="3"/><circle cx="58" cy="45" r="3"/><path d="m41 57 5 5 5-5M9 54l22 4M61 58l21-4M9 66l22-3m30 0 21 3" fill="none" ${line}/>` ,
 dog:`<ellipse cx="45" cy="48" rx="27" ry="31" fill="#ceb08c" ${line}/><path d="M24 24Q-1 13 9 59l17-9m39-26q27-9 14 38L64 50" fill="#9e805f" ${line}/><circle cx="34" cy="43" r="3"/><circle cx="57" cy="43" r="3"/><ellipse cx="46" cy="59" rx="7" ry="5" fill="#655341"/>`,
 egg:`<path d="M45 7C65 7 90 78 46 82C0 79 25 7 45 7Z" fill="#f5e9cf" ${line}/>` ,
 insect:`<ellipse cx="45" cy="49" rx="21" ry="28" fill="#c68b70" ${line}/><circle cx="45" cy="22" r="12" fill="#8d9b75" ${line}/><path d="M45 31v44M24 38 9 27m16 24L7 49m19 15L10 76m55-38 16-11M65 51l18-2M64 64l16 12M40 10l-9-7m19 7 9-7" ${line} fill="none"/>`,
 jug:`<path d="M22 13h40l-7 13 9 52H17l9-52Z" fill="#a9c6c9" ${line}/><path d="M60 32h15q20 28-13 28" fill="none" ${line}/>` ,
 key:`<circle cx="26" cy="28" r="17" fill="#ddc178" ${line}/><circle cx="26" cy="28" r="6" fill="#fff9e9"/><path d="m37 40 36 36m-12-12 10-10m-1 19 10-10" ${line} fill="none"/>`,
 leaf:`<path d="M11 79Q6 13 78 8Q87 76 11 79Z" fill="#91b181" ${line}/><path d="m11 79 53-52m-32 31V36m19 4 18-1" ${line} fill="none"/>`,
 nest:`<path d="M7 49Q45 35 83 49L71 76H19Z" fill="#c0a27a" ${line}/><ellipse cx="35" cy="42" rx="11" ry="17" fill="#eee6d4" ${line}/><ellipse cx="57" cy="42" rx="11" ry="17" fill="#e4e8d7" ${line}/><path d="m10 55 65 13M15 68l65-12M21 75l49-1" ${line}/>` ,
 orange:`<circle cx="45" cy="48" r="30" fill="#dda050" ${line}/><path d="M46 20Q43 2 63 8q10 13-17 12" fill="#8da46e" ${line}/>` ,
 pear:`<path d="M44 14q-15 0-14 23C0 68 19 84 46 82q42 0 16-43-2-25-18-25" fill="#b9c58c" ${line}/><path d="m45 15 6-13" ${line}/>` ,
 quilt:`<rect x="10" y="10" width="70" height="70" rx="5" fill="#e5d5b5" ${line}/><path d="M12 12h33v33H12Zm33 33h33v33H45Z" fill="#b5c5b2"/><path d="M45 10v70M10 45h70" ${line}/>` ,
 tree:`<path d="M39 81V39h13v42" fill="#ad8a61" ${line}/><path d="M45 4 12 37h12L7 59h76L66 37h12Z" fill="#95b27d" ${line}/>` ,
 umbrella:`<path d="M6 44Q45-13 84 44Q69 34 59 44q-14-11-27 0Q20 33 6 44Z" fill="#b4c8c4" ${line}/><path d="M45 15v57q0 20-17 6" fill="none" ${line}/>` ,
 van:`<path d="M8 26h48l25 22v25H8Z" fill="#b2c6b5" ${line}/><path d="M55 31v19h21L57 31Z" fill="#f4f0db" ${line}/><circle cx="25" cy="73" r="11" fill="#7a8370"/><circle cx="66" cy="73" r="11" fill="#7a8370"/>`,
 box:`<path d="M12 25h66v55H12Z" fill="#c8a47c" ${line}/><path d="M12 25 31 9h46L59 25M45 26v53" fill="#e2c49a" ${line}/>` ,
 yarn:`<circle cx="43" cy="41" r="29" fill="#b7a7bf" ${line}/><path d="M19 25q45 6 40 39M15 45q42-25 52-18M26 14q2 45 31 54M45 70q25 20 39 2" fill="none" ${line}/>` ,
 zip:`<path d="M30 5h30v78H30Z" fill="#c4ceb6" ${line}/><path d="M43 5v78m7-78v78M35 13h21m-21 10h21m-21 10h21m-21 40h21" fill="none" ${line}/><rect x="37" y="38" width="20" height="25" rx="4" fill="#c2a778" ${line}/>` ,
 bed:`<path d="M8 22v61m73-39v39M9 67h72V42H10Z" fill="#c7b28d" ${line}/><rect x="15" y="32" width="25" height="17" rx="6" fill="#f1ecdb" ${line}/><path d="M42 42h39v25H42Z" fill="#acbfc0" ${line}/>` ,
 bus:`<rect x="6" y="18" width="78" height="55" rx="8" fill="#d5b875" ${line}/><path d="M15 28h15v20H15Zm24 0h15v20H39Zm24 0h12v20H63Z" fill="#e9f0e7" ${line}/><circle cx="23" cy="73" r="10" fill="#74816d"/><circle cx="66" cy="73" r="10" fill="#74816d"/>`,
 log:`<path d="m12 28 55-12q22 9 16 39L27 78Z" fill="#af8e63" ${line}/><ellipse cx="24" cy="52" rx="17" ry="26" fill="#dbbd8d" ${line}/><ellipse cx="24" cy="52" rx="9" ry="15" fill="none" ${line}/><path d="m44 34 29-9M47 48l27-10" ${line}/>` ,
 pig:`<path d="m20 28-3-18 21 12m25 5 10-17 1 26" fill="#d2a69d" ${line}/><ellipse cx="45" cy="48" rx="33" ry="29" fill="#dab2a8" ${line}/><ellipse cx="45" cy="59" rx="18" ry="12" fill="#c58e86" ${line}/><circle cx="35" cy="38" r="3"/><circle cx="57" cy="38" r="3"/><circle cx="39" cy="58" r="3"/><circle cx="51" cy="58" r="3"/>`,
 bag:`<path d="M17 30h56l7 51H10Z" fill="#b7c5a0" ${line}/><path d="M29 32V20q16-26 32 0v12" fill="none" ${line}/>`
 };
 return svg(drawings[word]||drawings.ball);
}
A.icon=function(kind,data={}){
 if(kind==='vocab')return picture(data.word);
 if(kind==='number')return svg(`<rect x="9" y="6" width="72" height="78" rx="15" fill="${data.filled?'#d7e6bf':'#f5e9cb'}" ${line}/><text x="45" y="62" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="53" font-weight="bold" fill="#48604b">${data.number??1}</text>`);
 if(kind==='countbasket'){const n=data.number??2,filled=data.filledCount??n;let dots='';for(let i=0;i<n;i++)dots+=`<circle cx="${17+(i%5)*14}" cy="${27+Math.floor(i/5)*20}" r="6" fill="${i<filled?'#bd6d56':'#f4efde'}" stroke="#8a8e68" stroke-width="1.5"/>`;return svg(`<path d="M5 12h80L77 70H13Z" fill="#ddc49a" ${line}/>${dots}<text x="45" y="86" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#52664c">${data.filledCount===undefined?n:filled+' / '+n}</text>`);}
 if(kind==='reveal'&&['CAT','DOG','BOX','BED','BUS','LOG','PIG','BAG'].includes(data.word))return data.filled?picture(data.word.toLowerCase()):original('envelope');
 return original(kind,data);
};
})();

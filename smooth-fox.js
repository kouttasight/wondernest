import * as T from 'three';
// Loop subdivision preserves UV seams and interpolates the animated skin weights.
export function smoothSkinned(input,iterations=2){
 let geom=input.index?input.toNonIndexed():input.clone();
 for(let pass=0;pass<iterations;pass++){
  const p=geom.attributes.position,uv=geom.attributes.uv,si=geom.attributes.skinIndex,sw=geom.attributes.skinWeight;
  const ids=[],vertices=[],lookup=new Map(),edges=new Map();
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>x.toFixed(4)).join(',');let id=lookup.get(key);if(id===undefined){id=vertices.length;lookup.set(key,id);vertices.push({p:v,n:new Set()});}ids.push(id);}
  function edge(a,b,opposite){vertices[a].n.add(b);vertices[b].n.add(a);const key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,{a,b,opp:[]});edges.get(key).opp.push(opposite);}
  for(let i=0;i<p.count;i+=3){edge(ids[i],ids[i+1],ids[i+2]);edge(ids[i+1],ids[i+2],ids[i]);edge(ids[i+2],ids[i],ids[i+1]);}
  const smooth=vertices.map(v=>{const n=v.n.size,b=n===3?3/16:3/(8*n),q=v.p.clone().multiplyScalar(1-n*b);for(const ni of v.n)q.addScaledVector(vertices[ni].p,b);return q;});
  const positions=[],uvs=[],indices=[],weights=[];
  function attr(i){return{p:smooth[ids[i]],uv:uv?[uv.getX(i),uv.getY(i)]:[0,0],skin:si?[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)]:[0,0,0,0],weight:sw?[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)]:[1,0,0,0]};}
  function mid(i,j){const a=attr(i),b=attr(j),ed=edges.get([Math.min(ids[i],ids[j]),Math.max(ids[i],ids[j])].join(':'));let q=vertices[ed.a].p.clone().add(vertices[ed.b].p);if(ed.opp.length===2){q.multiplyScalar(3/8);for(const op of ed.opp)q.addScaledVector(vertices[op].p,1/8);}else q.multiplyScalar(.5);const mix=new Map();for(const v of [a,b])for(let n=0;n<4;n++)mix.set(v.skin[n],(mix.get(v.skin[n])||0)+v.weight[n]/2);const list=[...mix].sort((x,y)=>y[1]-x[1]).slice(0,4);while(list.length<4)list.push([0,0]);const sum=list.reduce((s,x)=>s+x[1],0)||1;return{p:q,uv:[(a.uv[0]+b.uv[0])/2,(a.uv[1]+b.uv[1])/2],skin:list.map(x=>x[0]),weight:list.map(x=>x[1]/sum)};}
  function push(v){positions.push(...v.p.toArray());uvs.push(...v.uv);indices.push(...v.skin);weights.push(...v.weight);}
  for(let i=0;i<p.count;i+=3){const a=attr(i),b=attr(i+1),c=attr(i+2),ab=mid(i,i+1),bc=mid(i+1,i+2),ca=mid(i+2,i);for(const tri of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]])tri.forEach(push);}
  const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));if(si){out.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));out.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));}geom.dispose();geom=out;
 }
 geom.computeVertexNormals();const p=geom.attributes.position,n=geom.attributes.normal,sums=new Map(),keys=[];for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(4)).join(',');keys.push(key);if(!sums.has(key))sums.set(key,new T.Vector3());sums.get(key).add(new T.Vector3().fromBufferAttribute(n,i));}for(let i=0;i<p.count;i++){const v=sums.get(keys[i]).normalize();n.setXYZ(i,v.x,v.y,v.z);}return geom;
}

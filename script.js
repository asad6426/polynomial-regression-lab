(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const wait=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
const fmt=(v,d=1)=>{ const r=Math.round(v*Math.pow(10,d))/Math.pow(10,d); return (Object.is(r,-0)?0:r).toFixed(d).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1'); };
const sgn=v=>v>0?'+'+fmt(v):fmt(v).replace('-','−');

const X=[1,2,3,4,5], Y=[2,10,16,25,42];
const lin=x=>-9.5+9.5*x, quad=x=>1+0.5*x+1.5*x*x;
const TX=[1.5,3.5,6], TY=[5,21,57];

/* ---------- generic SVG chart ---------- */
let clipN=0;
function chart(svg,o){
  const W=560,H=o.h||340,ml=46,mr=14,mt=12,mb=o.xl?40:24, iw=W-ml-mr, ih=H-mt-mb;
  const sx=x=>ml+(x-o.xd[0])/(o.xd[1]-o.xd[0])*iw, sy=y=>mt+ih-(y-o.yd[0])/(o.yd[1]-o.yd[0])*ih;
  const id='clip'+(++clipN);
  let s=`<defs><clipPath id="${id}"><rect x="${ml}" y="${mt}" width="${iw}" height="${ih}"/></clipPath></defs>`;
  (o.zones||[]).forEach(z=>{ s+=`<rect class="zone" x="${sx(z[0])}" y="${mt}" width="${sx(z[1])-sx(z[0])}" height="${ih}"/><text class="zone-t" x="${sx(z[0])+6}" y="${mt+14}">${z[2]}</text>`; });
  o.yt.forEach(v=>{ s+=`<line class="gridl" x1="${ml}" x2="${ml+iw}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${ml-6}" y="${sy(v)+4}" text-anchor="end">${v}</text>`; });
  o.xt.forEach(v=>{ s+=`<text x="${sx(v)}" y="${mt+ih+16}" text-anchor="middle">${o.xf?o.xf(v):v}</text>`; });
  if(o.yd[0]<0 && o.yd[1]>0) s+=`<line class="zero" x1="${ml}" x2="${ml+iw}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  s+=`<line class="axis" x1="${ml}" x2="${ml+iw}" y1="${mt+ih}" y2="${mt+ih}"/><line class="axis" x1="${ml}" x2="${ml}" y1="${mt}" y2="${mt+ih}"/>`;
  if(o.xl) s+=`<text class="axl" x="${ml+iw/2}" y="${H-4}" text-anchor="middle">${o.xl}</text>`;
  if(o.yl) s+=`<text class="axl" x="${ml+4}" y="${mt+ih-6}" text-anchor="start" transform="rotate(-90 ${ml+4} ${mt+ih-6})" dy="12">${o.yl}</text>`;
  (o.curves||[]).forEach(c=>{
    const a=c.from??o.xd[0], b=c.to??o.xd[1]; let d='';
    for(let i=0;i<=160;i++){ const x=a+(b-a)*i/160; let y=c.f(x); y=Math.max(o.yd[0]-500,Math.min(o.yd[1]+500,y)); d+=(i?'L':'M')+sx(x).toFixed(1)+','+sy(y).toFixed(1); }
    s+=`<path class="${c.cls}${c.draw?' draw':''}" d="${d}" clip-path="url(#${id})"/>`;
  });
  (o.resid||[]).forEach(r=>{ const c=r.e>=0?'pos':'neg'; s+=`<line class="res-${c}" x1="${sx(r.x)}" x2="${sx(r.x)}" y1="${sy(r.y)}" y2="${sy(r.yh)}"/>`+(o.noResLbl?'':`<text class="res-lbl ${c}" x="${sx(r.x)+7}" y="${(sy(r.y)+sy(r.yh))/2+4}">${sgn(r.e)}</text>`); });
  (o.bars||[]).forEach(b=>{ const c=b.v>=0?'pos':'neg', y0=sy(0), y1=sy(b.v); s+=`<rect class="bar-${c}" x="${sx(b.x)-12}" y="${Math.min(y0,y1)}" width="24" height="${Math.abs(y1-y0)}" rx="3"/><text class="sign ${c}" x="${sx(b.x)}" y="${b.v>=0?y1-6:y1+16}" text-anchor="middle">${b.v>=0?'+':'−'}</text>`; });
  (o.pts||[]).forEach(p=>{ s+=`<circle class="pt" cx="${sx(p[0])}" cy="${sy(p[1])}" r="6"/>`; });
  (o.tpts||[]).forEach(p=>{ s+=`<circle class="tpt" cx="${sx(p[0])}" cy="${sy(p[1])}" r="6"/>`; });
  (o.marks||[]).forEach(m=>{ const cy=Math.max(mt,Math.min(mt+ih,sy(m.y))); s+=`<circle class="mk-${m.c}" cx="${sx(m.x)}" cy="${cy}" r="7"/><text class="mk-txt ${m.c}" x="${sx(m.x)+(m.left?-11:11)}" y="${cy+4}" text-anchor="${m.left?'end':'start'}">${m.t}</text>`; });
  svg.innerHTML=s;
  if(!reduce) svg.querySelectorAll('path.draw').forEach(p=>{ const L=p.getTotalLength(); p.style.transition='none'; p.style.strokeDasharray=L; p.style.strokeDashoffset=L; p.getBoundingClientRect(); p.style.transition=''; p.style.strokeDashoffset=0; });
}
const kmh=v=>v*10;
const base={xd:[0,6],yd:[-15,50],xt:[0,1,2,3,4,5,6],yt:[-10,0,10,20,30,40,50],xl:'Speed (km/h)',yl:'Stopping distance (m)',xf:v=>v*10};
const PTS=X.map((x,i)=>[x,Y[i]]);

/* ---------- HOOK ---------- */
let hl=false,hp=false;
function drawHook(anim){
  const curves=[]; const marks=[];
  if(hl){ curves.push({f:lin,cls:'c-lin',from:0,to:9,draw:anim==='l'}); marks.push({x:8,y:lin(8),c:'lin',t:'66.5 m',left:true}); }
  if(hp){ curves.push({f:quad,cls:'c-poly',from:0,to:9,draw:anim==='p'}); marks.push({x:8,y:quad(8),c:'poly',t:'101 m',left:true}); }
  chart($('#hookChart'),{xd:[0,9],yd:[-15,110],xt:[0,1,2,3,4,5,6,7,8,9],yt:[0,20,40,60,80,100],xl:'Speed (km/h)',yl:'Stopping distance (m)',xf:v=>v*10,zones:[[5.5,9,'never measured']],pts:PTS,curves,marks});
  $('#hLv').textContent=hl?'66.5 m':'—'; $('#hPv').textContent=hp?'101.0 m':'—';
  $('#hDv').textContent=(hl&&hp)?'34.5 m':'—';
  $('#hMsg').innerHTML = hl&&hp ? 'Both fit the five measured points reasonably well, but they disagree by <b>34.5 m</b> at 80 km/h. Physics says braking distance grows with the <b>square</b> of speed, so the curve is the one to trust.'
    : hl ? 'The straight line looks acceptable on the measured points. Now fit the curve and compare.' : hp ? 'The curve bends upward, like real braking. Now fit the straight line and compare.' : 'Press both buttons. The two models agree on the measured speeds, but not at 80 km/h.';
}
$('#hLin').onclick=()=>{ hl=!hl; $('#hLin').setAttribute('aria-pressed',hl); drawHook(hl?'l':''); };
$('#hPoly').onclick=()=>{ hp=!hp; $('#hPoly').setAttribute('aria-pressed',hp); drawHook(hp?'p':''); };
drawHook();

/* ---------- DATA ---------- */
$('#dataBody').innerHTML=X.map((x,i)=>`<tr><td>Test ${i+1}</td><td>${x*10}</td><td>${x}</td><td>${Y[i]}</td><td>${i?'+'+(Y[i]-Y[i-1])+' m':'—'}</td></tr>`).join('');

/* ---------- TWO DATASETS ---------- */
const pval=(c,x)=>c.reduce((s,a,i)=>s+a*x**i,0);
const X9=[1,2,3,4,5,6,7,8,9];
const SETS={
  lin:{y:[5.6,6.6,9.3,10.3,13.5,14.8,17.4,18.4,21.1],btn:'#tsLin'},
  u:{y:[18.5,10.7,6.4,2.5,2.3,2.6,6.5,10.8,18.3],btn:'#tsU'}
};
const ts={set:'lin',curve:false};
const term=(v,s)=>{ const r=Math.round(v*100)/100; return `${r<0?'−':'+'} ${fmt(Math.abs(r),2)}${s}`; };
function tsFit(set,curve){
  const Yd=SETS[set].y, c=polyfit(X9,Yd,curve?2:1), f=x=>pval(c,x);
  const m=Yd.reduce((a,b)=>a+b,0)/Yd.length; let sse=0,sst=0,close=0;
  X9.forEach((x,i)=>{ const e=Yd[i]-f(x); sse+=e*e; sst+=(Yd[i]-m)**2; if(Math.abs(e)<=1.5) close++; });
  return {Yd,c,f,sse,close,r2:Math.max(0,1-sse/sst)};
}
const TS_NAME={lin:'Linear dataset',u:'U-shaped dataset'};
const TS_VERDICT={lin0:'Good fit',lin1:'Good fit (x² not needed)',u0:'Bad fit',u1:'Good fit'};
function drawTS(anim){
  const R=tsFit(ts.set,ts.curve), c=R.c, f=R.f;
  $('#tsLin').setAttribute('aria-pressed',ts.set==='lin'); $('#tsU').setAttribute('aria-pressed',ts.set==='u');
  $('#tsLine').setAttribute('aria-pressed',!ts.curve); $('#tsCurve').setAttribute('aria-pressed',ts.curve);
  $('#tsNow').innerHTML=`Showing: <b>${TS_NAME[ts.set]}</b> with a <b>${ts.curve?'curve (line + x²)':'straight line'}</b>`;
  chart($('#tsChart'),{xd:[0,10],yd:[0,24],xt:[0,1,2,3,4,5,6,7,8,9,10],yt:[0,5,10,15,20],xl:'x',yl:'y',noResLbl:true,
    pts:X9.map((x,i)=>[x,R.Yd[i]]),curves:[{f,cls:ts.curve?'c-poly':'c-lin',from:0.3,to:9.7,draw:anim}],resid:X9.map((x,i)=>({x,y:R.Yd[i],yh:f(x),e:R.Yd[i]-f(x)}))});
  $('#tsModel').innerHTML = ts.curve ? `<span class="poly">ŷ = ${fmt(c[0],2)} ${term(c[1],'x')} ${term(c[2],'x²')}</span>` : `<span class="lin">ŷ = ${fmt(c[0],2)} ${term(c[1],'x')}</span>`;
  $('#tsClose').textContent=`${R.close} / 9`; $('#tsClose').style.color = R.close>=8?'var(--ok)':R.close<=3?'var(--bad)':'';
  $('#tsSse').textContent=fmt(R.sse); $('#tsR2').textContent=fmt(R.r2,3);
  const d=ts.curve?2:1;
  $('#tsTable').innerHTML=[['lin',false],['lin',true],['u',false],['u',true]].map(([s,cv])=>{ const r=tsFit(s,cv), k=s+(cv?1:0), good=TS_VERDICT[k].startsWith('Good');
    return `<tr class="${s===ts.set&&cv===ts.curve?'cur':''}" data-s="${s}" data-c="${cv?1:0}"><td>${TS_NAME[s]}</td><td>${cv?'Curve (line + x²)':'Straight line'}</td><td class="num">${r.close} / 9</td><td class="num">${fmt(r.sse)}</td><td class="num">${fmt(r.r2,3)}</td><td style="color:var(--${good?'ok':'bad'});font-weight:600">${TS_VERDICT[k]}</td></tr>`; }).join('');
  $('#tsTable').querySelectorAll('tr').forEach(tr=>tr.onclick=()=>{ ts.set=tr.dataset.s; ts.curve=tr.dataset.c==='1'; drawTS(true); });
  const M={
    'lin1':'The points rise along a straight path, so the best line passes close to all of them. The loss is small and R² is close to 1. <b>A linear model is the right choice for linear data.</b>',
    'u1':'The points form a <b>U</b>. The best possible straight line is almost flat and only crosses the U in two places. Not a single point lies within ±1.5 of it, so the loss is huge and R² is close to 0. <b>A plain linear model cannot follow a curve.</b>',
    'u2':'Same linear regression, plus one extra feature: <b>x²</b>. Now the model can bend, the curve passes close to every point, and the loss drops dramatically.',
    'lin2':'On straight-line data, adding x² barely changes anything because its coefficient comes out close to 0. The extra term does no harm, but it is not needed.'
  };
  $('#tsMsg').innerHTML=M[ts.set+d];
}
$('#tsLin').onclick=()=>{ ts.set='lin'; drawTS(true); };
$('#tsU').onclick=()=>{ ts.set='u'; drawTS(true); };
$('#tsLine').onclick=()=>{ ts.curve=false; drawTS(true); };
$('#tsCurve').onclick=()=>{ ts.curve=true; drawTS(true); };
drawTS(false);

/* ---------- DEGREE SHAPES ---------- */
const SHAPES=[
  {n:'0',f:x=>3,eq:'y = α₀',t:'x⁰ = 1, so every x gives the same y. A flat, constant line.'},
  {n:'1',f:x=>0.6+0.9*x,eq:'y = α₀ + α₁x',t:'A sloped straight line. No bends. This is simple linear regression.'},
  {n:'2',f:x=>0.55*(x-3)**2+0.4,eq:'y = α₀ + α₁x + α₂x²',t:'A parabola with one bend (U or ∩). Quadratic.'},
  {n:'3',f:x=>{const u=x-3; return 0.3*u**3-1.5*u+3;},eq:'y = α₀ + α₁x + α₂x² + α₃x³',t:'A cubic with up to two bends (S-shape).'},
  {n:'4',f:x=>{const u=x-3; return 0.12*u**4-1.1*u**2+3.5;},eq:'y = α₀ + α₁x + … + α₄x⁴',t:'Up to three bends (W or M shape). Each extra degree allows one more bend.'}
];
const sb=$('#shapeBtns');
SHAPES.forEach((s,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn'; b.textContent='Degree '+s.n; b.onclick=()=>setShape(i,true); sb.appendChild(b); });
function setShape(i,anim){
  const s=SHAPES[i]; [...sb.children].forEach((b,j)=>b.setAttribute('aria-pressed',i===j));
  chart($('#shapeChart'),{h:220,xd:[0,6],yd:[-1,7],xt:[],yt:[0,3,6],curves:[{f:s.f,cls:i<2?'c-lin':i===2?'c-poly':'c-over',draw:anim}]});
  $('#shapeEq').textContent=s.eq; $('#shapeTxt').textContent=s.t+' General form for degree n: y = α₀ + α₁x + α₂x² + … + αₙxⁿ.';
}
setShape(2,false);

/* ---------- FEATURE FUNCTION ---------- */
const sup=['','','²','³'];
const fs={nv:1,dg:2,md:'pow'};
function features(){
  const v=fs.nv===1?['x']:['x₁','x₂'], out=[];
  if(fs.md==='pow' || fs.nv===1){ for(let k=1;k<=fs.dg;k++) v.forEach(a=>out.push({t:a+sup[k],k:k>1?'new':''})); }
  else { for(let k=1;k<=fs.dg;k++) for(let a=k;a>=0;a--){ const b=k-a, parts=[]; if(a) parts.push('x₁'+sup[a]); if(b) parts.push('x₂'+sup[b]); out.push({t:parts.join('·'),k:k===1?'':(a&&b?'int':'new')}); } }
  return out;
}
const SKNAMES={1:{1:"['x']",2:"['x' 'x^2']",3:"['x' 'x^2' 'x^3']"},2:{1:"['x1' 'x2']",2:"['x1' 'x2' 'x1^2' 'x1 x2' 'x2^2']",3:"['x1' 'x2' 'x1^2' 'x1 x2' 'x2^2' 'x1^3' 'x1^2 x2' 'x1 x2^2' 'x2^3']"}};
let pTok=0;
function renderF(show){
  document.querySelectorAll('[data-nv]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.nv===fs.nv));
  document.querySelectorAll('[data-dg]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.dg===fs.dg));
  document.querySelectorAll('[data-md]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.md===fs.md));
  const F=features(); $('#pIn').textContent=fs.nv===1?'x':'x₁, x₂'; $('#pCount').textContent=F.length;
  if(show!==false){ $('#fChips').innerHTML=F.map(f=>`<span class="${f.k}">${f.t}</span>`).join(''); }
  $('#fEq').innerHTML='ŷ = α₀ '+F.map((f,i)=>`+ α<sub>${i+1}</sub>${f.t}`).join(' ');
  const orig=fs.nv, added=F.length-orig;
  let note=`<b>${orig}</b> original column${orig>1?'s':''} became <b>${F.length}</b> feature columns (${added} new). Blue chips are the new higher-power features`;
  if(fs.md==='sk'&&fs.nv===2&&fs.dg>1) note+=', purple chips are <b>interaction terms</b> (two variables multiplied together)';
  note+='. The linear model then learns one α for each column.';
  if(fs.md==='pow'&&fs.nv===2&&fs.dg>1) note+=' This "powers only" version matches adding x₁² and x₂² by hand.';
  if(fs.md==='sk'||fs.nv===1) note+=`<br><span class="mono" style="font-size:13px">PolynomialFeatures(degree=${fs.dg}, include_bias=False).fit(X).get_feature_names_out(${fs.nv===1?'["x"]':'["x1", "x2"]'}) → ${SKNAMES[fs.nv][fs.dg]}</span>`;
  $('#fNote').innerHTML=note;
}
async function runPipe(){
  const tok=++pTok, nodes=[...document.querySelectorAll('.pnode')], F=features(), box=$('#fChips');
  nodes.forEach(n=>n.classList.remove('on')); box.innerHTML='';
  for(let i=0;i<nodes.length;i++){
    if(tok!==pTok) return; nodes.forEach(n=>n.classList.remove('on')); nodes[i].classList.add('on');
    if(i===2){ for(const f of F){ if(tok!==pTok) return; const s=document.createElement('span'); s.className=f.k+' pop'; s.textContent=f.t; box.appendChild(s); await wait(380); } }
    await wait(700);
  }
  nodes.forEach(n=>n.classList.remove('on'));
}
document.querySelectorAll('[data-nv]').forEach(b=>b.onclick=()=>{ pTok++; fs.nv=+b.dataset.nv; renderF(); });
document.querySelectorAll('[data-dg]').forEach(b=>b.onclick=()=>{ pTok++; fs.dg=+b.dataset.dg; renderF(); });
document.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{ pTok++; fs.md=b.dataset.md; renderF(); });
$('#pRun').onclick=runPipe;
fs.nv=2; renderF();

/* ---------- WHY ---------- */
const WMSG=[
 'The best straight line is <b class="lin">ŷ = −9.5 + 9.5x</b>. It\'s the least-squares line, so no straight line can do better.',
 'Each vertical segment is a <b>residual</b> (y − ŷ). Green means the line is too low and red means it\'s too high.',
 'Plot only the residuals. The signs go <b>+ + − − +</b>: too low, too high, then too low again. Random errors would be scattered. This U-shape is the curve the line is missing.',
 'Extend the line to speed 0. It predicts <b>−9.5 m</b>, a negative stopping distance for a parked car. That\'s physically impossible.',
 'R² is <b>0.956</b>, which looks excellent. A high R² can still hide the wrong shape, so always check the residual plot as well.'
];
let wStep=0;
function drawWhy(){
  const o={...base,pts:PTS,curves:[],resid:[]};
  if(wStep>=1) o.curves.push({f:lin,cls:'c-lin',from:wStep>=4?0:0.6,to:5.6,draw:wStep===1});
  if(wStep>=2) o.resid=X.map((x,i)=>({x,y:Y[i],yh:lin(x),e:Y[i]-lin(x)}));
  if(wStep>=4) o.marks=[{x:0,y:-9.5,c:'lin',t:'−9.5 m at 0 km/h'}];
  chart($('#whyChart'),o);
  chart($('#resChart'),{h:170,xd:[0,6],yd:[-5,5],xt:[1,2,3,4,5],yt:[-4,0,4],xf:v=>v*10,bars:wStep>=3?X.map((x,i)=>({x,v:Y[i]-lin(x)})):[]});
  $('#wBody').innerHTML=X.map((x,i)=>{ const e=Y[i]-lin(x); return `<tr><td>${x}</td><td>${Y[i]}</td><td>${wStep>=1?fmt(lin(x)):'—'}</td><td class="${wStep>=2?(e>=0?'pos':'neg'):''}">${wStep>=2?sgn(e):'—'}</td></tr>`; }).join('');
  $('#wMsg').innerHTML=wStep?WMSG[wStep-1]:'Press <b>Next evidence</b> to draw the best straight line.';
  $('#wCount').textContent=wStep+' / 5'; $('#wNext').disabled=wStep>=5;
}
$('#wNext').onclick=()=>{ if(wStep<5){ wStep++; drawWhy(); } };
$('#wReset').onclick=()=>{ wStep=0; drawWhy(); };
drawWhy();

/* ---------- FEATURE ---------- */
const fb=$('#fTable tbody');
function fReset(){ fb.innerHTML=X.map((x,i)=>`<tr><td>${x}</td><td class="x2c newcol" hidden></td><td>${Y[i]}</td></tr>`).join(''); document.querySelectorAll('#fTable .x2c').forEach(c=>c.hidden=true); $('#fBtn').disabled=false; $('#fMsg').textContent='One input column becomes two features.'; }
$('#fBtn').onclick=async()=>{
  $('#fBtn').disabled=true; document.querySelectorAll('#fTable .x2c').forEach(c=>c.hidden=false);
  const cells=fb.querySelectorAll('td.x2c');
  for(let i=0;i<X.length;i++){ cells[i].innerHTML=`<span class="pop" style="display:inline-block">${X[i]}×${X[i]} = <b>${X[i]*X[i]}</b></span>`; await wait(650); }
  $('#fMsg').innerHTML='Now linear regression sees <b>two</b> inputs, x and x², and finds one weight for each: b₁ and b₂.';
};
$('#fReset').onclick=fReset; fReset();

/* ---------- EXPLORER ---------- */
const TABS=[
 {n:'Bend (b₂)',en:[0,0,1],v:[1,0.5,0],m:'Only <b class="poly">b₂</b> moves. At b₂ = 0 the curve is a straight line. Push it above 0 and the curve bends upward (U). Below 0 it bends downward (∩).'},
 {n:'Tilt (b₁)',en:[0,1,0],v:[1,0.5,1.5],m:'Only <b class="lin">b₁</b> moves. It tilts the curve: the slope at x = 0. The bend stays the same.'},
 {n:'Shift (b₀)',en:[1,0,0],v:[1,0.5,1.5],m:'Only <b>b₀</b> moves. It lifts or lowers the whole curve without changing its shape. It\'s the prediction at x = 0.'},
 {n:'Free play',en:[1,1,1],v:[0,5,0],m:'All three are unlocked. Try to beat the straight line (SSE 41.5) and get close to the best possible SSE of 10.0.'}
];
const sl=[$('#sb0'),$('#sb1'),$('#sb2')], ol=[$('#ob0'),$('#ob1'),$('#ob2')];
const xt=$('#xTabs'); let snapTok=0;
TABS.forEach((t,i)=>{ const b=document.createElement('button'); b.className='btn'; b.type='button'; b.textContent=t.n; b.onclick=()=>setTab(i); xt.appendChild(b); });
function setTab(i){ snapTok++; [...xt.children].forEach((b,j)=>b.setAttribute('aria-pressed',i===j)); const t=TABS[i]; sl.forEach((s,k)=>{ s.disabled=!t.en[k]; s.value=t.v[k]; }); $('#xMsg').innerHTML=t.m; drawX(); }
function drawX(){
  const [b0,b1,b2]=sl.map(s=>+s.value); ol[0].textContent=fmt(b0); ol[1].textContent=fmt(b1); ol[2].textContent=fmt(b2);
  const f=x=>b0+b1*x+b2*x*x;
  chart($('#xChart'),{...base,pts:PTS,curves:[{f:quad,cls:'c-ghost',from:0,to:6},{f,cls:'c-poly',from:0,to:6}],resid:X.map((x,i)=>({x,y:Y[i],yh:f(x),e:Y[i]-f(x)}))});
  $('#xEq').innerHTML=`ŷ = <b>${fmt(b0)}</b> ${b1<0?'−':'+'} <b class="lin">${fmt(Math.abs(b1))}</b>x ${b2<0?'−':'+'} <b class="poly">${fmt(Math.abs(b2))}</b>x²`;
  let sse=0; $('#xBody').innerHTML=X.map((x,i)=>{ const yh=f(x),e=Y[i]-yh; sse+=e*e; return `<tr><td>${x}</td><td>${Y[i]}</td><td>${fmt(yh)}</td><td class="${e>=0?'pos':'neg'}">${sgn(e)}</td><td>${fmt(e*e)}</td></tr>`; }).join('')+`<tr class="tot"><td colspan="4">SSE</td><td>${fmt(sse)}</td></tr>`;
  $('#xSse').textContent=fmt(sse);
  const w=Math.min(100,Math.log10(1+sse)/Math.log10(1+3000)*100); const fl=$('#xSseF'); fl.style.width=w+'%'; fl.style.background= sse<=10.05?'var(--ok)':sse<41.5?'var(--poly)':'var(--bad)';
}
sl.forEach(s=>s.oninput=()=>{ snapTok++; drawX(); });
$('#xBest').onclick=async()=>{
  const tok=++snapTok; const from=sl.map(s=>+s.value), to=[1,0.5,1.5]; const N=reduce?1:40;
  for(let k=1;k<=N;k++){ if(tok!==snapTok) return; const t=k/N, e=1-Math.pow(1-t,3); sl.forEach((s,j)=>s.value=from[j]+(to[j]-from[j])*e); drawX(); await wait(30); }
  sl.forEach((s,j)=>s.value=to[j]); drawX(); $('#xMsg').innerHTML='Best fit: <b>ŷ = 1 + 0.5x + 1.5x²</b>, SSE = 10.0. No other values of b₀, b₁, b₂ do better, and the next section proves it by hand.';
};
setTab(0);

/* ---------- MATH STEPPER ---------- */
const steps=[...document.querySelectorAll('.mstep')]; const bar=$('#mBar');
steps.forEach(()=>bar.appendChild(document.createElement('i')));
let mI=0, mTok=0;
const sumBody=$('#sumTable tbody');
function sumRows(n){
  let r=''; const tot=[0,0,0,0,0,0,0];
  X.forEach((x,i)=>{ const v=[x,x*x,x**3,x**4,Y[i],x*Y[i],x*x*Y[i]]; v.forEach((a,j)=>tot[j]+=a); if(i<n) r+=`<tr class="${i===n-1?'pop':''}"><td>${v.join('</td><td>')}</td></tr>`; });
  if(n>=X.length) r+=`<tr class="tot"><td>Σx = ${tot[0]}</td><td>${tot[1]}</td><td>${tot[2]}</td><td>${tot[3]}</td><td>${tot[4]}</td><td>${tot[5]}</td><td>${tot[6]}</td></tr>`;
  sumBody.innerHTML=r;
}
async function fillSums(tok){ for(let n=1;n<=X.length+1;n++){ if(tok!==mTok) return; sumRows(n); await wait(550); } }
function renderM(){ steps.forEach((s,i)=>{ s.classList.toggle('off',i>=mI); s.classList.toggle('cur',i===mI-1); }); [...bar.children].forEach((b,i)=>b.classList.toggle('on',i<mI)); $('#mNext').disabled=mI>=steps.length; }
function mNext(){ if(mI>=steps.length) return; mI++; renderM(); if(mI===2) fillSums(mTok); const cur=steps[mI-1]; const r=cur.getBoundingClientRect(); if(r.top<60||r.bottom>innerHeight) cur.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); }
$('#mNext').onclick=()=>{ mNext(); };
$('#mPlay').onclick=async()=>{ const tok=++mTok; if(mI>=steps.length){ mI=0; sumRows(0); renderM(); } while(mI<steps.length && tok===mTok){ mNext(); await wait(mI===2?4200:2600); } };
$('#mReset').onclick=()=>{ mTok++; mI=0; sumRows(0); renderM(); };
sumRows(0); renderM();

/* ---------- PREDICT ---------- */
function drawP(){
  const x=+$('#sSpeed').value, yl=lin(x), yp=quad(x);
  $('#oSpeed').textContent=`${x*10} km/h (x = ${x})`;
  chart($('#pChart'),{xd:[0,10],yd:[-15,160],xt:[0,2,4,6,8,10],yt:[0,40,80,120,160],xl:'Speed (km/h)',yl:'Stopping distance (m)',xf:v=>v*10,zones:[[5.5,10,'outside the data']],pts:PTS,
    curves:[{f:lin,cls:'c-lin'},{f:quad,cls:'c-poly'}],marks:[{x,y:yl,c:'lin',t:fmt(yl)+' m',left:x>5},{x,y:yp,c:'poly',t:fmt(yp)+' m',left:x>5}]});
  $('#pLin').innerHTML=`<span class="lin">Line:</span> ŷ = −9.5 + 9.5(${x}) = <b class="lin">${fmt(yl)} m</b>`;
  $('#pPoly').innerHTML=`<span class="poly">Curve:</span> ŷ = 1 + 0.5(${x}) + 1.5(${x})² = 1 + ${fmt(0.5*x,2)} + ${fmt(1.5*x*x,2)} = <b class="poly">${fmt(yp)} m</b>`;
  $('#pMsg').innerHTML = x<1 ? '' : x<=5 ? `Inside the measured range, the two models are within <b>${fmt(Math.abs(yp-yl))} m</b> of each other.`
    : `This is <b>extrapolation</b>: we never measured ${x*10} km/h. The gap between the models is now <b>${fmt(yp-yl)} m</b>. The curve follows the physics, but any model gets less reliable the further you go from the data.`;
}
$('#sSpeed').oninput=drawP; drawP();

/* ---------- DEGREE ---------- */
function polyfit(xs,ys,d){
  const m=d+1, A=[...Array(m)].map(()=>Array(m+1).fill(0));
  for(let i=0;i<m;i++){ for(let j=0;j<m;j++) A[i][j]=xs.reduce((s,x)=>s+x**(i+j),0); A[i][m]=xs.reduce((s,x,k)=>s+ys[k]*x**i,0); }
  for(let c=0;c<m;c++){ let p=c; for(let r=c+1;r<m;r++) if(Math.abs(A[r][c])>Math.abs(A[p][c])) p=r; [A[c],A[p]]=[A[p],A[c]];
    for(let r=0;r<m;r++){ if(r===c) continue; const f=A[r][c]/A[c][c]; for(let k=c;k<=m;k++) A[r][k]-=f*A[c][k]; } }
  return A.map((row,i)=>row[m]/row[i]);
}
const pv=(c,x)=>c.reduce((s,a,i)=>s+a*x**i,0);
const DEG=[
 {d:1,tag:['u','Underfit'],cls:'c-lin',color:'var(--lin)',msg:'<b>Too simple.</b> The line misses the curve, so both training and test errors are high. More data won\'t fix this. The model can\'t bend.'},
 {d:2,tag:['g','Good fit'],cls:'c-poly',color:'var(--ok)',msg:'<b>Just right.</b> Training error is small, and the test error is tiny too (about 1). The curve learned the real pattern, not the noise.'},
 {d:3,tag:['o','Overfit'],cls:'c-over',color:'var(--over)',msg:'<b>Too flexible.</b> It passes through every training point (error 0), but at 60 km/h it predicts 72 m instead of 57 m. It memorised the noise and generalises badly.'}
];
const FIT=DEG.map(g=>{ const c=polyfit(X,Y,g.d); const tr=X.reduce((s,x,i)=>s+(Y[i]-pv(c,x))**2,0), te=TX.reduce((s,x,i)=>s+(TY[i]-pv(c,x))**2,0); return {c,tr,te}; });
const maxTe=Math.max(...FIT.map(f=>f.te));
const dc=$('#degCards');
DEG.forEach((g,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='dc'; b.innerHTML=`<span class="tag ${g.tag[0]}">${g.tag[1]}</span><b>Degree ${g.d}</b><span>train ${fmt(FIT[i].tr)} · test ${fmt(FIT[i].te)}</span>`; b.onclick=()=>setDeg(i); dc.appendChild(b); });
function setDeg(i){
  const g=DEG[i], F=FIT[i];
  [...dc.children].forEach((b,j)=>b.setAttribute('aria-pressed',i===j));
  chart($('#dChart'),{xd:[0,6.5],yd:[-15,80],xt:[0,1,2,3,4,5,6],yt:[0,20,40,60,80],xl:'Speed (km/h)',yl:'Stopping distance (m)',xf:v=>v*10,pts:PTS,tpts:TX.map((x,k)=>[x,TY[k]]),curves:[{f:x=>pv(F.c,x),cls:g.cls,from:0.3,to:6.5,draw:true}]});
  $('#dTr').textContent=fmt(F.tr); $('#dTe').textContent=fmt(F.te);
  $('#dTrF').style.width=Math.max(1,F.tr/maxTe*100)+'%'; const te=$('#dTeF'); te.style.width=Math.max(1,F.te/maxTe*100)+'%'; te.style.background=g.color;
  $('#dMsg').innerHTML=g.msg;
  $('#dBody').innerHTML=TX.map((x,k)=>`<tr><td>${x*10} km/h</td><td>${TY[k]} m</td><td>${fmt(pv(F.c,x))} m</td></tr>`).join('');
}
setDeg(1);

/* ---------- PYTHON ---------- */
const lines=[...document.querySelectorAll('#rOut div')]; let rTok=0;
$('#rRun').onclick=async()=>{ const t=++rTok; lines.forEach(l=>l.classList.remove('on')); for(const l of lines){ await wait(280); if(t!==rTok) return; l.classList.add('on'); } };
$('#rClear').onclick=()=>{ rTok++; lines.forEach(l=>l.classList.remove('on')); };

/* ---------- QUIZ ---------- */
const QZ=[
 {q:'When should you consider polynomial regression instead of simple linear regression?',o:['When the dataset is very large','When the relationship between x and y is curved','When y is a category (yes/no)','When there are missing values'],a:1,e:'Polynomial regression lets the fitted line bend, so it suits curved relationships such as stopping distance vs speed.'},
 {q:'What is the degree of the model ŷ = b₀ + b₁x + b₂x²?',o:['1','2','3','0'],a:1,e:'The degree is the highest power of x. Here that is x², so degree 2.'},
 {q:'Why is polynomial regression still called a "linear" model?',o:['Because its graph is a straight line','Because it is linear in its coefficients b₀, b₁, b₂','Because it only uses one feature','Because the residuals are linear'],a:1,e:'x² is treated as a new feature. The equation is a weighted sum of features, which is linear in the b values, so ordinary least squares works.'},
 {q:'A straight line\'s residuals have signs + + − − +. What does this tell you?',o:['The model is perfect','The data has missing values','The model is missing a curve in the data','The learning rate is too high'],a:2,e:'A systematic pattern in residuals means the model has the wrong shape. Random errors would have no pattern.'},
 {q:'Using ŷ = 1 + 0.5x + 1.5x², what is ŷ when x = 4?',o:['9','19','27','25'],a:2,e:'ŷ = 1 + 0.5(4) + 1.5(16) = 1 + 2 + 24 = 27.'},
 {q:'A degree-3 model has training error 0 but a much higher test error than degree 2. This is called…',o:['Underfitting','Overfitting','Regularisation','Extrapolation'],a:1,e:'Very low training error with high test error means the model memorised the training noise. That is overfitting.'},
 {q:'Which scikit-learn class creates the x² (and higher) columns?',o:['StandardScaler','LinearRegression','PolynomialFeatures','train_test_split'],a:2,e:'PolynomialFeatures(degree=2) turns x into [1, x, x²]. LinearRegression then fits the coefficients.'},
 {q:'With PolynomialFeatures(degree=3) (bias included), what does x = 2 become?',o:['[2, 4, 8]','[1, 2, 4, 8]','[1, 2, 3]','[2, 4, 6, 8]'],a:1,e:'The columns are 1, x, x², x³ → 1, 2, 4, 8.'},
 {q:'How many normal equations must you solve for a degree-2 polynomial?',o:['1','2','3','4'],a:2,e:'There are three unknowns (b₀, b₁, b₂), so you need three equations.'},
 {q:'What does a degree-0 polynomial look like?',o:['A flat line: y = α₀ (a constant)','A sloped straight line','A parabola','A U-shape with two bends'],a:0,e:'With degree 0 every x has power 0, and x⁰ = 1, so y = α₀ is the same constant for every x.'},
 {q:'Data has 2 input columns (x₁, x₂). With PolynomialFeatures(degree=2, include_bias=False), how many feature columns do you get?',o:['2','4','5','6'],a:2,e:'You get x₁, x₂, x₁², x₁·x₂, x₂², which is 5. Adding only the squares by hand gives 4, but sklearn also adds the interaction term x₁·x₂.'},
 {q:'A straight line has R² = 0.956 on curved data. What is the right conclusion?',o:['The model is correct because R² is above 0.9','A high R² alone doesn\'t prove the shape is right, so check the residuals','R² must be 1 for any model to be useful','R² is not defined for regression'],a:1,e:'R² can be high even when the model has the wrong shape. The residual pattern revealed the missing curve.'}
];
const ql=$('#qList');
QZ.forEach((q,i)=>{ const f=document.createElement('fieldset'); f.className='q'; f.id='q'+i;
  f.innerHTML=`<legend><span>Q${i+1}</span>${q.q} <em>*</em></legend><div class="opts">${q.o.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}" id="q${i}o${j}"> <span>${o}</span></label>`).join('')}</div><div class="fb" hidden></div>`; ql.appendChild(f); });
const safe=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
$('#qForm').addEventListener('submit',e=>{
  e.preventDefault(); const nm=$('#qName'), em=$('#qEmail'), errs=[];
  nm.classList.toggle('invalid',!nm.value.trim()); if(!nm.value.trim()) errs.push('your name');
  const eok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim()); em.classList.toggle('invalid',!eok); if(!eok) errs.push('a valid email');
  const miss=[]; QZ.forEach((q,i)=>{ const c=document.querySelector(`input[name=q${i}]:checked`); $('#q'+i).classList.toggle('missing',!c); if(!c) miss.push('Q'+(i+1)); });
  if(miss.length) errs.push('answers for '+miss.join(', '));
  if(errs.length){ $('#qErr').textContent='Please add '+errs.join(' and ')+'.'; return; }
  $('#qErr').textContent=''; let score=0;
  QZ.forEach((q,i)=>{ const v=+document.querySelector(`input[name=q${i}]:checked`).value, ok=v===q.a; if(ok) score++;
    const box=$('#q'+i); box.querySelectorAll('label').forEach((l,j)=>{ l.classList.toggle('is-right',j===q.a); l.classList.toggle('is-wrong',j===v&&!ok); l.querySelector('input').disabled=true; });
    const fbk=box.querySelector('.fb'); fbk.hidden=false; fbk.className='fb '+(ok?'ok':'no');
    fbk.innerHTML= ok?`<b>Correct (+1).</b> ${q.e}`:`<b>Incorrect (0).</b> Correct answer: <b>${q.o[q.a]}</b>. ${q.e}`; });
  $('#qScore').innerHTML=`<div class="score"><span class="big">${score} / ${QZ.length}</span><div><div><b>${safe(nm.value.trim())}</b> · ${safe(em.value.trim())}</div><div class="note">${score===QZ.length?'Perfect score.':score>=7?'Well done. Review the questions marked in red above.':'Revisit the "Why a straight line isn\'t enough" and "Choosing the degree" sections, then try again.'}</div></div></div>`;
  $('#qSubmit').disabled=true; $('#qRetry').hidden=false; nm.disabled=true; em.disabled=true;
  $('#qScore').scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
});
$('#qRetry').onclick=()=>{
  QZ.forEach((q,i)=>{ const box=$('#q'+i); box.classList.remove('missing'); box.querySelectorAll('label').forEach(l=>{ l.classList.remove('is-right','is-wrong'); const inp=l.querySelector('input'); inp.disabled=false; inp.checked=false; }); box.querySelector('.fb').hidden=true; });
  $('#qScore').innerHTML=''; $('#qSubmit').disabled=false; $('#qRetry').hidden=true; $('#qName').disabled=false; $('#qEmail').disabled=false;
  $('#q0').scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
};
})();

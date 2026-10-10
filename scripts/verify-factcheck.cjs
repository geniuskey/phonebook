const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const rf=read('chapters/rf.html');const start=rf.indexOf('  /* ================================================================ 12. Chu');const end=rf.indexOf('  })();',start)+'  })();'.length;assert(start>=0&&end>start);
let cases=0;
for(const [frequency,radius,efficiency,state] of [[750,12,.6,'미달'],[750,30,.6,'저촉 없음'],[750,80,.6,'판정 불가'],[3600,85,.1,'판정 불가'],[600,3,1,'미달']]){
 const values={'chu-f':frequency,'chu-a':radius,'chu-e':efficiency},stats={};let draw,chart;
 const PB={range:id=>()=>values[id],canvas:(_,cb)=>{draw=cb;return{redraw(){cb({})}}},stat:(id,v)=>stats[id]=v,fmt:String,palette:()=>({}),chart:(_,__,v)=>chart=v};
 vm.runInNewContext(rf.slice(start,end),{PB,document:{querySelectorAll:()=>[]},$:()=>({}),TAU:2*Math.PI});
 assert(stats['chu-ok'].includes(state),JSON.stringify({values,stats}));
 if(frequency*radius*2*Math.PI/300000>=1)assert.equal(stats['chu-bw'],'근사 범위 밖');
 const active=chart.series[2].data.filter(p=>Number.isFinite(p[1]));
 for(const [f,bw] of active){assert(f*radius*2*Math.PI/300000<1);assert(bw<100);}
 if(stats['chu-bw']==='근사 범위 밖')assert.equal(chart.points.length,0);cases++;
}
// The stated low-temperature ratio uses the actual model's same 25 C reference.
const battery=read('chapters/battery.html');assert(battery.includes('0 °C에서 약 2.5배'));assert(battery.includes('298.15\\ \\text{K}'));
const ratio=Math.exp(3000*(1/273.15-1/298.15));assert(ratio>2.51&&ratio<2.52);
let scripts=0;for(const f of fs.readdirSync(path.join(root,'chapters')).filter(f=>f.endsWith('.html')))for(const m of read('chapters/'+f).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[1].includes('src='))continue;if(m[1].includes('ld+json'))JSON.parse(m[2]);else new vm.Script(m[2],{filename:f});scripts++;}
console.log({chuBoundaryCases:cases,resistanceAt0C:ratio,compiledScriptBlocks:scripts});
// DCR control must change resistance, preserving L and ripple at fixed voltage/frequency.
const power=read('chapters/power.html'),pctx={};
const ba=power.indexOf('  function buckLoss('),bb=power.indexOf('  /* ================================================== 1.',ba);
vm.runInNewContext(power.slice(ba,bb),pctx);
let buckCases=0;
for(const vo of [.5,1,3.3])for(const f of [1e6,2.4e6,6e6])for(const I of [.001,.01,.1,1,3])for(const mode of ['pwm','auto']){
 const lo=pctx.buckLoss(3.85,vo,I,f,.47e-6,mode,25e-6,.01),hi=pctx.buckLoss(3.85,vo,I,f,.47e-6,mode,25e-6,.12);
 assert.equal(lo.dcr,.01);assert.equal(hi.dcr,.12);assert.equal(lo.dI,hi.dI);assert.equal(lo.fe,hi.fe);assert(lo.eta>hi.eta);
 if(mode==='pwm')assert(Math.abs((hi.loss-lo.loss)-(I*I+lo.dI*lo.dI/12)*.11)<1e-12);buckCases++;
}
const ma=power.indexOf('    function model(I, mode)'),mb=power.indexOf('    const cv =',ma);
for(const dcr of [10,40,120]){
 const ctx={buckLoss:pctx.buckLoss,gvo:()=>1,gf:()=>2.4,giq:()=>25,gd:()=>dcr};vm.runInNewContext(power.slice(ma,mb),ctx);
 const r=ctx.model(1,'pwm');assert.equal(r.dcr,dcr*1e-3);assert(Math.abs(r.dI-(3.85-1)*(1/3.85)/(.47e-6*2.4e6))<1e-12);buckCases++;
}
// Additional unchanged thermal solver audit: steady-state output heat equals imposed source.
const thermal=read('chapters/thermal.html'),ta=thermal.indexOf('    function solve2D('),tb=thermal.indexOf('    function upd()',ta),tc={};
vm.runInNewContext('const NXg=120,NY=10,DXg=.5e-3,HT=300,QF=20000;'+thermal.slice(ta,tb),tc);
let thermalCases=0;for(const [kx,ky,t]of[[1500,5,70e-6],[1900,5,300e-6],[390,390,300e-6],[.3,.3,20e-6]]){
 const field=tc.solve2D(kx,ky,t);let heatOut=0;for(let i=0;i<120;i++)heatOut+=.15*field[i*10+9];
 assert(field.every(x=>Number.isFinite(x)&&x>=-1e-7));assert(Math.abs(heatOut-200)/200<.002);thermalCases++;
}
console.log({buckCases,thermalCases});

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

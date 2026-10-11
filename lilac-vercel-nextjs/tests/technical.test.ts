import test from 'node:test';
import assert from 'node:assert/strict';
import {indicators} from '../lib/market.ts';
import {analyzeTechnical,atr14,ema,historicalVolatility,scoreStage,stages,bollingerAssessment} from '../lib/technical.ts';
import {judgment,judgmentLabels} from '../lib/judgment.ts';
import {trendIndicators,trendConfirmation} from '../lib/trend-indicators.ts';
import {reportedEBITDA,formatEBITDA} from '../lib/fundamentals.ts';
import {balancedScore,type ScoreConditions} from '../lib/scoring.ts';
import {sectionAtPosition} from '../lib/navigation.ts';

const now=1791716400;
const bars=(count=100,delta=.1)=>indicators(Array.from({length:count},(_,i)=>({time:now-(count-1-i)*86400,open:100+i*delta,high:101+i*delta,low:99+i*delta,close:100+i*delta,volume:100})));
const near=(a:number|null,b:number)=>assert.ok(a!==null&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
const healthy:ScoreConditions={trend:80,stability:80,weakAverage:false,weakMomentum:false,weakADX:false,downDMI:false,strongDowntrend:false,cloud:'above',weakIchimoku:false,overheat:false,extremeOverheat:false,band:'inside',lowVolume:false,supportBroken:false};
test('balanced score uses modest deductions for mild signals, grouped to avoid excess',()=>{
 assert.equal(balancedScore(healthy).score,80);assert.equal(balancedScore({...healthy,weakADX:true}).score,78);
 assert.equal(balancedScore({...healthy,weakMomentum:true,lowVolume:true}).score,77);
 assert.equal(balancedScore({...healthy,weakAverage:true,weakMomentum:true,weakADX:true,downDMI:true,cloud:'inside',overheat:true,lowVolume:true}).score,68);
 assert.equal(balancedScore({...healthy,trend:60,stability:80}).score,66);
});
test('balanced score retains major-risk ceilings and bounded outputs',()=>{
 assert.equal(balancedScore({...healthy,supportBroken:true}).score,54);
 assert.equal(balancedScore({...healthy,strongDowntrend:true}).score,44);
 assert.ok(balancedScore({...healthy,stability:10}).score<=44);
 assert.equal(balancedScore({...healthy,trend:100,stability:100,extremeOverheat:true}).score,74);
 assert.equal(balancedScore({...healthy,trend:0,stability:0,cloud:'below',band:'below',weakAverage:true}).score,0);
});
test('navigation selects the last section reached at the header marker',()=>{
 const tops=[{id:'analysis' as const,top:400},{id:'learn' as const,top:2400},{id:'premium' as const,top:3000}];
 assert.equal(sectionAtPosition(tops,0),'analysis');assert.equal(sectionAtPosition(tops,2400),'learn');assert.equal(sectionAtPosition(tops,2999),'learn');assert.equal(sectionAtPosition(tops,3000),'premium');
});
test('ADX Wilder warmup, directional exclusivity, and strong downtrend are handled',()=>{
 const up=bars(100,1);assert.equal(up[13].plusDI,null);near(up[14].plusDI,50);near(up[14].minusDI,0);assert.equal(up[26].adx,null);near(up[27].adx,100);
 const down=bars(100,-.5).at(-1)!;near(down.adx,100);assert.ok(down.minusDI!>down.plusDI!);
 const c=trendConfirmation(down,down.close,100,100);assert.equal(c.strength,0);assert.equal(c.dmi,0);
 const t=analyzeTechnical(bars(100,-.5),{now});assert.ok(t.score!==null&&t.score<=34);
 const outside=trendIndicators(Array.from({length:40},(_,i)=>({open:100,close:100,high:101+i,low:99-i})));near(outside.at(-1)!.plusDI,0);near(outside.at(-1)!.minusDI,0);near(outside.at(-1)!.adx,0);
});
test('Ichimoku cloud aligns 26 sessions back and avoids future lookahead',()=>{
 const b=bars(100,1);assert.equal(b[76].cloudB,null);near(b[77].cloudA,142.75);near(b[77].cloudB,125.5);near(b[77].tenkan,173);near(b[77].kijun,164.5);
 const prefix=indicators(b.slice(0,78));assert.equal(prefix.at(-1)!.cloudA,b[77].cloudA);assert.equal(prefix.at(-1)!.cloudB,b[77].cloudB);assert.equal(prefix.at(-1)!.adx,b[77].adx);
 const changed=indicators(b.map((x,i)=>i>77?{...x,high:10000,low:9000,close:9500}:x));assert.deepEqual(changed[77],b[77]);
 const t=analyzeTechnical(b.slice(0,77),{now});assert.equal(t.score,null);assert.ok(t.limits.some(s=>s.includes('78')));
});
test('TTM EBITDA preserves negative and zero values, currency and period; never invents missing data',()=>{
 const row=(value:number,date='2026-06-30',currency='USD',periodType='TTM')=>({asOfDate:date,currencyCode:currency,periodType,reportedValue:{raw:value}});
 const m=reportedEBITDA([row(1,'2025-06-30'),row(-200000000)]);assert.equal(m?.value,-200000000);assert.equal(m?.date,'2026-06-30');assert.equal(formatEBITDA(m!),'-2억 달러');
 assert.equal(reportedEBITDA([row(0,'2026-06-30','KRW')])?.value,0);assert.equal(reportedEBITDA([row(5,'2026-06-30','KRW','3M')]),null);assert.equal(reportedEBITDA([]),null);assert.equal(reportedEBITDA([row(NaN)]),null);assert.equal(reportedEBITDA([row(1,'2026-06-30','')]),null);
});
test('five judgments classify 0.99 volume as below average and preserve all boundaries',()=>{
 const bounds=[.5,1,1.1,1.5];assert.equal(judgmentLabels[judgment(.99,bounds)!],'평균이하');
 for(const [v,g] of [[.49,0],[.5,1],[1,2],[1.1,3],[1.5,4]])assert.equal(judgment(v,bounds),g);
 assert.equal(judgment(null,bounds),null);assert.equal(judgment(NaN,bounds),null);
});
test('Bollinger gives full credit only with confirmation away from band extremes',()=>{
 assert.equal(bollingerAssessment(.7,true).points,15);assert.equal(bollingerAssessment(.7,false).points,6);
 assert.equal(bollingerAssessment(.5,false).points,9);assert.equal(bollingerAssessment(.95,true).points,9);
 assert.equal(bollingerAssessment(1.01,true).points,0);assert.equal(bollingerAssessment(-.01,true).points,0);
});
test('band breaches remove band credit and retain warnings',()=>{
 const b=bars(100,.1),last=b.at(-1)!;
 const upper=[...b.slice(0,-1),{...last,bbUpper:last.close-1,bbLower:last.close-10}];
 const lower=[...b.slice(0,-1),{...last,bbUpper:last.close+10,bbLower:last.close+1}];
 const up=analyzeTechnical(upper,{now}),down=analyzeTechnical(lower,{now});
 assert.ok(up.score!==null&&up.score<=100);assert.ok(down.score!==null&&down.score<=100);
 assert.ok(up.warnings.some(w=>w.includes('상단')));assert.ok(down.warnings.some(w=>w.includes('하단 밖')));
 for(const delta of [-.2,.1,.5]){const t=analyzeTechnical(bars(100,delta),{now});assert.ok(t.score!==null&&t.score<=100);assert.equal(t.parts.reduce((s,p)=>s+p.max,0),100);assert.equal(t.parts.find(p=>p.label==='볼린저밴드')?.max,10);}
 const missing=[...b.slice(0,-1),{...last,bbUpper:null}];assert.equal(analyzeTechnical(missing,{now}).score,null);
 const flat=bars(100,0);assert.equal(analyzeTechnical(flat,{now}).score,null);
});
test('slightly below-average volume does not automatically cap the score',()=>{
 for(const delta of [-.1,.1,.3]){const b=bars(100,delta);b[b.length-1].volume=99;const t=analyzeTechnical(b,{now});assert.ok(t.score!==null&&t.score<=100);}
});
test('nine score tiers cover every integer without gaps at all boundaries',()=>{
 assert.equal(stages.length,9);
 for(let score=0;score<=100;score++){const expected=[10,20,35,45,55,65,75,90].filter(c=>score>=c).length+1;assert.equal(scoreStage(score),expected);}
 assert.equal(stages[scoreStage(100)-1].label,'강력매수');assert.equal(stages[scoreStage(0)-1].label,'강력매도');
});
test('SMA windows and Bollinger population deviation match known values with null warmup',()=>{
 const b=bars(220,1);
 assert.equal(b[18].bbUpper,null);assert.equal(b[48].ma50,null);assert.equal(b[198].ma200,null);
 near(b[19].ma20,109.5);near(b[49].ma50,124.5);near(b[199].ma200,199.5);
 near(b[19].bbUpper,109.5+2*Math.sqrt(33.25));near(b[19].bbLower,109.5-2*Math.sqrt(33.25));
 const flat=bars(200,0).at(-1)!;near(flat.bbUpper,100);near(flat.bbLower,100);near(flat.ma200,100);
});
test('SMA-seeded EMA of a linear series has the known lag, MACD 12/26 equals 7',()=>{
 const seq=Array.from({length:65},(_,i)=>i+1);
 assert.equal(ema(seq,12)[10],null);near(ema(seq,12)[11],6.5);near(ema(seq,12).at(-1)!,59.5);near(ema(seq,26).at(-1)!,52.5);
 const b=indicators(seq.map((close,i)=>({time:now-(64-i)*86400,open:close,high:close+1,low:Math.max(.1,close-1),close,volume:100})));
 const result=analyzeTechnical(b,{now});near(result.macd,7);near(result.signal,7);near(result.histogram,0);
});
test('ATR includes price gaps and applies Wilder smoothing',()=>{
 const b=bars(16,0).map(x=>({...x,open:10,close:10,high:11,low:9}));
 b[14]={...b[14],open:15,close:15,high:16,low:14};b[15]={...b[15],open:15,close:15,high:16,low:14};
 const values=atr14(b);assert.equal(values[13],null);near(values[14],32/14);near(values[15],(32/14*13+2)/14);
});
test('20-log-return sample variance and annualisation match a hand calculation',()=>{
 const closes=Array.from({length:21},(_,i)=>100*Math.exp(i%2?.1:0));
 near(historicalVolatility(closes),Math.sqrt(20*.01/19)*Math.sqrt(252)*100);
 near(historicalVolatility(Array(21).fill(100)),0);assert.equal(historicalVolatility(Array(20).fill(100)),null);
});
test('volume denominator and support exclude the evaluation bar; downside volume is not bullish',()=>{
 const b=bars();b[b.length-1]={...b.at(-1)!,volume:300,low:20,close:21,open:21,high:22};
 const t=analyzeTechnical(b,{now});near(t.volumeRatio,3);near(t.averageVolume,100);near(t.support,106.9);
 assert.equal(t.supportBroken,true);assert.equal(t.parts.find(x=>x.label==='상승 거래량 확인')?.points,0);assert.ok(t.score!==null&&t.score<=39);
 const sameSupport=analyzeTechnical([...b.slice(0,-1),{...b.at(-1)!,low:10}],{now});assert.equal(sameSupport.support,t.support);
});
test('insufficient, missing, zero-denominator, stale, and split data suppress the score',()=>{
 assert.equal(analyzeTechnical(bars(64),{now}).score,null);
 const missing=bars();missing[missing.length-10].volume=null;assert.equal(analyzeTechnical(missing,{now}).score,null);
 const zero=bars().map(b=>({...b,volume:0}));assert.equal(analyzeTechnical(zero,{now}).score,null);
 assert.equal(analyzeTechnical(bars(),{now:now+8*86400}).score,null);
 assert.equal(analyzeTechnical(bars(),{now,splitDetected:true}).score,null);
});
test('overheat caps composite score, while all component sums are reproducible',()=>{
 const t=analyzeTechnical(bars(100,.3),{now});assert.ok(t.score!==null&&t.score<=74);
 assert.equal(t.trendScore,t.parts.reduce((s,p)=>s+p.points,0));assert.equal(t.stabilityScore,t.stabilityParts.reduce((s,p)=>s+p.points,0));
 for(const p of [...t.parts,...t.stabilityParts])assert.ok(p.points>=0&&p.points<=p.max);
 assert.equal(t.actions.length,3);assert.ok(t.reviewLevel!==null&&t.bufferLevel!==null&&t.bufferLevel<=t.reviewLevel);assert.ok(t.management.includes('참고선'));
});
test('MACD signal is withheld until both EMA warmups are available',()=>{
 const b=bars(33);const t=analyzeTechnical(b,{now});assert.ok(t.macd!==null);assert.equal(t.signal,null);assert.equal(t.score,null);
 const completed=analyzeTechnical(bars(34),{now});assert.ok(completed.signal!==null);assert.equal(completed.score,null);
});

import test from 'node:test';import assert from 'node:assert/strict';
import {extraIndicators} from '../lib/extra-indicators.ts';
import {combineFundamentals} from '../lib/combined-score.ts';
import {analyzeTechnical} from '../lib/technical.ts';
import {indicators} from '../lib/market.ts';
test('slow stochastic warmup and constant known range; pivot only uses previous bar',()=>{
 const rows=Array.from({length:30},()=>({high:20,low:10,close:15}));const x=extraIndicators(rows);
 assert.equal(x[13].stochK,null);assert.equal(x[15].stochK,50);assert.equal(x[16].stochD,null);assert.equal(x[17].stochD,50);
 assert.equal(x[1].pivot,15);assert.equal(x[1].pivotS1,10);assert.equal(x[1].pivotR1,20);
 rows[29]={high:100,low:1,close:50};assert.equal(extraIndicators(rows)[29].pivot,x[29].pivot);
 assert.equal(extraIndicators(Array.from({length:30},()=>({high:10,low:10,close:10})))[29].stochK,null);
});
test('fundamentals blend verified data and preserve risk ceilings; missing/stale/ETF data do not invent a score',()=>{
 const now=Date.UTC(2026,9,12),date='2026-06-30';
 const b=indicators(Array.from({length:100},(_,i)=>({time:now/1000-(99-i)*86400,open:100+i*.3,close:100+i*.3,high:102+i*.3,low:98+i*.3,volume:1000}))),t={...analyzeTechnical(b,{now:now/1000}),warnings:[]};assert.notEqual(t.score,null);
 const f={per:{value:20,date},pbr:{value:2,date},roe:{value:15,date},ebitda:{value:100,date,currency:'USD'}};
 const a=combineFundamentals(t,f,false,now);assert.equal(a.fundamentalScore,100);assert.equal(a.score,Math.round(t.score!*.75+25));
 assert.ok(combineFundamentals({...t,supportBroken:true},f,false,now).score!<=54);
 assert.equal(combineFundamentals(t,{per:null,pbr:null,roe:null,ebitda:null},false,now).score,t.score);
 assert.equal(combineFundamentals(t,f,true,now).fundamentalScore,null);
 assert.equal(combineFundamentals(t,{...f,per:{value:20,date:'2020-01-01'},pbr:null,roe:null},false,now).fundamentalScore,null);
 assert.equal(combineFundamentals({...t,score:null},f,false,now).score,null);
 const giant=combineFundamentals(t,{...f,ebitda:{value:1e15,date,currency:'USD'}},false,now);assert.equal(giant.fundamentalScore,a.fundamentalScore);
});

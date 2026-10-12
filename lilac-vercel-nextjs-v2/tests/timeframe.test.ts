import test from 'node:test';import assert from 'node:assert/strict';
import {annualizeChart,barEnd,frameSettings} from '../lib/timeframe.ts';
import {historicalVolatility} from '../lib/technical.ts';
import {evaluatePrice} from '../lib/evaluate-price.ts';
test('year bars preserve OHLC and summed volume, with unknown volume kept unknown',()=>{
 const ts=[Date.UTC(2023,0,1)/1000,Date.UTC(2023,1,1)/1000,Date.UTC(2024,0,1)/1000];
 const r=annualizeChart({meta:{gmtoffset:0},timestamp:ts,indicators:{quote:[{open:[10,12,20],high:[13,16,23],low:[8,11,18],close:[12,15,21],volume:[100,200,null]}]}});
 assert.equal(r.timestamp.length,2);assert.deepEqual(r.indicators.quote[0],{open:[10,20],high:[16,23],low:[8,18],close:[15,21],volume:[300,null]});assert.equal(frameSettings('1y').interval,'1mo');
});
test('unfinished intraday bars end at the session close; month/year boundaries are calendar based',()=>{
 const start=Date.UTC(2026,9,9,13,30)/1000,end=start+6.5*3600;
 assert.equal(barEnd(end-1800,'60m',{currentTradingPeriod:{regular:{start,end}}}),end);
 assert.equal(barEnd(Date.UTC(2026,1,1)/1000,'1mo',{}),Date.UTC(2026,2,1)/1000);
 assert.equal(barEnd(Date.UTC(2026,0,1)/1000,'1y',{}),Date.UTC(2027,0,1)/1000);
});
test('volatility annualisation follows selected period count and unfinished hour is excluded',()=>{
 const closes=Array.from({length:21},(_,i)=>100*Math.exp(i*.001+(i%2)*.01));
 assert.ok(Math.abs(historicalVolatility(closes,12)!/historicalVolatility(closes)!-Math.sqrt(12/252))<1e-12);
 const start=Date.UTC(2026,9,9,13,30)/1000,ts=[start,start+3600,start+7200];
 const r={meta:{currency:'USD',currentTradingPeriod:{regular:{start,end:start+23400}}},timestamp:ts,indicators:{quote:[{open:[10,11,12],high:[12,13,14],low:[9,10,11],close:[11,12,13],volume:[10,20,30]}]}};
 const v=evaluatePrice(r,start+7500,'60m');assert.equal(v.asOf,ts[1]);assert.equal(v.technical.price,12);assert.equal(v.technical.score,null);
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import {loadFundamentals} from '@/lib/fundamental-source';import {combineFundamentals} from '@/lib/combined-score';
import constituents from '@/data/nasdaq100.json';import {loadPriceChart} from '@/lib/price-source';import {evaluatePrice} from '@/lib/evaluate-price';import type {PickRow} from '@/lib/picks';
const cache=new Map<string,{time:number;row:PickRow}>();const inFlight=new Map<string,Promise<PickRow>>();
async function scoreStock(stock:{symbol:string;name:string}):Promise<PickRow>{
 const cached=cache.get(stock.symbol);if(cached&&Date.now()-cached.time<300000)return cached.row;
 const pending=inFlight.get(stock.symbol);if(pending)return pending;
 const job=(async()=>{try{const {result}=await loadPriceChart(stock.symbol);const {technical,asOf,completedPrice}=evaluatePrice(result);const {fundamentals}=await loadFundamentals(stock.symbol);const t=combineFundamentals(technical,fundamentals);const row:PickRow={symbol:stock.symbol,name:stock.name,score:t.score,stage:t.stage,stageLabel:t.stageLabel,trend:t.trendScore,stability:t.stabilityScore,asOf,price:completedPrice,status:t.score===null?'unavailable':'ready',...(t.score===null?{reason:t.limits[0]||'지표를 계산할 수 없어요. 재검색 부탁드립니다.'}:{})};cache.set(stock.symbol,{time:Date.now(),row});return row;}catch{return {symbol:stock.symbol,name:stock.name,score:null,stage:null,stageLabel:null,trend:null,stability:null,asOf:null,price:null,status:'error' as const,reason:'주가 조회에 실패했어요. 재검색 부탁드립니다.'};}finally{inFlight.delete(stock.symbol)}})();inFlight.set(stock.symbol,job);return job;
}
export async function GET(request:Request){
 const value=new URL(request.url).searchParams.get('offset')||'0';const offset=Number(value);if(!/^\d+$/.test(value)||!Number.isInteger(offset)||offset<0||offset>=constituents.stocks.length||offset%2!==0)return Response.json({error:'올바른 조회 구간을 선택해 주세요.'},{status:400});
 const stocks=constituents.stocks.slice(offset,offset+2),rows=await Promise.all(stocks.map(scoreStock));return Response.json({rows,total:constituents.stocks.length,constituentsAsOf:constituents.asOf},{headers:{'Cache-Control':rows.some(r=>r.status==='error')?'no-store':'public, max-age=300'}});
}

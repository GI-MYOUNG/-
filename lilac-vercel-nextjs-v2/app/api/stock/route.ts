export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import {timeframes,frameLabels,type Timeframe} from '@/lib/timeframe';
import {evaluatePrice} from '@/lib/evaluate-price';
import {loadPriceChart} from '@/lib/price-source';
import {Metric} from '@/lib/market';
import {loadFundamentals} from '@/lib/fundamental-source';
import {combineFundamentals} from '@/lib/combined-score';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,symbol=p.get('symbol')||'AAPL',frame=(p.get('interval')||'1d') as Timeframe,count=Number(p.get('count')||120);
 if(!/^[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(symbol)||!timeframes.includes(frame)||![60,120,200].includes(count))return Response.json({error:'재검색 부탁드립니다.'},{status:400});
 const headers={'Cache-Control':'no-store'};
 try{
  const {result,source}=await loadPriceChart(symbol,frame,request.signal);
  const m=result.meta,{all,last,technical}=evaluatePrice(result,Date.now()/1000,frame);
  const bars=all.slice(-count);
  const rangeWarning=all.length<count?`요청한 ${count}봉 중 ${all.length}봉만 제공돼요. 데이터가 부족합니다. 재검색 부탁드립니다.`:null;
  const {fundamentals,fundamentalsError}=await loadFundamentals(symbol,request.signal);
 const combined=combineFundamentals(technical,fundamentals,result.meta.instrumentType==='ETF');
  return Response.json({interval:frame,intervalLabel:frameLabels[frame],symbol,name:m.longName||m.shortName||symbol,currency:m.currency,bars,price:last.close,change:all.length>1?(last.close/all.at(-2)!.close-1)*100:null,asOf:last.time,source,technical:combined,fetchedAt:Math.floor(Date.now()/1000),fundamentals,fundamentalsError,rangeWarning},{headers});
 }catch(error){console.error('Stock lookup failed',error);return Response.json({error:'재검색 부탁드립니다.',detail:'주가 데이터를 불러오지 못했어요. 잠시 후 다른 종목으로 다시 검색해 주세요.'},{status:502});}
}




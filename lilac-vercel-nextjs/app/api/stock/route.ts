export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import {evaluatePrice} from '@/lib/evaluate-price';
import {loadPriceChart} from '@/lib/price-source';
import {Metric} from '@/lib/market';
import {reportedEBITDA} from '@/lib/fundamentals';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,symbol=p.get('symbol')||'AAPL',range=p.get('range')||'3mo';
 if(!/^[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(symbol)||!['1mo','3mo','6mo','1y','60bars','120bars','200bars'].includes(range))return Response.json({error:'재검색 부탁드립니다.'},{status:400});
 const headers={'Cache-Control':'public, max-age=300, stale-while-revalidate=300'};
 try{
  const {result,source}=await loadPriceChart(symbol);
  const m=result.meta,{all,last,technical}=evaluatePrice(result);
  const cutoff=new Date(last.time*1000);if(range==='1y')cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);else cutoff.setUTCMonth(cutoff.getUTCMonth()-Number.parseInt(range));
  const count=range.endsWith('bars')?Number.parseInt(range):null;
  const bars=count?all.slice(-count):all.filter(b=>b.time>=cutoff.getTime()/1000);
  const rangeWarning=count&&all.length<count?`요청한 ${count}봉 중 ${all.length}봉만 제공돼요. 데이터가 부족합니다. 재검색 부탁드립니다.`:null;
  let fundamentals:{per:Metric|null;pbr:Metric|null;roe:Metric|null;ebitda:Metric|null}={per:null,pbr:null,roe:null,ebitda:null},fundamentalsError=false;
  try{
   const end=Math.floor(Date.now()/1000)+86400,start=end-86400*900;
   const fr=await fetch(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?type=trailingPeRatio,trailingPbRatio,trailingEBITDA,quarterlyNetIncome,quarterlyStockholdersEquity&period1=${start}&period2=${end}`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(10000)});
   if(!fr.ok)throw new Error('fundamentals');const f:any=await fr.json();if(f.timeseries?.error)throw new Error('fundamentals');
   const list=(type:string)=>(f.timeseries?.result?.find((x:any)=>x.meta?.type?.[0]===type)?.[type]||[]).filter((x:any)=>Number.isFinite(x.reportedValue?.raw)&&x.asOfDate).sort((a:any,b:any)=>a.asOfDate.localeCompare(b.asOfDate));
   for(const [key,type] of [['per','trailingPeRatio'],['pbr','trailingPbRatio']] as const){const v=list(type).at(-1);if(v)fundamentals[key]={value:v.reportedValue.raw,date:v.asOfDate,method:'제공처 TTM 비율'};}
   fundamentals.ebitda=reportedEBITDA(list('trailingEBITDA'));
   const income=list('quarterlyNetIncome'),equity=list('quarterlyStockholdersEquity');
   const inc=income.slice(-4),date=inc.at(-1)?.asOfDate;
   if(inc.length===4){const newest=Date.parse(date),oldest=Date.parse(inc[0].asOfDate),e1=equity.find((x:any)=>x.asOfDate===date),e0=equity.find((x:any)=>Math.abs(Date.parse(x.asOfDate)-(newest-365.25*86400000))<15*86400000);if(e1&&e0&&newest-oldest>250*86400000&&newest-oldest<300*86400000&&inc.every((x:any)=>x.currencyCode===e1.currencyCode)&&e0.currencyCode===e1.currencyCode&&e0.reportedValue.raw>0&&e1.reportedValue.raw>0){fundamentals.roe={value:inc.reduce((s:number,x:any)=>s+x.reportedValue.raw,0)/((e0.reportedValue.raw+e1.reportedValue.raw)/2)*100,date,method:'최근 4분기 순이익 ÷ 기초·기말 평균 자기자본 × 100'};}}
  }catch{fundamentalsError=true;}
  return Response.json({symbol,name:m.longName||m.shortName||symbol,currency:m.currency,bars,price:last.close,change:all.length>1?(last.close/all.at(-2)!.close-1)*100:null,asOf:last.time,source,technical,fundamentals,fundamentalsError,rangeWarning},{headers});
 }catch(error){console.error('Stock lookup failed',error);return Response.json({error:'재검색 부탁드립니다.',detail:'주가 데이터를 불러오지 못했어요. 잠시 후 다른 종목으로 다시 검색해 주세요.'},{status:502});}
}




import {marketFetch} from './market-request.ts';
import {reportedEBITDA} from './fundamentals.ts';
import type {Metric} from './market';
const cache=new Map<string,{at:number;data:Awaited<ReturnType<typeof queryFundamentals>>}>();
async function queryFundamentals(symbol:string,signal?:AbortSignal){
 let fundamentals:{per:Metric|null;pbr:Metric|null;roe:Metric|null;ebitda:Metric|null}={per:null,pbr:null,roe:null,ebitda:null},fundamentalsError=false;
  try{
   const end=Math.floor(Date.now()/1000)+86400,start=end-86400*900;
   const fr=await marketFetch(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?type=trailingPeRatio,trailingPbRatio,trailingEBITDA,quarterlyNetIncome,quarterlyStockholdersEquity&period1=${start}&period2=${end}`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal,timeoutMs:10000});
   if(!fr.ok)throw new Error('fundamentals');const f:any=await fr.json();if(f.timeseries?.error)throw new Error('fundamentals');
   const list=(type:string)=>(f.timeseries?.result?.find((x:any)=>x.meta?.type?.[0]===type)?.[type]||[]).filter((x:any)=>Number.isFinite(x.reportedValue?.raw)&&x.asOfDate).sort((a:any,b:any)=>a.asOfDate.localeCompare(b.asOfDate));
   for(const [key,type] of [['per','trailingPeRatio'],['pbr','trailingPbRatio']] as const){const v=list(type).at(-1);if(v)fundamentals[key]={value:v.reportedValue.raw,date:v.asOfDate,method:'제공처 TTM 비율'};}
   fundamentals.ebitda=reportedEBITDA(list('trailingEBITDA'));
   const income=list('quarterlyNetIncome'),equity=list('quarterlyStockholdersEquity');
   const inc=income.slice(-4),date=inc.at(-1)?.asOfDate;
   if(inc.length===4){const newest=Date.parse(date),oldest=Date.parse(inc[0].asOfDate),e1=equity.find((x:any)=>x.asOfDate===date),e0=equity.find((x:any)=>Math.abs(Date.parse(x.asOfDate)-(newest-365.25*86400000))<15*86400000);if(e1&&e0&&newest-oldest>250*86400000&&newest-oldest<300*86400000&&inc.every((x:any)=>x.currencyCode===e1.currencyCode)&&e0.currencyCode===e1.currencyCode&&e0.reportedValue.raw>0&&e1.reportedValue.raw>0){fundamentals.roe={value:inc.reduce((s:number,x:any)=>s+x.reportedValue.raw,0)/((e0.reportedValue.raw+e1.reportedValue.raw)/2)*100,date,method:'최근 4분기 순이익 ÷ 기초·기말 평균 자기자본 × 100'};}}
  }catch{fundamentalsError=true;}
 return {fundamentals,fundamentalsError};
}
export async function loadFundamentals(symbol:string,signal?:AbortSignal){const old=cache.get(symbol);if(old&&Date.now()-old.at<3600000)return old.data;const data=await queryFundamentals(symbol,signal);if(!data.fundamentalsError)cache.set(symbol,{at:Date.now(),data});return data;}

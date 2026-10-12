export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import {marketFetch} from '@/lib/market-request';
import catalog from '@/data/listings.json';
import {stocks,type Stock} from '@/lib/market';
import {searchCatalog,enrichStock,matchesMarket,koreanAliases,normalizeSearch} from '@/lib/search-catalog';
const instruments=catalog.stocks as Stock[];
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,q=(p.get('q')||'').trim().slice(0,80),market=p.get('market')||'ALL';
 const local=searchCatalog(instruments,q,market);let remote:Stock[]=[],unavailable=false;
 if(q&&!local.results.length&&(market==='ALL'||market==='US'||market==='KR')){
  const alias=Object.entries(koreanAliases).find(([,names])=>names.some(n=>normalizeSearch(n)===normalizeSearch(q)))?.[0];
  try {const r=await marketFetch('https://query1.finance.yahoo.com/v1/finance/search?'+new URLSearchParams({q:alias||q,quotesCount:'15',newsCount:'0'}),{headers:{'User-Agent':'Mozilla/5.0'},timeoutMs:6000});if(!r.ok)throw Error();const d:any=await r.json();remote=(d.quotes||[]).filter((x:any)=>['EQUITY','ETF'].includes(x.quoteType)&&['NMS','NYQ','NGM','NCM','ASE','KSC','KOE'].includes(x.exchange)).map((x:any)=>enrichStock({symbol:x.symbol,name:x.longname||x.shortname||x.symbol,market:/\.(KS|KQ)$/.test(x.symbol)?'KR':'US',exchange:x.exchDisp||x.exchange,kind:x.quoteType==='ETF'?'ETF':'STOCK'})).filter((s:Stock)=>matchesMarket(s,market));}catch{unavailable=true;}
 }
 const results=local.results.length?local.results:remote;
 return Response.json({results,total:local.total||remote.length,unavailable:unavailable&&!results.length,listing:{provider:catalog.provider,updatedAt:catalog.updatedAt,counts:catalog.counts}},{headers:{'Cache-Control':'public, max-age=120'}});
}

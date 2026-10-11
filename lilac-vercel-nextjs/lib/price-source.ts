export function parseNaverDaily(xml:string){
 return Array.from(xml.matchAll(/<item\s+data="([^"]+)"/g)).map(m=>{const [date,...v]=m[1].split('|');const [open,high,low,close,volume]=v.map(Number);return {time:Date.parse(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}T00:00:00+09:00`)/1000,open,high,low,close,volume};}).filter(b=>[b.time,b.open,b.high,b.low,b.close,b.volume].every(Number.isFinite)&&b.close>0&&b.high>=b.low).sort((a,b)=>a.time-b.time);
}
export async function loadPriceChart(symbol:string){
 if(!symbol.endsWith('.KN')){
  try{const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d&events=splits`,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('upstream');const d:any=await r.json();const result=d.chart?.result?.[0];if(!result)throw Error('empty');return {result,source:'Yahoo Finance · 테스트 데이터'};}catch(e){if(!/\.(KS|KQ)$/.test(symbol))throw e;}
 }
 const code=symbol.replace(/\.(KS|KQ|KN)$/,'');if(!/^[0-9A-Z]{6}$/.test(code))throw Error('invalid');
 const r=await fetch(`https://fchart.stock.naver.com/sise.nhn?timeframe=day&count=600&requestType=0&symbol=${code}`,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('naver');const bars=parseNaverDaily(await r.text());if(bars.length<2)throw Error('empty');
 const now=Date.now()/1000,today=Date.parse(new Date(Date.now()+9*3600000).toISOString().slice(0,10)+'T00:00:00+09:00')/1000;
 return {result:{timestamp:bars.map(b=>b.time),indicators:{quote:[{open:bars.map(b=>b.open),high:bars.map(b=>b.high),low:bars.map(b=>b.low),close:bars.map(b=>b.close),volume:bars.map(b=>b.volume)}]},meta:{currency:'KRW',currentTradingPeriod:{regular:{start:today,end:today+15.5*3600}}},events:{splits:{}}},source:'NAVER Finance · 테스트 데이터'};
}

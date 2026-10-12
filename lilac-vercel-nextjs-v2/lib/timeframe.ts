export const timeframes = ['15m','60m','90m','1d','5d','1wk','1mo','1y'] as const;
export type Timeframe = typeof timeframes[number];
export const frameLabels:Record<Timeframe,string>={'15m':'15분봉','60m':'60분봉','90m':'90분봉','1d':'일봉','5d':'5일봉','1wk':'주봉','1mo':'월봉','1y':'연봉'};
export function frameSettings(frame:Timeframe){
 return {label:frameLabels[frame],interval:frame==='1y'?'1mo':frame,range:frame==='15m'?'60d':frame==='60m'||frame==='90m'?'60d':frame==='1d'?'2y':frame==='5d'||frame==='1wk'?'10y':'max',periodsPerYear:({'15m':252*26,'60m':252*6.5,'90m':252*4.333333,'1d':252,'5d':252/5,'1wk':52,'1mo':12,'1y':1})[frame],staleSeconds:({'15m':7,'60m':7,'90m':7,'1d':7,'5d':18,'1wk':18,'1mo':65,'1y':740})[frame]*86400};
}
export function barEnd(time:number,frame:Timeframe,meta:any){
 const session=meta.currentTradingPeriod?.regular;
 if(frame==='15m'||frame==='60m'||frame==='90m')return session&&time>=session.start&&time<session.end?Math.min(time+(frame==='15m'?900:frame==='60m'?3600:5400),session.end):time+(frame==='15m'?900:frame==='60m'?3600:5400);
 const offset=meta.gmtoffset??0,d=new Date((time+offset)*1000);
 if(frame==='1d')return session&&time>=session.start-86400&&time<session.end?session.end:time+86400;
 if(frame==='5d')return time+5*86400;
 if(frame==='1wk'){const day=d.getUTCDay();d.setUTCDate(d.getUTCDate()+((8-day)%7||7));d.setUTCHours(0,0,0,0);}
 if(frame==='1mo'){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);d.setUTCHours(0,0,0,0);}
 if(frame==='1y'){d.setUTCFullYear(d.getUTCFullYear()+1,0,1);d.setUTCHours(0,0,0,0);}
 return d.getTime()/1000-offset;
}
export function annualizeChart(result:any){
 const q=result.indicators.quote[0],offset=result.meta.gmtoffset??0,groups=new Map<number,any>();
 result.timestamp.forEach((time:number,i:number)=>{
  if(![q.open[i],q.high[i],q.low[i],q.close[i]].every(Number.isFinite))return;
  const year=new Date((time+offset)*1000).getUTCFullYear(),v=Number.isFinite(q.volume[i])?q.volume[i]:null,old=groups.get(year);
  if(!old)groups.set(year,{time:Date.UTC(year,0,1)/1000-offset,open:q.open[i],high:q.high[i],low:q.low[i],close:q.close[i],volume:v});
  else{old.high=Math.max(old.high,q.high[i]);old.low=Math.min(old.low,q.low[i]);old.close=q.close[i];old.volume=old.volume===null||v===null?null:old.volume+v;}
 });
 const rows=[...groups.values()];return {...result,timestamp:rows.map(b=>b.time),indicators:{quote:[Object.fromEntries(['open','high','low','close','volume'].map(k=>[k,rows.map(b=>b[k])]))]}};
}

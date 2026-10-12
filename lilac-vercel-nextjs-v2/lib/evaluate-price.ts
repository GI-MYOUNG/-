import {barEnd,frameSettings,type Timeframe} from './timeframe.ts';
import {indicators} from './market.ts';import {analyzeTechnical} from './technical.ts';
export function evaluatePrice(result:any,now=Date.now()/1000,frame:Timeframe="1d"){
 const q=result.indicators?.quote?.[0],m=result.meta;
 let raw=(result.timestamp||[]).map((time:number,i:number)=>({time,open:q?.open?.[i],high:q?.high?.[i],low:q?.low?.[i],close:q?.close?.[i],volume:Number.isFinite(q?.volume?.[i])?q.volume[i]:null})).filter((b:any)=>[b.open,b.high,b.low,b.close].every(Number.isFinite)&&b.high>=b.low);
 if(frame==='15m'||frame==='60m'||frame==='90m'){const b=raw.at(-1),end=m.currentTradingPeriod?.regular?.end;if(b&&end&&b.time%86400===end%86400&&b.volume===0&&b.open===b.close&&b.high===b.low)raw=raw.slice(0,-1);}
 if(raw.length<2)throw Error('insufficient');const all=indicators(raw),last=all.at(-1)!;const session=m.currentTradingPeriod?.regular;
 const partialBar=frame==="1d"?!!session&&last.time>=session.start&&now<session.end:barEnd(last.time,frame,m)>now;const completed=partialBar?all.slice(0,-1):all;
 const splitCutoff=completed.at(-60)?.time??0;const splitDetected=Object.values(result.events?.splits||{}).some((e:any)=>e.date>=splitCutoff&&e.date<=(completed.at(-1)?.time??0));
 const technical=analyzeTechnical(completed,{partialBar,splitDetected,currency:m.currency,now,frame,periodsPerYear:frameSettings(frame).periodsPerYear,staleSeconds:frameSettings(frame).staleSeconds});return {all,last,technical,asOf:completed.at(-1)?.time??null,completedPrice:completed.at(-1)?.close??null};
}

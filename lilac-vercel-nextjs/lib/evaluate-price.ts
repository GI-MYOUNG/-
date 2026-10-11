import {indicators} from './market.ts';import {analyzeTechnical} from './technical.ts';
export function evaluatePrice(result:any,now=Date.now()/1000){
 const q=result.indicators?.quote?.[0],m=result.meta;
 const raw=(result.timestamp||[]).map((time:number,i:number)=>({time,open:q?.open?.[i],high:q?.high?.[i],low:q?.low?.[i],close:q?.close?.[i],volume:Number.isFinite(q?.volume?.[i])?q.volume[i]:null})).filter((b:any)=>[b.open,b.high,b.low,b.close].every(Number.isFinite)&&b.high>=b.low);
 if(raw.length<2)throw Error('insufficient');const all=indicators(raw),last=all.at(-1)!;const session=m.currentTradingPeriod?.regular;
 const partialBar=!!session&&last.time>=session.start&&now<session.end;const completed=partialBar?all.slice(0,-1):all;
 const splitCutoff=completed.at(-60)?.time??0;const splitDetected=Object.values(result.events?.splits||{}).some((e:any)=>e.date>=splitCutoff&&e.date<=(completed.at(-1)?.time??0));
 const technical=analyzeTechnical(completed,{partialBar,splitDetected,currency:m.currency,now});return {all,last,technical,asOf:completed.at(-1)?.time??null,completedPrice:completed.at(-1)?.close??null};
}

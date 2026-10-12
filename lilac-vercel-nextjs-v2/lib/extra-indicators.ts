export type ExtraValues={stochK:number|null;stochD:number|null;pivot:number|null;pivotS1:number|null;pivotS2:number|null;pivotR1:number|null;pivotR2:number|null};
export function extraIndicators(rows:{high:number;low:number;close:number}[]):ExtraValues[]{
 const raw=rows.map((b,i)=>{if(i<13)return null;const w=rows.slice(i-13,i+1),h=Math.max(...w.map(x=>x.high)),l=Math.min(...w.map(x=>x.low));return h>l?(b.close-l)/(h-l)*100:null;});
 const sma=(xs:(number|null)[],i:number)=>{const w=xs.slice(i-2,i+1);return w.length===3&&w.every(x=>x!==null)?w.reduce<number>((a,b)=>a+b!,0)/3:null;};
 const ks=raw.map((_,i)=>sma(raw,i));
 return rows.map((_,i)=>{const b=rows[i-1],p=b?(b.high+b.low+b.close)/3:null;return {stochK:ks[i],stochD:sma(ks,i),pivot:p,pivotS1:p===null?null:2*p-b.high,pivotS2:p===null?null:p-(b.high-b.low),pivotR1:p===null?null:2*p-b.low,pivotR2:p===null?null:p+(b.high-b.low)};});
}

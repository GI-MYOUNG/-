type Price={open:number;high:number;low:number;close:number};
export type TrendValues={adx:number|null;plusDI:number|null;minusDI:number|null;tenkan:number|null;kijun:number|null;cloudA:number|null;cloudB:number|null};
export function trendIndicators(rows:Price[]):TrendValues[]{
 let trSum=0,plusSum=0,minusSum=0,adx:number|null=null;const dxSeed:number[]=[];
 const midpoint=(i:number,n:number):number|null=>i<n-1?null:(Math.max(...rows.slice(i-n+1,i+1).map(b=>b.high))+Math.min(...rows.slice(i-n+1,i+1).map(b=>b.low)))/2;
 return rows.map((b,i)=>{
  let plusDI:number|null=null,minusDI:number|null=null;
  if(i>0){const prev=rows[i-1],up=b.high-prev.high,down=prev.low-b.low;
   const tr=Math.max(b.high-b.low,Math.abs(b.high-prev.close),Math.abs(b.low-prev.close)),plus=up>down&&up>0?up:0,minus=down>up&&down>0?down:0;
   if(i<=14){trSum+=tr;plusSum+=plus;minusSum+=minus;}else{trSum=trSum-trSum/14+tr;plusSum=plusSum-plusSum/14+plus;minusSum=minusSum-minusSum/14+minus;}
   if(i>=14){plusDI=trSum>0?plusSum/trSum*100:0;minusDI=trSum>0?minusSum/trSum*100:0;const sum=plusDI+minusDI,dx=sum>0?Math.abs(plusDI-minusDI)/sum*100:0;
    if(adx===null){dxSeed.push(dx);if(dxSeed.length===14)adx=dxSeed.reduce((s,v)=>s+v,0)/14;}else adx=(adx*13+dx)/14;
   }
  }
  const tenkan=midpoint(i,9),kijun=midpoint(i,26),oldTenkan=midpoint(i-26,9),oldKijun=midpoint(i-26,26);
  // Cloud visible on date i was formed 26 trading sessions earlier. No future bars.
  return {adx,plusDI,minusDI,tenkan,kijun,cloudA:oldTenkan===null||oldKijun===null?null:(oldTenkan+oldKijun)/2,cloudB:midpoint(i-26,52)};
 });
}
export function trendConfirmation(v:TrendValues,price:number,pastHigh:number|null,previousADX:number|null){
 const directional=v.plusDI!==null&&v.minusDI!==null&&v.plusDI>v.minusDI;
 const strength=v.adx!==null&&directional?(v.adx>=25&&previousADX!==null&&v.adx>=previousADX?5:v.adx>=20?2:0):0;
 const dmi=v.adx!==null&&v.adx>=20&&directional?(v.adx>=25&&v.plusDI!>v.minusDI!*1.2&&v.plusDI!-v.minusDI!>=5?10:v.plusDI!-v.minusDI!>=5?5:0):0;
 const top=v.cloudA===null||v.cloudB===null?null:Math.max(v.cloudA,v.cloudB),bottom=v.cloudA===null||v.cloudB===null?null:Math.min(v.cloudA,v.cloudB);
 const laggingConfirmed=pastHigh!==null&&price>pastHigh;
 const ichimoku=top!==null&&price>top&&v.tenkan!==null&&v.kijun!==null&&v.tenkan>v.kijun?(laggingConfirmed&&v.cloudA!>=v.cloudB!?10:5):0;
 return {strength,dmi,ichimoku,top,bottom,laggingConfirmed};
}

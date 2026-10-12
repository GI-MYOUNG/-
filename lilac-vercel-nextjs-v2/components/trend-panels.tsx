import type {Bar} from '@/lib/market';
export default function TrendPanels({bars,adx,dmi}:{bars:Bar[];adx:boolean;dmi:boolean}){
 const x=(i:number)=>8+(i+.5)*764/bars.length,y=(v:number)=>105-v*.75;
 const path=(key:'adx'|'plusDI'|'minusDI')=>bars.map((b,i)=>b[key]===null?'':`${i===0||bars[i-1][key]===null?'M':'L'}${x(i)},${y(b[key]!)}`).join(' ');
 return <>{(adx||dmi)&&<div className="trend-panel-legend">{adx&&<span>ADX · 추세 강도</span>}{dmi&&<><span className="di-positive">+DI · 상승 방향</span><span className="di-negative">−DI · 하락 방향</span></>}</div>}{(adx||dmi)&&<svg className="trend-panel" viewBox="0 0 850 125" role="img" aria-label="선택 기간의 ADX DMI 지표 차트" data-indicator="trend-panel">{[20,25,50,75].map(v=><g key={v}><line x1="8" x2="772" y1={y(v)} y2={y(v)} stroke="#e9e3f1" strokeDasharray="3 4"/><text x="784" y={y(v)+4} fontSize="10" fill="#a195ae">{v}</text></g>)}{adx&&<path data-indicator="adx" d={path('adx')} stroke="#ab85cd" fill="none" strokeWidth="1.8"/>}{dmi&&<><path data-indicator="plusDI" d={path('plusDI')} stroke="#70ada0" fill="none" strokeWidth="1.5"/><path data-indicator="minusDI" d={path('minusDI')} stroke="#d7959c" fill="none" strokeWidth="1.5"/></>}</svg>}</>;
}

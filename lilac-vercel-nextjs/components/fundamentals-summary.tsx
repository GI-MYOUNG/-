import type {MarketData} from '@/lib/market';
import {formatEBITDA} from '@/lib/fundamentals';
const number=(n:number)=>n.toLocaleString('ko-KR',{maximumFractionDigits:1});
export default function FundamentalsSummary({data}:{data:MarketData|null}){
 return <div className="value-metrics">{(['per','pbr','roe','ebitda'] as const).map(key=>{
  const m=data?.fundamentals[key];
  const explanation=!m?'지표를 확인할 자료가 부족해요. 재검색 부탁드립니다.':key==='per'?m.value>0?`주가가 연간 이익의 약 ${number(m.value)}배예요. 이익의 지속성도 확인하세요.`:'적자 등으로 일반적인 PER 비교가 어려워요.':key==='pbr'?`장부상 순자산의 약 ${number(m.value)}배예요. 자산의 질과 업종도 함께 확인하세요.`:key==='roe'?`평균 자기자본 100원당 약 ${number(m.value)}원의 순이익을 냈어요. 부채와 자본 규모도 확인하세요.`:m.value>0?`최근 12개월 EBITDA는 ${formatEBITDA(m)}로 양수예요. 본업의 이익 창출력을 살펴볼 수 있지만, 규모만으로 좋은 기업인지 판단할 수 없어요.`:m.value<0?`최근 12개월 EBITDA가 ${formatEBITDA(m)}로 음수예요. 영업 수익성과 비용 부담을 더 살펴보세요.`:'최근 12개월 EBITDA가 0이에요. 수익성 개선 여부를 확인하세요.';
  return <div className="value-metric" key={key}><div><b>{key.toUpperCase()}</b><strong className={key==='ebitda'?'ebitda-value':undefined}>{m?key==='ebitda'?formatEBITDA(m):`${number(m.value)}${key==='roe'?'%':'배'}`:'—'}</strong></div><p>{explanation}</p>{key==='ebitda'&&<p>이자·세금·감가상각의 영향을 제외해 영업 이익의 힘을 보는 지표예요. 실제 현금흐름이나 기업 가격은 아니며, 순이익·부채·설비투자도 함께 봐야 해요.</p>}{m&&<small>{m.date} 기준{key==='ebitda'?' · 최근 12개월 · '+m.currency:''}</small>}</div>
 })}</div>;
}

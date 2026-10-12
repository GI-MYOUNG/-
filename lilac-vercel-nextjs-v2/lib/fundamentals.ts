import type {Metric} from './market';
// Use reported TTM EBITDA only; do not substitute adjusted EBITDA or infer missing figures.
export function reportedEBITDA(items:unknown[]):Metric|null{
 const valid=items.filter((x:any)=>x?.periodType==='TTM'&&Number.isFinite(x.reportedValue?.raw)&&typeof x.currencyCode==='string'&&/^[A-Z]{3}$/.test(x.currencyCode)&&typeof x.asOfDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.asOfDate)).sort((a:any,b:any)=>a.asOfDate.localeCompare(b.asOfDate));
 const last:any=valid.at(-1);return last?{value:last.reportedValue.raw,date:last.asOfDate,currency:last.currencyCode,method:'최근 12개월 · 제공처 EBITDA'}:null;
}
export function formatEBITDA(metric:Metric):string{
 return `${(metric.value/100000000).toLocaleString('ko-KR',{maximumFractionDigits:2})}억 ${metric.currency==='KRW'?'원':metric.currency==='USD'?'달러':metric.currency}`;
}

import {extraIndicators,type ExtraValues} from './extra-indicators.ts';
import {trendIndicators,type TrendValues} from './trend-indicators.ts';
import type {TechnicalAnalysis} from './technical';
export type Stock = { symbol: string; name: string; market: 'KR' | 'US'; exchange: string; aliases?: string; englishName?:string;kind?:'STOCK'|'ETF';groups?:string[] };
export const stocks: Stock[] = [
 {symbol:'AAPL',name:'애플',market:'US',exchange:'NASDAQ',aliases:'Apple'},
 {symbol:'NVDA',name:'엔비디아',market:'US',exchange:'NASDAQ',aliases:'NVIDIA'},
 {symbol:'MSFT',name:'마이크로소프트',market:'US',exchange:'NASDAQ',aliases:'Microsoft'},
 {symbol:'TSLA',name:'테슬라',market:'US',exchange:'NASDAQ',aliases:'Tesla'},
 {symbol:'GOOGL',name:'알파벳 A',market:'US',exchange:'NASDAQ',aliases:'Google 구글'},
 {symbol:'GOOG',name:'알파벳 C',market:'US',exchange:'NASDAQ',aliases:'Google 구글'},
 {symbol:'AMZN',name:'아마존',market:'US',exchange:'NASDAQ',aliases:'Amazon'},
 {symbol:'META',name:'메타',market:'US',exchange:'NASDAQ',aliases:'Facebook'},
 {symbol:'005930.KS',name:'삼성전자',market:'KR',exchange:'KOSPI',aliases:'Samsung'},
 {symbol:'005935.KS',name:'삼성전자우',market:'KR',exchange:'KOSPI',aliases:'Samsung'},
 {symbol:'000660.KS',name:'SK하이닉스',market:'KR',exchange:'KOSPI',aliases:'하이닉스 Hynix'},
 {symbol:'035420.KS',name:'NAVER',market:'KR',exchange:'KOSPI',aliases:'네이버'},
 {symbol:'035720.KS',name:'카카오',market:'KR',exchange:'KOSPI',aliases:'Kakao'},
 {symbol:'005380.KS',name:'현대차',market:'KR',exchange:'KOSPI',aliases:'Hyundai 현대자동차'},
 {symbol:'373220.KS',name:'LG에너지솔루션',market:'KR',exchange:'KOSPI'},
 {symbol:'247540.KQ',name:'에코프로비엠',market:'KR',exchange:'KOSDAQ'},
 {symbol:'086520.KQ',name:'에코프로',market:'KR',exchange:'KOSDAQ'},
];
export type Bar = TrendValues & Partial<ExtraValues> & {time:number;open:number;high:number;low:number;close:number;volume:number|null;ma20:number|null;ma60:number|null;ma50:number|null;ma200:number|null;bbUpper:number|null;bbLower:number|null;rsi:number|null};
export function indicators(rows: Omit<Bar,keyof TrendValues|'ma20'|'ma60'|'ma50'|'ma200'|'bbUpper'|'bbLower'|'rsi'>[]): Bar[] {
 let gain=0,loss=0;const trends=trendIndicators(rows),extras=extraIndicators(rows);
 return rows.map((b,i)=>{
  if(i>0){const change=b.close-rows[i-1].close; if(i<=14){gain+=Math.max(change,0)/14;loss+=Math.max(-change,0)/14;}else{gain=(gain*13+Math.max(change,0))/14;loss=(loss*13+Math.max(-change,0))/14;}}
  const average=(n:number)=> i<n-1?null:rows.slice(i-n+1,i+1).reduce((s,x)=>s+x.close,0)/n;
  const ma20=average(20),deviation=ma20===null?null:Math.sqrt(rows.slice(i-19,i+1).reduce((s,x)=>s+(x.close-ma20)**2,0)/20);
  return {...b,...trends[i],...extras[i],ma20,ma60:average(60),ma50:average(50),ma200:average(200),bbUpper:ma20===null?null:ma20+2*deviation!,bbLower:ma20===null?null:ma20-2*deviation!,rsi:i<14?null:gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss)};
 });
}
export type Metric = {value:number;date:string;method?:string;currency?:string};
export type MarketData = {interval?:import("./timeframe").Timeframe;intervalLabel?:string;symbol:string;name:string;currency:string;bars:Bar[];price:number;change:number|null;asOf:number;source:string;technical:TechnicalAnalysis;fundamentals:{per:Metric|null;pbr:Metric|null;roe:Metric|null;ebitda:Metric|null};fetchedAt?:number;refreshError?:boolean;rangeWarning?:string|null;fundamentalsError?:boolean};

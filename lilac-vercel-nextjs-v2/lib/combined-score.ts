import {scoreStage,stages,type TechnicalAnalysis,type ScorePart} from './technical.ts';
import type {MarketData,Metric} from './market';
export function combineFundamentals(t:TechnicalAnalysis,f:MarketData['fundamentals'],etf=false,now=Date.now()):TechnicalAnalysis{
 const parts:ScorePart[]=[];let weight=0,points=0;
 const add=(key:keyof typeof f,label:string,max:number,grade:(v:number)=>number)=>{const m:Metric|null=f[key],age=m?now-Date.parse(m.date):Infinity;if(!m||!Number.isFinite(m.value)||!Number.isFinite(age)||age<0||age>450*86400000)return;const score=grade(m.value);weight+=max;points+=score;parts.push({label,max,points:score,reason:`${label} ${m.value.toLocaleString('ko-KR',{maximumFractionDigits:2})} · ${m.date} 기준이에요. ${score>=max*.6?'수익성·가격 부담 기준에서 비교적 양호해요.':'가격 부담이나 수익성의 추가 확인이 필요해요.'}`});};
 if(!etf){
 add('per','PER',30,v=>v<=0?0:v<=10?18:v<=25?30:v<=40?21:v<=70?12:3);
 add('pbr','PBR',20,v=>v<=0?0:v<.5?8:v<=3?20:v<=6?12:v<=10?6:2);
 add('roe','ROE',40,v=>v<=0?0:v<5?8:v<10?20:v<15?30:40);
 add('ebitda','EBITDA',10,v=>v>0?10:0);
 }
 const coverage=etf?'ETF는 기업 펀더멘털 평가에서 제외해요.':parts.length<2?'최근 펀더멘털 자료가 부족해 기술점수만 표시해요.':`${parts.length}/4개 펀더멘털을 반영했어요. 없는 자료는 추정하지 않아요.`;
 const fundamentalScore=parts.length>=2?Math.round(points/weight*100):null,technicalScore=t.score;
 if(technicalScore===null||fundamentalScore===null)return {...t,technicalScore,fundamentalScore,fundamentalCoverage:coverage,fundamentalParts:parts};
 let score=Math.round(technicalScore*.75+fundamentalScore*.25);
 if(t.supportBroken)score=Math.min(score,54);
 if((t.adx??0)>=25&&(t.minusDI??0)>(t.plusDI??0)||(t.stabilityScore??100)<=20||(t.trendScore??100)<25)score=Math.min(score,44);
 if(t.warnings.some(w=>w.includes('과열이 매우 심해')))score=Math.min(score,74);
 const stage=scoreStage(score);return {...t,technicalScore,fundamentalScore,fundamentalCoverage:coverage,fundamentalParts:parts,score,stage,stageLabel:stages[stage-1].label,summary:`종합 ${score}점 · ${stages[stage-1].label}예요. 기술 ${technicalScore}점과 기업 펀더멘털 ${fundamentalScore}점을 함께 반영했어요. ${t.summary}`,actions:[...t.actions,'펀더멘털의 공시 기준일과 업종별 비교, 다음 실적 발표를 확인하세요.']};
}

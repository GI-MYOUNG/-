import {frameLabels,type Timeframe} from './timeframe.ts';
import {trendConfirmation,type TrendValues} from './trend-indicators.ts';
import {balancedScore} from './scoring.ts';
import type {Bar} from './market';
import {judgmentLabels,scoreJudgment} from './judgment.ts';

export type ScorePart={label:string;points:number;max:number;reason:string};
export type TechnicalAnalysis=TrendValues & {
 stochK?:number|null;stochD?:number|null;pivot?:number|null;pivotS1?:number|null;pivotS2?:number|null;pivotR1?:number|null;pivotR2?:number|null;technicalScore?:number|null;fundamentalScore?:number|null;fundamentalCoverage?:string;fundamentalParts?:ScorePart[];
 cloudTop:number|null;cloudBottom:number|null;laggingConfirmed:boolean;ichimokuGrade:number|null;
 asOf:number|null;price:number|null;macd:number|null;signal:number|null;histogram:number|null;macdCross:'up'|'down'|'none';
 atr:number|null;atrPercent:number|null;volatility:number|null;volumeRatio:number|null;averageVolume:number|null;
 support:number|null;supportDistance:number|null;supportBroken:boolean;extensionATR:number|null;
 bbUpper:number|null;bbLower:number|null;bbPosition:number|null;
 trendScore:number|null;stabilityScore:number|null;score:number|null;stage:number|null;
 trendLabel:string;stabilityLabel:string;stageLabel:string;parts:ScorePart[];stabilityParts:ScorePart[];
 warnings:string[];summary:string;entry:string;management:string;actions:string[];
 reviewLevel:number|null;bufferLevel:number|null;limits:string[];
};
export const stages=[
 {min:0,label:'강력매도'}, {min:10,label:'매도'}, {min:20,label:'비중축소'}, {min:35,label:'시장수익률하회'}, {min:45,label:'중립'},
 {min:55,label:'단기매수'}, {min:65,label:'비중확대'}, {min:75,label:'시장수익률상회'}, {min:90,label:'강력매수'}
];
export const scoreStage=(score:number)=>stages.filter(s=>score>=s.min).length;
// EMA is seeded with the first n-observation SMA; no zero-filled warmup.
export function ema(values:(number|null)[],n:number):(number|null)[]{
 let previous:number|null=null;const seed:number[]=[];
 return values.map(v=>{if(v===null||!Number.isFinite(v)){previous=null;seed.length=0;return null;}if(previous===null){seed.push(v);if(seed.length<n)return null;previous=seed.reduce((s,x)=>s+x,0)/n;}else previous=v*2/(n+1)+previous*(1-2/(n+1));return previous;});
}
export function atr14(bars:Bar[]):(number|null)[]{
 let previous:number|null=null,total=0;
 return bars.map((b,i)=>{if(i===0)return null;const tr=Math.max(b.high-b.low,Math.abs(b.high-bars[i-1].close),Math.abs(b.low-bars[i-1].close));if(i<=14){total+=tr;if(i===14)previous=total/14;}else if(previous!==null)previous=(previous*13+tr)/14;return previous;});
}
export function historicalVolatility(closes:number[],periodsPerYear=252):number|null{
 if(closes.length<21||closes.some(c=>!Number.isFinite(c)||c<=0))return null;
 const last=closes.slice(-21),returns=last.slice(1).map((c,i)=>Math.log(c/last[i]));
 const mean=returns.reduce((s,x)=>s+x,0)/20,variance=returns.reduce((s,x)=>s+(x-mean)**2,0)/19;
 return Math.sqrt(variance)*Math.sqrt(periodsPerYear)*100;
}
const riskPoints=(value:number,bounds:number[])=>value<=bounds[0]?50:value<=bounds[1]?35:value<=bounds[2]?20:value<=bounds[3]?10:0;
const format=(v:number)=>v.toLocaleString('ko-KR',{maximumFractionDigits:2});
export function bollingerAssessment(position:number|null,confirmed:boolean):ScorePart{
 const outside=position!==null&&(position<0||position>1);
 const points=position===null||outside?0:confirmed&&position>=.5&&position<=.85?15:confirmed&&position>.85?9:position>=.4&&position<=.6?9:position>0&&position<1?6:0;
 return {label:'볼린저밴드',max:15,points,reason:position===null?'밴드 위치를 확인할 수 없어요.':position<0?'하단 밖으로 내려가 하락 압력이 커요.':position>1?'상단 밖으로 올라 추격 진입에 주의가 필요해요.':position>.85?'상단에 가까워 추가 상승 여력을 신중하게 봐요.':confirmed&&position>=.5?'중심선 위 흐름을 모멘텀과 거래량이 함께 뒷받침해요.':'밴드 안에 있지만 상승 근거가 충분하지 않아요.'};
}
export function analyzeTechnical(bars:Bar[],options:{now?:number;splitDetected?:boolean;partialBar?:boolean;currency?:string;frame?:Timeframe;periodsPerYear?:number;staleSeconds?:number}={}):TechnicalAnalysis{
 const last=bars.at(-1),prev=bars.at(-2),closes=bars.map(b=>b.close);
 const fast=ema(closes,12),slow=ema(closes,26),macds=closes.map((_,i)=>fast[i]===null||slow[i]===null?null:fast[i]!-slow[i]!),signals=ema(macds,9);
 const hist=macds.map((v,i)=>v===null||signals[i]===null?null:v-signals[i]!);
 const macd=macds.at(-1)??null,signal=signals.at(-1)??null,histogram=hist.at(-1)??null,priorHistogram=hist.at(-2)??null;
 const atr=atr14(bars).at(-1)??null,price=last?.close??null,atrPercent=price&&atr!==null?atr/price*100:null;
 const volatility=historicalVolatility(closes,options.periodsPerYear??252),volumes=bars.slice(-21,-1).map(b=>b.volume);
 const averageVolume=volumes.length===20&&volumes.every(v=>v!==null&&Number.isFinite(v)&&v>=0)?volumes.reduce<number>((s,v)=>s+v!,0)/20:null;
 const volumeRatio=last?.volume!==null&&last?.volume!==undefined&&Number.isFinite(last.volume)&&last.volume>=0&&averageVolume!==null&&averageVolume>0?last.volume/averageVolume:null;
 const support=bars.length>=21?Math.min(...bars.slice(-21,-1).map(b=>b.low)):null;
 const supportDistance=price&&support!==null?(price/support-1)*100:null,supportBroken=price!==null&&support!==null&&price<support;
 const extensionATR=price!==null&&last?.ma20!==null&&last?.ma20!==undefined&&atr!==null&&atr>0?(price-last.ma20)/atr:null;
 const bbUpper=last?.bbUpper??null,bbLower=last?.bbLower??null;
 const bbPosition=price!==null&&bbUpper!==null&&bbLower!==null&&bbUpper>bbLower?(price-bbLower)/(bbUpper-bbLower):null;
 const trends:TrendValues={adx:last?.adx??null,plusDI:last?.plusDI??null,minusDI:last?.minusDI??null,tenkan:last?.tenkan??null,kijun:last?.kijun??null,cloudA:last?.cloudA??null,cloudB:last?.cloudB??null};
 const confirmation=trendConfirmation(trends,price??0,bars.at(-27)?.high??null,bars.at(-6)?.adx??null);
 const ichimokuGrade=confirmation.top===null||confirmation.bottom===null||price===null?null:price<confirmation.bottom?0:price<=confirmation.top?1:trends.tenkan!<=trends.kijun!?2:confirmation.laggingConfirmed&&trends.cloudA!>=trends.cloudB!?4:3;
 const warnings:string[]=[],limits:string[]=[];
 const frame=options.frame??'1d',label=frameLabels[frame];
 const priceText=(v:number)=>`${format(v)}${options.currency==='KRW'?'원':options.currency==='USD'?'달러':options.currency?` ${options.currency}`:''}`;
 if(options.partialBar)warnings.push('장중 미완성 선택 봉을 제외하고 마지막 완료 선택 봉으로 평가했어요.');
 if(bars.length<78)limits.push('최소 78개의 완료 봉이 필요해요.');
 if(bars.some(b=>b.close<=0||b.low<=0||!Number.isFinite(b.close)||!Number.isFinite(b.low)))limits.push('비정상 가격이 있어 계산을 보류해요.');
 if(!last||[macd,signal,histogram,atrPercent,volatility,volumeRatio,support,last?.ma20,last?.ma60,last?.rsi,bbPosition,...Object.values(trends)].some(v=>v===null||v===undefined||!Number.isFinite(v)))limits.push('점수에 필요한 지표 또는 거래량이 부족해요.');
 if(last&&(options.now??Date.now()/1000)-last.time>(options.staleSeconds??7*86400))limits.push('선택 주기의 마지막 완료 봉이 오래됐어요. 최신 데이터를 먼저 확인하세요.');
 if(options.splitDetected)limits.push('최근 60봉에 주식분할이 있어요. 조정 여부 확인 전에는 점수를 표시하지 않아요.');
 const unavailable:TechnicalAnalysis={stochK:last?.stochK??null,stochD:last?.stochD??null,pivot:last?.pivot??null,pivotS1:last?.pivotS1??null,pivotS2:last?.pivotS2??null,pivotR1:last?.pivotR1??null,pivotR2:last?.pivotR2??null,...trends,cloudTop:confirmation.top,cloudBottom:confirmation.bottom,laggingConfirmed:confirmation.laggingConfirmed,ichimokuGrade,asOf:last?.time??null,price,macd,signal,histogram,macdCross:histogram!==null&&priorHistogram!==null&&histogram>0&&priorHistogram<=0?'up':histogram!==null&&priorHistogram!==null&&histogram<0&&priorHistogram>=0?'down':'none',atr,atrPercent,volatility,volumeRatio,averageVolume,support,supportDistance,supportBroken,extensionATR,bbUpper,bbLower,bbPosition,trendScore:null,stabilityScore:null,score:null,stage:null,trendLabel:'판단 보류',stabilityLabel:'판단 보류',stageLabel:'평가 보류',parts:[],stabilityParts:[],warnings,limits,summary:'데이터를 확인한 뒤 다시 평가할 수 있어요.',entry:'진입 판단 전에 최신 선택 봉과 누락된 지표를 확인하세요.',management:'데이터가 부족할 때는 지표 점수로 관리 기준을 정하지 마세요.',actions:['최신 선택 봉과 제공처 데이터를 확인하세요.','자료가 충분한 다른 종목을 검색해 비교하세요.'],reviewLevel:null,bufferLevel:null};
 if(frame!=='1d')warnings.push(`${label} 기준이에요. 변동성은 주기별 연환산 추정치이며, ATR 위험 구간은 봉 주기에 맞춰 비교해요.`);
 if(limits.length){unavailable.actions=unavailable.actions.map(a=>a.replaceAll('선택 봉',label));unavailable.entry=unavailable.entry.replaceAll('선택 봉',label);unavailable.summary=`${label} 자료가 부족해 평가를 보류해요.`;return unavailable;}
 const b=last!,r=b.rsi!,a=atr!,s=support!,p=price!;
 const bandPart=bollingerAssessment(bbPosition,histogram!>0&&macd!>0&&volumeRatio!>=1.1&&p>prev!.close&&b.ma20!>bars.at(-6)!.ma20!);
 const parts:ScorePart[]=[
  {label:'이동평균 흐름',max:20,points:(p>b.ma20!?5:0)+(b.ma20!>b.ma60!?5:0)+(b.ma20!>bars.at(-6)!.ma20!?10:0),reason:p>b.ma20!&&b.ma20!>b.ma60!?'최근 평균 위에서 상승 흐름이 이어지고 있어요.':'이동평균이 일관된 상승 흐름을 보여주지 못해요.'},
  {label:'MACD 모멘텀',max:15,points:(macd!>0?5:0)+(histogram!>0?5:0)+(histogram!>hist.at(-6)!?5:0),reason:histogram!>0?'상승 힘이 시그널을 웃돌고 있어요.':'상승 힘이 시그널을 충분히 웃돌지 못해요.'},
  {label:'RSI 균형',max:10,points:r>=45&&r<=65?10:r>=40&&r<45||r>65&&r<70?7:r>=35&&r<40||r>=70&&r<80?3:0,reason:r>=70?'단기 과열에 주의가 필요해요.':r<35?'하락 압력이 커 반등 확인이 필요해요.':r>=45&&r<=65?'과열 없이 균형 있는 흐름을 보이고 있어요.':'균형 구간에서 벗어나 추가 확인이 필요해요.'},
  {label:'상승 거래량 확인',max:10,points:p>prev!.close?(volumeRatio!>=1.5?10:volumeRatio!>=1?7:volumeRatio!>=.7?4:2):0,reason:p<=prev!.close?'보합·하락일의 거래량은 상승 확인 점수에 반영하지 않아요.':volumeRatio!>=1.1?'평균 이상의 거래량이 상승 흐름을 뒷받침해요.':'거래량이 상승 흐름을 충분히 뒷받침하지 못해요.'},
  {label:'지지 후보와 거리',max:10,points:p>=s?(a>0&&p-s<=2*a?10:5):0,reason:supportBroken?'지지 후보를 이탈해 하락 위험이 커졌어요.':a>0&&p-s<=2*a?'지지 후보와 비교적 가까워 재점검 기준을 세우기 쉬워요.':'지지 후보와 거리가 멀어 손실 범위를 먼저 확인하세요.'},
  {...bandPart,max:10,points:Math.floor(bandPart.points*2/3)},
  {label:'ADX 추세 강도',max:5,points:confirmation.strength,reason:trends.adx!<20?'추세가 약해 상승 지속을 확인하기 어려워요.':trends.plusDI!<=trends.minusDI!?'추세가 강해도 하락 방향이어서 상승 점수를 주지 않아요.':confirmation.strength===5?'상승 방향의 강한 추세가 유지되고 있어요.':'추세 강도가 충분히 확인되지 않아 가점을 제한했어요.'},
  {label:'DMI 방향',max:10,points:confirmation.dmi,reason:trends.plusDI!<=trends.minusDI!?'하락 방향의 힘이 상승 방향보다 크거나 같아요.':confirmation.dmi===10?'상승 방향이 뚜렷하고 추세 강도도 뒷받침돼요.':'상승 방향이 앞서지만 격차나 추세 강도가 충분하지 않아요.'},
  {label:'일목균형표',max:10,points:confirmation.ichimoku,reason:ichimokuGrade===0?'가격이 구름대 아래여서 하락 압력에 주의가 필요해요.':ichimokuGrade===1?'가격이 구름대 안에 있어 방향이 불확실해요.':confirmation.ichimoku===10?'구름대 위 가격과 전환·기준선, 후행 확인이 상승 방향으로 일치해요.':'구름대 위에 있지만 상승 확인 조건이 모두 일치하지 않아요.'}
 ];
 const k=b.stochK??null,d=b.stochD??null,pivot=b.pivot??null;
 const stochPoints=k===null||d===null?null:k>d&&k>=20&&k<=80?10:k>d?6:k<20?2:4;
 const pivotPoints=pivot===null?null:p>pivot&&p<(b.pivotR1??Infinity)?10:p>=pivot?6:p>=(b.pivotS1??-Infinity)?4:0;
 // Keep a fixed 100-point trend budget, limiting correlated oscillator signals.
 const base=parts.map(x=>({...x,max:x.max*.8,points:x.points*.8}));parts.splice(0,parts.length,...base);
 parts.push({label:'스토캐스틱',max:10,points:stochPoints??0,reason:k===null?'가격 범위가 같거나 봉 수가 부족해 판단을 보류해요.':k>80?'최근 범위의 상단에 있어 과열과 방향을 함께 확인하세요.':k<20?'최근 범위의 하단에 있어 반등 확인이 필요해요.':k>d!?'상승 방향의 힘이 신호선보다 앞서요.':'상승 힘이 신호선보다 약해 추가 확인이 필요해요.'},{label:'피벗포인트',max:10,points:pivotPoints??0,reason:pivot===null?'직전 완료 봉이 없어 판단을 보류해요.':p>=pivot?'직전 봉 기준 중심 가격 위에 있어 저항 돌파 여부를 확인하세요.':'직전 봉 기준 중심 가격 아래에 있어 지지 유지 여부를 확인하세요.'});
 if(stochPoints===null||pivotPoints===null){unavailable.limits.push('스토캐스틱 또는 피벗 자료가 부족해 종합점수를 보류해요.');return unavailable;}
 const trendScore=parts.reduce((v,x)=>v+x.points,0),volPoints=riskPoints(volatility!,[15,30,50,80]),atrPoints=riskPoints(atrPercent!*Math.sqrt((options.periodsPerYear??252)/252),[2,4,6,10]);
 const stabilityParts:ScorePart[]=[{label:'주가변동성',points:volPoints,max:50,reason:volatility!<=30?'최근 가격 움직임이 비교적 차분해요.':'최근 가격 움직임이 커 손실 범위에 주의가 필요해요.'},{label:'봉별 변동폭',points:atrPoints,max:50,reason:atrPercent!*Math.sqrt((options.periodsPerYear??252)/252)<=2?'한 봉의 가격 움직임이 비교적 작아요.':'한 봉의 가격 움직임이 커 관리 여유가 필요해요.'}];
 const stabilityScore=volPoints+atrPoints;
 const result=balancedScore({trend:trendScore,stability:stabilityScore,weakAverage:p<=b.ma20!&&b.ma20!<=b.ma60!,weakMomentum:histogram!<0,weakADX:trends.adx!<20,downDMI:trends.plusDI!<trends.minusDI!,strongDowntrend:trends.adx!>=25&&trends.minusDI!>trends.plusDI!,cloud:ichimokuGrade===0?'below':ichimokuGrade===1?'inside':'above',weakIchimoku:trends.tenkan!<=trends.kijun!||!confirmation.laggingConfirmed,overheat:r>=70||(extensionATR!==null&&extensionATR>2.5),extremeOverheat:r>=85||(extensionATR!==null&&extensionATR>4),band:bbPosition!<0?'below':bbPosition!>1?'above':'inside',lowVolume:volumeRatio!<.7,supportBroken});
 const score=result.score;warnings.push(...result.warnings);
 const stage=scoreStage(score);
 const trendLabel=judgmentLabels[scoreJudgment(trendScore)!],stabilityLabel=judgmentLabels[scoreJudgment(stabilityScore)!];
 const reviewLevel=s,bufferLevel=Math.max(0,s-a);
 const entry=ichimokuGrade===0?'가격이 일목 구름대 아래예요. 구름대와 기준선 위로 회복하고 DMI 상승 방향이 확인되는지 먼저 살펴보세요.':trends.adx!<20||trends.plusDI!<=trends.minusDI!?'추세 강도나 상승 방향이 충분하지 않아요. ADX 회복과 DMI 상승 우세를 확인한 뒤 진입을 검토하세요.':bbPosition!<0?'볼린저밴드 하단을 이탈했어요. 밴드 안으로 회복하는지 확인한 뒤 진입을 검토하세요.':bbPosition!>1?'볼린저밴드 상단 밖이에요. 추격보다 밴드 안에서 가격이 안정되고 거래량이 유지되는지 확인하세요.':supportBroken?`진입을 서두르기보다 지지 후보 ${priceText(s)} 위로 종가가 회복하고 거래량이 동반되는지 먼저 확인하세요.`:stabilityScore<=20?'가격 변동이 큰 구간이에요. 진입 검토보다 감당할 수 있는 손실 금액과 공시 위험을 먼저 확인하세요.':r>=70||(extensionATR!==null&&extensionATR>2.5)?'추격 진입을 서두르기보다 이격이 줄어드는지, 이동평균 부근에서 종가가 유지되는지 확인하세요.':trendScore>=70?`진입 검토 시 MA20 ${priceText(b.ma20!)} 부근의 종가 유지, MACD의 시그널 위 ${histogram!>0?'유지':'회복·유지'}, 상승일 거래량 1배 이상을 함께 확인하세요.`:'추세가 아직 충분히 확인되지 않았어요. 종가가 MA20 위에서 유지되고 MACD가 시그널 위로 개선되는지 다음 완료 선택 봉으로 확인하세요.';
 const management=`보유 중이라면 종가가 지지 후보 ${priceText(reviewLevel)} 아래로 내려갈 때 투자 근거를 다시 점검하세요. 변동폭을 고려한 관리 참고선은 ${priceText(bufferLevel)}예요. 실제 체결과 손실 한도는 갭·수수료에 따라 달라질 수 있어요.`;
 const actions=[supportBroken?`다음 완료 선택 봉의 종가가 지지 후보 ${priceText(s)}를 회복하는지 확인하세요.`:`다음 완료 선택 봉에서 종가가 MA20 ${priceText(b.ma20!)}와 지지 후보 ${priceText(s)} 위에 유지되는지 확인하세요.`,`MACD 히스토그램이 개선되는지와 상승일 거래량이 직전 20봉 평균 ${format(averageVolume!)}주 이상인지 함께 확인하세요.`,'ADX와 DMI의 상승 방향, 일목 구름대 위 유지 여부를 함께 확인하고 최대 손실 금액·공시 일정을 점검하세요.'];
 return {...unavailable,trendScore,stabilityScore,technicalScore:score,score,stage,trendLabel,stabilityLabel,stageLabel:stages[stage-1].label,parts,stabilityParts,reviewLevel,bufferLevel,summary:`${label} 기준 상승 근거는 ${trendLabel}, 최근 가격 안정성은 ${stabilityLabel}이에요. ${stage}단계 ${stages[stage-1].label}이며, ${supportBroken?'지지 후보 회복 여부':stabilityScore<40?'큰 봉별 변동':r>=70?'단기 과열':trendScore>=70?'상승 흐름의 지속 여부':'방향이 뚜렷해지는지'}를 먼저 살펴보세요.${trendScore>=70&&histogram!<0?' 다만 MACD는 시그널 아래여서 모멘텀 회복을 확인해야 해요.':''}`,entry:`${label} 기준: ${entry}`,management:`${label} 기준: ${management}`,actions:actions.map(a=>a.replaceAll("선택 봉",label).replaceAll("상승일","상승 봉"))};
}

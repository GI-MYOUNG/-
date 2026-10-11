export type ScoreConditions={trend:number;stability:number;weakAverage:boolean;weakMomentum:boolean;weakADX:boolean;downDMI:boolean;strongDowntrend:boolean;cloud:'below'|'inside'|'above';weakIchimoku:boolean;overheat:boolean;extremeOverheat:boolean;band:'below'|'inside'|'above';lowVolume:boolean;supportBroken:boolean};
export function balancedScore(c:ScoreConditions){
 let score=Math.round(c.trend*.7+c.stability*.3);const warnings:string[]=[];
 const deduct=(condition:boolean,points:number,message:string)=>{if(condition){score-=points;warnings.push(message)}};
 deduct(c.weakAverage,4,'이동평균의 상승 흐름이 약해 점수에 일부 반영했어요.');
 deduct(c.weakMomentum,2,'MACD 모멘텀이 약해 점수를 조금 낮췄어요.');
 deduct(c.weakADX,2,'추세 강도가 약해 추가 확인이 필요해요.');
 deduct(c.downDMI,3,'DMI의 하락 방향 우세를 점수에 반영했어요.');
 deduct(c.cloud==='below',6,'가격이 일목 구름대 아래여서 하락 위험을 반영했어요.');
 deduct(c.cloud==='inside'||c.cloud==='above'&&c.weakIchimoku,2,'일목의 상승 확인이 부족해 점수에 일부 반영했어요.');
 deduct(c.overheat||c.band==='above',3,'상단 이탈 또는 단기 과열에 주의가 필요해요.');
 deduct(c.band==='below',4,'볼린저밴드 하단 밖의 하락 압력을 반영했어요.');
 deduct(c.lowVolume,1,'거래량이 평소보다 적어 상승 확인 점수를 조금 낮췄어요.');
 // Correlated mild warnings are grouped; severe risks retain explicit ceilings.
 score=Math.max(Math.round(c.trend*.7+c.stability*.3)-12,score);
 if(c.supportBroken){score=Math.min(score,54);warnings.push('지지 후보 이탈은 별도로 반영해 높은 등급을 제한했어요.');}
 if(c.strongDowntrend||c.stability<=20||c.trend<25){score=Math.min(score,44);warnings.push('강한 하락 흐름이나 큰 변동 위험은 높은 등급을 제한했어요.');}
 if(c.extremeOverheat){score=Math.min(score,74);warnings.push('과열이 매우 심해 최상위 등급을 제한했어요.');}
 return {score:Math.max(0,Math.min(100,score)),warnings};
}

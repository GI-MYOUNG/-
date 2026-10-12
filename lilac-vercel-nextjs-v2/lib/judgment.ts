export const judgmentLabels=['이하','평균이하','평균','평균이상','이상'] as const;
// Reference ranges are educational rules, not cross-sectional market averages.
export function judgment(value:number|null,boundaries:readonly number[]):number|null{
 if(value===null||!Number.isFinite(value))return null;
 return boundaries.filter(boundary=>value>=boundary).length;
}
export const scoreJudgment=(value:number|null)=>judgment(value,[20,40,60,80]);

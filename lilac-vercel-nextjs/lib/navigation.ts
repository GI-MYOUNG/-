export type NavSection='analysis'|'learn'|'premium';
export function sectionAtPosition(tops:{id:NavSection;top:number}[],marker:number):NavSection{
 return tops.reduce<NavSection>((active,s)=>s.top<=marker?s.id:active,'analysis');
}

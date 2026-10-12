export async function marketFetch(url:string,options:RequestInit&{timeoutMs?:number}={}){
 const {timeoutMs=12000,signal,...init}=options;
 signal?.throwIfAborted();
 const timeout=AbortSignal.timeout(timeoutMs),combined=signal?AbortSignal.any([signal,timeout]):timeout;
 return fetch(url,{...init,signal:combined});
}

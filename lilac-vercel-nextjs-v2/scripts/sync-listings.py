"""Refresh bundled search listings with FinanceDataReader; fail closed on missing markets."""
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import json, re, requests
import FinanceDataReader as fdr
ROOT=Path(__file__).resolve().parents[1]
original=requests.sessions.Session.request
korean_names={}
etf_exchanges={}
def request(self,method,url,**kwargs):
    # FDR still contains HTTP URLs; use the same provider over HTTPS.
    if url.startswith('http://'): url='https://'+url[7:]
    if 'api.stock.naver.com/stock/exchange/' in url: url=url.replace('pageSize=60','pageSize=100')
    kwargs.setdefault('timeout',30)
    response=original(self,method,url,**kwargs)
    if 'api.stock.naver.com/stock/exchange/' in url and response.ok:
        for row in response.json().get('stocks',[]):
            korean_names[row.get('symbolCode','')]=row.get('stockName','')
    if 'api.stock.naver.com/etf/priceTop' in url and response.ok:
        for row in response.json().get('etfs',[]):
            code=row.get('symbolCode','')
            korean_names[code]=row.get('stockName','')
            etf_exchanges[code]=row.get('stockExchangeType',{}).get('name','')
    return response
requests.sessions.Session.request=request
markets=['KRX','KOSPI','KOSDAQ','KONEX','NASDAQ','NYSE','AMEX','SP500','ETF/KR','ETF/US']
def read(m):
    frame=fdr.StockListing(m)
    if frame is None or frame.empty: raise RuntimeError(m+' empty')
    print(m,len(frame),flush=True)
    return m,frame.fillna('').to_dict('records')
with ThreadPoolExecutor(max_workers=4) as pool:
    tables=dict(pool.map(read,markets))
rows={}
for market,items in tables.items():
    for r in items:
        code=str(r.get('Code') or r.get('Symbol') or '').strip()
        name=str(r.get('Name') or '').strip()
        if not code or not name: continue
        korean=market in ['KRX','KOSPI','KOSDAQ','KONEX','ETF/KR']
        exchange=str(r.get('Market') or market)
        if korean:
            exchange='KOSPI' if market=='ETF/KR' else exchange
            if 'KOSDAQ' in exchange: exchange='KOSDAQ'
            if exchange not in ['KOSPI','KOSDAQ','KONEX']: continue
            code=code.zfill(6); symbol=code+('.KQ' if exchange=='KOSDAQ' else '.KN' if exchange=='KONEX' else '.KS')
        else:
            symbol=code.replace('.','-')
            exchange=etf_exchanges.get(code,'US ETF') if market=='ETF/US' else market if market!='SP500' else 'US'
        row=rows.setdefault(symbol,dict(symbol=symbol,name=korean_names.get(code) or name,englishName='' if korean else name,market='KR' if korean else 'US',exchange=exchange,kind='ETF' if market.startswith('ETF/') else 'STOCK',groups=[]))
        if exchange!='US':row['exchange']=exchange
        if market.startswith('ETF/'):row['kind']='ETF'
        if market not in row['groups']:row['groups'].append(market)
        if korean:row['groups']=list(dict.fromkeys(row['groups']+['KRX']))
        if market=='SP500' and row['exchange']=='US':
            # Constituents absent from all supported exchange listings must not be misclassified.
            row['exchange']='S&P500'
result=dict(provider='FinanceDataReader',version=fdr.__version__,updatedAt=datetime.now(timezone.utc).isoformat(),counts={m:len(v) for m,v in tables.items()},api=dict(stocks='StockListing',etf='StockListing(ETF/KR), StockListing(ETF/US)',prices='DataReader',dataListing=False),stocks=list(rows.values()))
path=ROOT/'data/listings.json';temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(path)
print('Saved',len(rows),'instruments',flush=True)


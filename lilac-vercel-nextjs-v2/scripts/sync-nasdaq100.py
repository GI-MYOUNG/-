"""Refresh Nasdaq-100 membership from Nasdaq's published list endpoint."""
from pathlib import Path
from datetime import datetime, timezone
import requests,json
root=Path(__file__).resolve().parents[1]
url='https://api.nasdaq.com/api/quote/list-type/nasdaq100'
r=requests.get(url,headers={'User-Agent':'Mozilla/5.0','Accept':'application/json','Origin':'https://www.nasdaq.com'},timeout=30);r.raise_for_status();d=r.json()['data'];raw=d['data']['rows']
if len(raw)!=int(d['totalrecords']) or not 95<=len(raw)<=110:raise RuntimeError('Incomplete Nasdaq universe')
catalog=json.loads((root/'data/listings.json').read_text(encoding='utf8'));names={s['symbol']:s['name'] for s in catalog['stocks']}
rows=[dict(symbol=s['symbol'],name=names.get(s['symbol'],s['companyName']),englishName=s['companyName'],market='US',exchange='NASDAQ',kind='STOCK') for s in raw]
if len({s['symbol'] for s in rows})!=len(rows):raise RuntimeError('Duplicate symbols')
# One representative security per company: Alphabet uses Class A (GOOGL).
if {'GOOG','GOOGL'}.issubset({s['symbol'] for s in rows}):rows=[s for s in rows if s['symbol']!='GOOG']
if len(rows)!=100:raise RuntimeError('Expected 100 company representatives; review membership before publishing')
result=dict(asOf=d['date'],source='Nasdaq',sourceUrl=url,stocks=rows)
path=root/'data/nasdaq100.json';tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8');tmp.replace(path)
print('Saved',len(rows),'company representatives')

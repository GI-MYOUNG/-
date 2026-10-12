"""Export actual daily OHLCV using FinanceDataReader.DataReader."""
import argparse
from pathlib import Path
import FinanceDataReader as fdr
p=argparse.ArgumentParser();p.add_argument('symbol');p.add_argument('--start',default='2024-01-01');p.add_argument('--output',required=True);a=p.parse_args()
d=fdr.DataReader(a.symbol,a.start)
if d.empty:raise SystemExit('No price data')
Path(a.output).parent.mkdir(parents=True,exist_ok=True)
d.reset_index().to_json(a.output,orient='records',force_ascii=False,date_format='iso')
print('Exported',len(d),'daily observations')

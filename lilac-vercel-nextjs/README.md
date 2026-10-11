# 라일락 — Vercel용 Next.js 프로젝트

기존 공개 사이트와 분리한 Next.js App Router 프로젝트입니다. 종목 검색, 실제 주가 차트, 기술점수, 교육 화면, 100개 기업의 라일락 PICK을 포함합니다. Cloudflare Workers 및 Sites 전용 배포 코드는 포함하지 않습니다.

## 실행

Node.js 22.13 이상과 pnpm을 설치한 후 이 폴더에서 실행합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://localhost:3000 에서 확인합니다.

```sh
pnpm test
pnpm build
pnpm start
```

## Vercel 배포

1. ZIP을 풀고 이 폴더의 내용을 본인 GitHub 저장소에 올립니다. `node_modules`, `.next`, `.env` 파일은 올리지 않습니다.
2. Vercel에서 Add New → Project → 해당 GitHub 저장소 → Import를 선택합니다.
3. Framework Preset은 Next.js, Root Directory는 package.json이 있는 폴더로 지정합니다. 이 프로젝트만 저장소 루트에 올렸다면 Root Directory는 기본값을 사용합니다.
4. 설치·빌드·출력 디렉터리는 자동 설정을 사용합니다. Build Command는 `pnpm build`, Output Directory는 Next.js 기본값입니다.
5. Deploy 후 종목 검색, 미국·한국 차트, /pick 순위를 확인합니다.

현재 테스트용 주가 조회에 필수 환경변수는 없습니다. Vercel 계정이나 비밀 키는 이 파일에 포함되어 있지 않습니다. 실제 Vercel 배포는 수행하지 않았습니다.

## 데이터와 운영

- 종목 목록은 FinanceDataReader로 생성한 JSON 스냅샷입니다. Python을 Vercel 요청 처리 중에 실행하지 않습니다. 갱신 시 `scripts/requirements-market.txt`를 설치하고 `scripts/sync-listings.py`를 실행한 뒤 재배포합니다.
- Nasdaq-100 목록은 `scripts/sync-nasdaq100.py`로 갱신합니다. 알파벳은 GOOGL 한 종류로 비교하며 100개 기업을 검증합니다. GOOG는 일반 검색에 남아 있습니다.
- 실제 일봉은 Yahoo Finance에서 조회하고 한국 종목은 NAVER 대체 조회를 지원합니다. 제공처 제한이나 네트워크 오류가 발생하면 기존 오류 화면이 표시됩니다. Vercel 운영 환경에서 제공처 접근을 배포 후 확인해야 합니다.
- PICK의 메모리 캐시는 서버 인스턴스마다 다르며 재시작 시 사라집니다. 조회 요청은 5종목 단위로 나뉩니다.
- 프리미엄 화면은 기존 교육용 예시입니다. 실제 결제·유료 회원 인증은 연결되어 있지 않습니다. 상용 운영 전 데이터 이용 계약과 결제·회원 시스템을 별도로 준비해야 합니다.
- Vercel Hobby는 개인 비상업용입니다. 상업 운영은 해당 요금제 조건을 확인하세요.

공식 문서: https://vercel.com/docs/frameworks/full-stack/nextjs

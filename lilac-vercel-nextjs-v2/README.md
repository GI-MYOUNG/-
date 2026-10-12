# 라일락 — Vercel용 Next.js 두 번째 사본

2026년 10월 13일 기준 최신 원본 사이트를 표준 Next.js App Router로 전환한 별도 프로젝트입니다. 첫 번째 사본과 기존 공개 사이트를 덮어쓰지 않습니다.

## 포함 기능

- 한국·미국 주식과 ETF 검색, 한글 별칭 검색
- 15분·60분·90분·일봉·5일봉·주봉·월봉·연봉 차트와 60/120/200봉 선택
- 화면이 보이는 동안 10분마다 최신 자료 조회, 탭 복귀 시 즉시 재조회
- RSI, SMA, 볼린저밴드, MACD, ATR, ADX/DMI, 일목균형표, 스토캐스틱, 피벗포인트
- 기술 흐름과 PER/PBR/ROE/EBITDA를 함께 반영한 종합 점수, 설명 및 체크리스트
- 같은 탭에서 이동하는 100개 기업의 라일락 PICK
- 클릭 즉시 메뉴 강조 후 부드럽게 이동하는 상단 메뉴

외부 요청의 강제 3초 대기는 제거된 상태입니다. 연봉은 월봉을 연도별로 집계합니다. 기술 평가는 완료된 봉 기준입니다. 봉 수나 최근 재무 자료가 부족하면 평가를 보류하거나 기술점수만 표시합니다. ETF는 기업 펀더멘털 평가에서 제외합니다.

## 로컬 실행

Node.js 22.13 이상과 pnpm을 설치하고, package.json이 있는 폴더에서 실행합니다.

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

1. ZIP을 풀고 프로젝트 내용을 본인 GitHub 저장소에 올립니다.
2. Vercel의 Add New → Project에서 저장소를 Import합니다.
3. Framework Preset은 Next.js를 선택합니다.
4. Root Directory는 이 프로젝트의 package.json이 있는 폴더입니다. 저장소 루트에 내용을 올렸다면 기본값, 부모 폴더째 올렸다면 `lilac-vercel-nextjs-v2`를 선택합니다.
5. 설치·빌드·출력 디렉터리는 자동 설정을 사용합니다. 빌드 명령을 직접 지정한다면 `pnpm build`입니다.
6. Deploy 후 미국·한국 종목 검색, 차트, 기업 가치, /pick을 확인합니다.

현재 테스트 데이터 조회에는 필수 환경변수가 없습니다. 계정 인증정보·비밀 키·기존 사이트의 배포 ID는 포함하지 않습니다. 이 ZIP은 소스 프로젝트이며 실제 Vercel 배포는 수행하지 않았습니다.

## 데이터와 운영

주가는 Yahoo Finance와 한국 일봉의 NAVER 대체 조회를 사용합니다. 제공처의 지연·시장 휴장·접근 제한에 따라 최신 시각과 조회 가능 범위가 달라집니다. Vercel 서버에서 제공처 접근을 배포 후 확인해야 합니다. 일부 시장은 특정 분봉을 제공하지 않습니다.

종목 목록은 FinanceDataReader로 생성한 JSON 스냅샷입니다. Python은 Vercel 요청 처리 중 실행하지 않습니다. 목록을 갱신하려면 `scripts/requirements-market.txt`를 설치하고 목록 갱신 스크립트를 실행한 뒤 재배포합니다. Nasdaq-100은 기업당 대표 종목 하나를 사용하며 알파벳은 GOOGL입니다. GOOG는 일반 검색에 유지합니다.

PICK 순위는 일봉 기준입니다. 주가 조회 응답은 캐시하지 않고, PICK 및 재무 자료는 제한적으로 캐시합니다. 메모리 캐시는 서버 인스턴스별이며 재시작 시 사라집니다. 프리미엄 결제·유료 회원 인증·상용 데이터 계약은 아직 연결되지 않은 교육용 공개 테스트 버전입니다.

공식 배포 안내: https://vercel.com/docs/frameworks/full-stack/nextjs

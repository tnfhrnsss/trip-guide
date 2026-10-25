# CLAUDE.md — Trip Guide 작업 가이드

이 파일은 Claude Code가 새 세션에서 프로젝트를 이어서 작업할 때 필요한 모든 컨텍스트를 담고 있습니다.

---

## 프로젝트 개요

여행자를 위한 오프라인 우선 웹앱. 국가 → 지역 → 구역 3단계 구조.
- 미국(뉴욕·워싱턴 D.C.·나이아가라), 한국(강남구 역 주변 — 서초구는 내년 추가 예정)
- 외국인도 쓰도록 화면·데이터 전체 다국어(ko/en/ja)
- 현지 맛집·카페 주문 가이드
- 관광 스팟 정보 (무료/유료, 예약 여부, 팁)
- 지역별 날씨 (Open-Meteo API)
- Leaflet 지도 + 핀
- 화장실 찾기 (현재 위치 기반 Leaflet 지도)
- PWA (Service Worker 오프라인 캐시)
- 배포 목표: **GitHub Pages**

---

## 기술 스택

- **빌드 도구 없음** — 순수 HTML5 + Vanilla JS + CSS
- **지도** — Leaflet.js + OpenStreetMap (CDN)
- **날씨** — Open-Meteo API (무료, API 키 불필요)
- **데이터** — `data/nations.json` + `data/{nation}/` 아래 JSON (로컬)
- **오프라인** — `sw.js` Service Worker
- **로컬 서버** — `python3 -m http.server 8787` (프로젝트 루트에서 실행)

---

## 폴더 구조

저장소 루트가 곧 앱 루트 (GitHub Pages가 루트를 서빙).

```
trip-guide/
├── index.html          ← 푸드(맛집) 홈
├── store.html          ← 가게 상세 (?nation=us&id=store-id)
├── spots.html          ← 관광 스팟
├── map.html            ← Leaflet 지도
├── restroom.html       ← 화장실 찾기 (현재 위치 기반)
├── manifest.json       ← PWA
├── sw.js               ← Service Worker (캐시 버전: trip-guide-v6)
├── css/style.css       ← 단일 CSS, CSS 변수 기반
├── js/
│   ├── i18n.js         ← 다국어: t(), tx(), applyI18n(), 언어 전환 (geo.js보다 먼저 로드)
│   ├── geo.js          ← 국가/지역/구역 공용 로직 (loadGeo()가 loadI18n()도 호출)
│   ├── app.js          ← 푸드 홈 로직
│   ├── store.js        ← 가게 상세 로직
│   ├── spots.js        ← 관광 스팟 로직
│   ├── map.js          ← Leaflet 지도 로직
│   ├── restroom.js     ← 화장실 찾기 로직
│   └── weather.js      ← Open-Meteo API + localStorage 캐시
├── i18n/
│   ├── ko.json / en.json / ja.json   ← 화면 문구 (키 동일하게 유지)
├── data/
│   ├── nations.json    ← 국가 목록 + 국가 단위 설정 (통화, 지도 링크, 카테고리)
│   ├── us/
│   │   ├── regions.json ← 지역 + 구역 + 날씨 지점
│   │   ├── stores.json
│   │   └── spots.json
│   └── kr/              ← 같은 구조 (강남구)
└── icons/
```

---

## 지역 구조 (국가 → 지역 → 구역)

화면: 지역 탭(`#region-tabs`) + 구역 칩(`#area-chips`, 구역이 2개 이상일 때만 표시, 맨 앞에 '전체' 칩 = area null). 모두 `regions.json`에서 생성 — HTML에 탭을 직접 쓰지 않는다.

| 국가 | 지역 (`region`) | 구역 (`area`) |
|------|----------------|---------------|
| `us` | `new-york` | `downtown`, `midtown`, `uptown`, `queens` |
| `us` | `washington` | 없음 |
| `us` | `niagara` (`weather_only`) | 없음 — 날씨만 표시, 스팟 페이지에서는 숨김 |
| `kr` | `gangnam` | `gangnam-sinnonhyeon`, `yeoksam`, `seolleung`, `samseong`, `gangnam-gu-office`, `cheongdam`, `apgujeong-rodeo`, `sinsa` |
| `kr` | `seocho` (`disabled`) | 없음 — 내년 추가 예정. `disabled: true`인 지역은 화면에서 제외 |

- **서초구 추가 방법**: `data/kr/regions.json`의 `seocho`에 `areas`를 넣고 `disabled`를 지운 뒤 stores/spots에 `"region": "seocho"` 데이터 추가. 강남역처럼 경계에 걸친 역은 같은 구역 id(`gangnam-sinnonhyeon`)를 서초구 `areas`에도 넣으면 양쪽에서 보임

- 필터: 구역이 선택되면 `item.area === area.id`, 아니면 `item.region === region.id` (`matchesPlace`). 여러 지역에 걸친 구역(예: 강남역)은 각 지역의 `areas`에 같은 id로 넣으면 된다.
- 선택 상태: `sessionStorage` 키 `trip_sel_{nation}` (푸드·스팟 공유). 국가: `localStorage` 키 `trip_nation`, `?nation=` 파라미터가 우선.

### 맨해튼 구역 기준
- **다운타운**: ~23번가 이남 (소호, 웨스트·이스트빌리지, 첼시, LES, 트라이베카)
- **미드타운**: 23~59번가 (타임스퀘어, 5번가, 그랜드센트럴, 허드슨야즈)
- **어퍼사이드**: 59번가 이북 (센트럴파크, Met, 자연사박물관)

---

### nations.json — 국가

```json
{ "nations": [{
  "id": "us", "name": { "ko": "미국", "en": "USA", "ja": "アメリカ" }, "flag": "🇺🇸", "currency": "$",
  "maps": "google|naver",   // naver면 주소(현지어)로 네이버 지도 검색. 좌표 검색은 항상 구글
  "menu_lang": "en|ko",     // 메뉴판·간판 언어. 선택지 아래, 가게 이름 아래에 이 언어 표기를 작게 보여줌
  "price_tiers": [{ "id": "4k", "label": L, "min": 4000, "max": 5000 }],  // 선택 (한국만) — 가게 coffee_price로 거르는 가격대 칩. min 이상 max 미만
  "store_categories": [{ "id": "bagel", "label": { "ko": "베이글", "en": "Bagel", "ja": "ベーグル" }, "emoji": "🥯", "color": "#F59E0B" }],
  "spot_categories":  [{ "id": "landmark", "label": { "ko": "...", "en": "...", "ja": "..." }, "emoji": "🗽" }]
}] }
```

### regions.json — 지역/구역

```json
{ "regions": [{
  "id": "new-york", "name": { "ko": "뉴욕", "en": "New York", "ja": "ニューヨーク" }, "timezone": "America/New_York",
  "center": [40.758, -73.9855], "zoom": 13,
  "weather_only": false,
  "weather": { "name": { "ko": "...", "en": "...", "ja": "..." }, "lat": 0, "lng": 0 },
  "areas": [{ "id": "downtown", "name": { "ko": "다운타운", "en": "Downtown", "ja": "ダウンタウン" }, "weather": { ... } }]
}] }
```
날씨 지점: 구역에 `weather`가 있으면 그것, 없으면 지역 `weather`.

---

## 다국어 (i18n.js)

- 지원 언어: `ko`, `en`, `ja`. 언어 결정: `localStorage` `trip_lang` > 브라우저 언어 > `en`
- **화면 문구**: `i18n/{lang}.json`의 키. HTML은 `data-i18n`(글자), `data-i18n-html`(태그 포함), `data-i18n-placeholder`, `data-i18n-title`(title + aria-label). JS는 `t('key', { name: 값 })` — `{name}` 자리 채움
- **데이터 글자**: `{ "ko": "...", "en": "...", "ja": "..." }` 객체 → `tx(value)`로 표시. 현재 언어 > en > ko 순으로 대체. 문자열이면 그대로 표시 (아직 번역 안 된 데이터)
- 새 문구 추가 시 **세 파일 모두에 같은 키** 추가. 빠지면 영어 → 키 이름 순으로 표시됨
- 언어 전환 버튼(`#lang-switch`): 푸드·스팟·화장실 헤더. 전환 시 페이지 새로고침
- 모든 데이터(`nations.json`, `regions.json`, `stores.json`, `spots.json`)의 표시 글자는 다국어 객체

---

## 데이터 스키마

### stores.json — 맛집

루트 구조: `{ "stores": [ ... ] }`. `L` = `{ "ko": "...", "en": "...", "ja": "..." }` 다국어 객체.

```json
{
  "id": "string (URL용 kebab-case)",
  "name": "string | L",                   // 미국은 원래 이름 문자열, 한국은 L (간판 표기 = ko)
  "category": "nations.json의 store_categories id",
  "region": "regions.json의 지역 id",
  "area": "regions.json의 구역 id | null",
  "address": "string | L",                // 한국은 L — 지도 검색은 menu_lang 주소로 (addressQuery)
  "lat": 0.0, "lng": 0.0,
  "tip_expected": true|false,             // 선택 (미국)
  "has_seating": true|false,              // 선택
  "price_range": "$X~Y",                  // 선택 — 추천 메뉴 기준 1인 예상 (미국)
  "coffee_price": 4500,                   // 선택 (한국) — 아메리카노(없으면 기본 커피) 가격. 카드에 ☕ ₩4,500으로 표시, 가격대 칩 필터 기준
  "description": L,
  "order_guide": [                        // 주문 가이드: 단계 + 선택지만 (대화 예문 없음)
    {
      "step": 1,
      "title": L,                         // 예: "베이글 고르기"
      "note": L,                          // 선택 — 💡 팁
      "options": [ { "name": L, "recommended": true } ]   // recommended는 추천일 때만
    }
  ],
  "menu_guide": [ { "name": L, "description": L, "recommended": true } ],
  "tips": [L, ...]
}
```

- 선택지·메뉴 이름 아래에는 **메뉴판 표기**(`nations.json`의 `menu_lang`, 미국은 `en`)가 작게 표시됨 — 현재 언어 이름과 같으면 숨김 (`menuName()`)

### spots.json — 관광 스팟

루트 구조: `{ "spots": [ ... ] }`

```json
{
  "id": "string",
  "name": L,
  "region": "regions.json의 지역 id",
  "area": "regions.json의 구역 id | null",
  "category": "nations.json의 spot_categories id",
  "address": "string",
  "lat": 0.0, "lng": 0.0,
  "admission": "free|paid",
  "admission_note": L,
  "reservation": false|true|"recommended",
  "hours": L,
  "description": L,
  "tips": [L, ...]
}
```

---

## 현재 데이터 현황

### 미국 맛집 (data/us/stores.json) — 총 45곳

| 구역 | 가게 | 카테고리 |
|------|------|----------|
| **다운타운** (14곳) | Ess-a-Bagel, Katz's Delicatessen, Joe's Pizza, Los Tacos No. 1, Tacombi, Ippudo NY, Dominique Ansel Bakery, Clinton St. Baking Co., Russ & Daughters Cafe, Sadelle's, Breads Bakery, Blue Bottle Coffee, Intelligentsia Coffee, La Colombe Coffee | bagel, deli, pizza, taco×2, ramen, bakery×4, coffee×3 |
| **미드타운** (11곳) | Stumptown Coffee, The Halal Guys, Totto Ramen, Go Go Curry, Shake Shack, Burger Joint, Magnolia Bakery, Junior's Restaurant, Jongro BBQ, Dallas BBQ Times Square, CAVA | coffee, other×2, ramen, burger×2, bakery, other×4 |
| **어퍼사이드** (6곳) | Levain Bakery, Absolute Bagels, Gray's Papaya, Cafe Lalo, Hungarian Pastry Shop, Zabar's | bakery×2, bagel, other, coffee, deli |
| **Queens** (5곳) | Xi'an Famous Foods, Joe's Shanghai, Nan Xiang Xiao Long Bao, Taverna Kyclades, New World Mall Food Court | other×5 |
| **Washington D.C.** (9곳) | Old Ebbitt Grill, Founding Farmers, District Taco, Shake Shack DC, Mitsitam Native Foods Café, Jaleo by José Andrés, Eastern Market, Ted's Bulletin, Ben's Chili Bowl | other×5, taco, burger, deli×2 |

### 한국 강남구 (data/kr/) — 가게 22곳 (카페 14곳), 스팟 6곳

출처: visitgangnam.net(강남구 관광 사이트) 목록 + 웹 검색으로 주소 확인, 좌표는 Nominatim(OpenStreetMap). 2026-10 카페 10곳 추가 + 아메리카노 가격(`coffee_price`)은 polle.com 매장 페이지 메뉴·후기 기준 (바뀔 수 있음). 노티드·랄프스 커피는 가격 미확인.

| 구역 | 가게 (☕ 아메리카노) | 스팟 |
|------|------|------|
| 강남역·신논현 | 쉐이크쉑 강남, 사운즈 커피 (4,500 — 주간 필터 커피), 리퍼크 (4,900) | — |
| 역삼 | 블루보틀 역삼 (5,900) | — |
| 선릉 | 알렉산더 커피 스튜디오 (4,500) | 선릉과 정릉 |
| 삼성·코엑스 | 테라로사 포스코센터점 (5,500), 카페 드 리옹 코엑스 (5,800), 포스톤즈 삼성본점 (5,500), 고운님 | 봉은사, 별마당 도서관, 코엑스 아쿠아리움 |
| 강남구청·학동 | 구테로이테 (4,800), 파퓰러 커피 로스터스 (4,000), 폴 바셋 강남구청역점 (룽고 5,300), 진미평양냉면 | — |
| 청담 | 두루 | — |
| 압구정로데오·도산공원 | 런던베이글뮤지엄 도산 (5,000 — 안국점 기준), 노티드 청담, 누데이크 하우스 도산 (5,500), 변강쇠떡볶이 | 도산공원 |
| 신사·가로수길 | 마일스톤커피 (5,300), 테일러 커피 신사 (5,500), 블루보틀 압구정 (5,900), 랄프스 커피 가로수길 | 가로수길 |

- 가격대 칩: 3~4천원 / 4~5천원 / 5~6천원 / 6천원 이상 (`nations.json` `price_tiers`). 현재 3~4천원·6천원 이상에 해당하는 가게는 없음

### 미국 관광 스팟 (data/us/spots.json) — 총 27곳

| 구역 | 스팟 |
|------|------|
| **다운타운** (8곳) | 브루클린 브리지, 자유의 여신상, 휘트니 미술관, 하이라인, 첼시 마켓, 트레이더 조, 소호, 9/11 메모리얼 |
| **미드타운** (10곳) | 베슬, 엣지 전망대, 타임스 스퀘어, 엠파이어 스테이트, 탑 오브 더 록, 그랜드 센트럴, 뉴욕 공립도서관, MoMA, H Mart 코리아타운, 홀푸드 마켓 |
| **어퍼사이드** (3곳) | 센트럴 파크, The Met, 자연사 박물관 |
| **Queens** (2곳) | 플러싱 메도스 코로나 파크, H Mart 플러싱 |
| **Washington D.C.** (4곳) | 링컨 기념관, 워싱턴 기념탑, 스미소니언 자연사 박물관, 국회의사당 |

---

## 날씨 (weather.js)

- API: `https://api.open-meteo.com/v1/forecast` (timezone은 지역 설정값)
- 캐시: `localStorage` 키 `trip_weather_v1_{nation}_{지점 id}`, TTL 30분
- 호출: `initWeather('weather-scroll', weatherPoint(region, area))` — 선택이 바뀔 때마다 호출
- 화면: 기본은 접힌 한 줄 요약(`.w-summary`: 지점·오늘 최고/최저·강수·내일). 누르면 `.weather-section.open`으로 오늘·내일 카드(`.w-cards`) 펼침. 상태는 `localStorage` `trip_weather_open` (`'1'` = 펼침)

---

## Service Worker (sw.js)

- 캐시 이름: `trip-guide-v6`
- 전략: App Shell(HTML·JS·CSS)은 cache-first, Open-Meteo API와 `.json`(데이터·문구)은 network-first + cache fallback
- **새 파일 추가 시** (국가 데이터 포함) `APP_SHELL` 배열에 경로 추가 후 캐시 이름 버전 올리기 (`trip-guide-v7` 등)

---

## 하단 네비게이션

모든 HTML 파일(index, store, spots, map, restroom)에 동일한 구조 (SVG 아이콘 사용):

```html
<nav class="bottom-nav">
  <a class="nav-item [active]" href="index.html">푸드 아이콘</a>
  <a class="nav-item [active]" href="spots.html">스팟 아이콘</a>
  <a class="nav-item [active]" href="map.html">지도 아이콘</a>
  <a class="nav-item [active]" href="restroom.html">화장실 아이콘</a>
</nav>
```
현재 페이지 항목에만 `active` 클래스 추가.

---

## 로컬 개발

```bash
# 프로젝트 루트에서 실행
cd /Users/petermini/Documents/trip-guide   # 저장소 루트
python3 -m http.server 8787

# 브라우저에서 접속
# http://localhost:8787/index.html
```

Service Worker는 `http://localhost`에서만 동작 (https 불필요).

---

## 남은 작업 (trip-guide 리팩토링)

- [x] 1단계: 이름 변경, 앱을 저장소 루트로 이동, 국가/지역/구역 구조 (`geo.js`, `nations.json`, `regions.json`)
- [x] GitHub 저장소 이름 `nyc` → `trip-guide` 변경 (Pages: https://tnfhrnsss.github.io/trip-guide/ — main 머지 후 반영)
- [x] 2단계: 다국어(ko/en/ja) — `i18n/*.json` + `data-i18n` 속성, 헤더 언어 전환
- [x] 3단계: 데이터 다국어화 — 텍스트 필드를 `{ko,en,ja}`로, `ordering_flow`(영어 Q&A) → `order_guide`(단계·선택지만), `sauce_guide` → `menu_guide`
- [x] 4단계: 한국(`data/kr/`) — 강남구 역 구역, 카페 중심 데이터, 네이버 지도 링크
- [ ] 한국 데이터 보강: 역삼·청담 카페, 3~4천원·6천원 이상 가격대 카페, 카페 외 가게 가격 정보
- [ ] 한국 화장실: 공공데이터포털 '전국공중화장실표준데이터'로 강남구 JSON 만들기 (현재는 OpenStreetMap)
- [ ] 서초구 추가 (내년)
- [ ] 지도(map.html)에 스팟 핀도 표시
- [ ] PWA 아이콘 개선

---

## 주요 설계 결정 및 이유

| 결정 | 이유 |
|------|------|
| 빌드 도구 없음 | GitHub Pages 단순 배포, 학습 부담 최소화 |
| 국가별 data 폴더 | 국가 단위 설정(통화·지도·카테고리)을 한 곳에, 국가 추가 = 폴더 추가 |
| stores.json 루트 키 `"stores"` | 배열 직접 노출 대신 네임스페이스 래핑 |
| 국가 → 지역 → 구역 | 워싱턴·나이아가라를 뉴욕과 분리, 한국은 구 → 역 구조로 그대로 적용 |
| 날씨 캐시 per-region | 지역별 30분 TTL, 중복 API 호출 방지 |
| `weather_only` 지역 | 투어 지역(나이아가라)은 식당 정보 불필요 — 이름 비교 대신 플래그 |

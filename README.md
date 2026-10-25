# Trip Guide

여행자를 위한 **오프라인 우선 웹앱**. 국가 → 지역 → 구역 3단계 구조.
- 🇺🇸 미국: 뉴욕(다운타운·미드타운·어퍼사이드·퀸즈), 워싱턴 D.C., 나이아가라(날씨만)
- 🇰🇷 한국: 서울 강남구 — 지하철역 주변 구역별 카페·맛집 (서초구는 추가 예정)

화면과 데이터 전체가 **한국어·영어·일본어**로 나옵니다. 외국인도 현지 가게에서 주문 순서와 선택지를 보고 바로 주문할 수 있습니다.

> **라이브**: https://tnfhrnsss.github.io/trip-guide/

<img src="screenshot.png" width="300" alt="앱 스크린샷">

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 주문 가이드 | 가게별 주문 단계 + 선택지 + 추천 표시. 선택지 아래에 현지 메뉴판 표기를 작게 보여줌 |
| 메뉴·팁 | 대표 메뉴 설명, 방문 팁 (영업시간, 가까운 역, 대기 등) |
| 가격 | 미국: 1인 예상 가격대 / 한국: 아메리카노 가격 + 가격대 필터 (3~4천원 · 4~5천원 · 5~6천원 · 6천원 이상) |
| 관광 스팟 | 무료/유료, 예약 여부, 운영시간, 팁 |
| 날씨 | 구역별 오늘·내일 날씨 (Open-Meteo). 기본은 한 줄 요약, 누르면 펼침 |
| 지도 | Leaflet + OpenStreetMap 핀. 길찾기는 미국 Google 지도, 한국 네이버 지도 |
| 화장실 찾기 | 현재 위치 기반 주변 화장실 |
| 다국어 | 헤더에서 KO / EN / JA 전환 |
| 오프라인 · PWA | Service Worker 캐시, 홈 화면에 설치 가능 |

---

## 데이터 현황

### 🇰🇷 강남구 — 가게 22곳 (카페 14곳), 스팟 6곳

| 구역 | 가게 (☕ 아메리카노) | 스팟 |
|------|------|------|
| 강남역·신논현 | 쉐이크쉑 강남, 사운즈 커피 (4,500), 리퍼크 (4,900) | — |
| 역삼 | 블루보틀 역삼 (5,900) | — |
| 선릉 | 알렉산더 커피 스튜디오 (4,500) | 선릉과 정릉 |
| 삼성·코엑스 | 테라로사 포스코센터점 (5,500), 카페 드 리옹 코엑스 (5,800), 포스톤즈 삼성본점 (5,500), 고운님 | 봉은사, 별마당 도서관, 코엑스 아쿠아리움 |
| 강남구청·학동 | 구테로이테 (4,800), 파퓰러 커피 로스터스 (4,000), 폴 바셋 강남구청역점 (5,300), 진미평양냉면 | — |
| 청담 | 두루 | — |
| 압구정로데오·도산공원 | 런던베이글뮤지엄 도산 (5,000), 노티드 청담, 누데이크 하우스 도산 (5,500), 변강쇠떡볶이 | 도산공원 |
| 신사·가로수길 | 마일스톤커피 (5,300), 테일러 커피 신사 (5,500), 블루보틀 압구정 (5,900), 랄프스 커피 가로수길 | 가로수길 |

> 가격은 메뉴판·후기 기준(2026년 10월 조사)이라 바뀔 수 있습니다.

### 🇺🇸 미국 — 맛집 45곳, 스팟 27곳

| 구역 | 맛집 | 스팟 |
|------|------|------|
| 다운타운 | Ess-a-Bagel, Katz's, Joe's Pizza, Los Tacos No. 1, Tacombi, Ippudo, Dominique Ansel, Clinton St., Russ & Daughters Cafe, Sadelle's, Breads Bakery, Blue Bottle, Intelligentsia, La Colombe (14) | 브루클린 브리지, 자유의 여신상, 휘트니 미술관, 하이라인, 첼시 마켓, 트레이더 조, 소호, 9/11 메모리얼 (8) |
| 미드타운 | Stumptown, The Halal Guys, Totto Ramen, Go Go Curry, Shake Shack, Burger Joint, Magnolia, Junior's, Jongro BBQ, Dallas BBQ, CAVA (11) | 베슬, 엣지, 타임스 스퀘어, 엠파이어 스테이트, 탑 오브 더 록, 그랜드 센트럴, 뉴욕 공립도서관, MoMA, H Mart 코리아타운, 홀푸드 (10) |
| 어퍼사이드 | Levain, Absolute Bagels, Gray's Papaya, Cafe Lalo, Hungarian Pastry Shop, Zabar's (6) | 센트럴 파크, The Met, 자연사 박물관 (3) |
| 퀸즈 | Xi'an Famous Foods, Joe's Shanghai, Nan Xiang, Taverna Kyclades, New World Mall (5) | 플러싱 메도스 코로나 파크, H Mart 플러싱 (2) |
| 워싱턴 D.C. | Old Ebbitt Grill, Founding Farmers, District Taco, Shake Shack DC, Mitsitam, Jaleo, Eastern Market, Ted's Bulletin, Ben's Chili Bowl (9) | 링컨 기념관, 워싱턴 기념탑, 스미소니언 자연사 박물관, 국회의사당 (4) |

---

## 로컬 실행

```bash
# 저장소 루트에서
python3 -m http.server 8787
```

브라우저에서 `http://localhost:8787` 접속. 빌드 도구 불필요 (순수 HTML + CSS + Vanilla JS).

---

## 기술 스택

```
Frontend   HTML5 + Vanilla JS (빌드 없음)
스타일     CSS (모바일 우선, 단일 파일)
다국어     i18n/{ko,en,ja}.json + 데이터 안의 { ko, en, ja } 객체
지도       Leaflet.js + OpenStreetMap
날씨       Open-Meteo API (무료, API 키 불필요)
데이터     data/nations.json + data/{국가}/*.json (로컬)
오프라인   Service Worker (trip-guide-v6) — 화면 파일은 캐시 우선, JSON은 네트워크 우선
배포       GitHub Pages (main 브랜치 루트)
```

---

## 파일 구조

```
(저장소 루트)
├── index.html       푸드 홈 (가게 목록)
├── store.html       가게 상세 (주문 가이드 · 메뉴 · 팁)
├── spots.html       관광 스팟
├── map.html         지도
├── restroom.html    화장실 찾기
├── manifest.json    PWA 설정
├── sw.js            Service Worker
├── css/style.css
├── js/
│   ├── i18n.js      다국어 (t, tx, 언어 전환)
│   ├── geo.js       국가 → 지역 → 구역 공용 로직, 카테고리·가격대 칩
│   ├── app.js       푸드 홈
│   ├── store.js     가게 상세
│   ├── spots.js     스팟
│   ├── map.js       지도
│   ├── restroom.js  화장실 찾기
│   └── weather.js   날씨
├── i18n/            ko.json · en.json · ja.json (화면 문구)
└── data/
    ├── nations.json 국가 설정 (통화, 지도 서비스, 카테고리, 가격대)
    ├── us/          regions.json · stores.json · spots.json
    └── kr/          regions.json · stores.json · spots.json
```

---

## 데이터 추가 방법

글자는 모두 `{ "ko": "...", "en": "...", "ja": "..." }` 형태로 씁니다 (아래 `L`).

### 가게 (`data/{국가}/stores.json`의 `"stores"` 배열)

```json
{
  "id": "가게-이름-kebab",
  "name": "Shake Shack 또는 L",
  "category": "nations.json의 store_categories id",
  "region": "gangnam",
  "area": "gangnam-sinnonhyeon",
  "address": "주소 또는 L",
  "lat": 0.0, "lng": 0.0,
  "coffee_price": 4500,
  "price_range": "$X~Y",
  "has_seating": true,
  "description": L,
  "order_guide": [
    { "step": 1, "title": L, "note": L, "options": [{ "name": L, "recommended": true }] }
  ],
  "menu_guide": [{ "name": L, "description": L, "recommended": true }],
  "tips": [L]
}
```

- `coffee_price`: 한국 카페 아메리카노 가격 (가격대 필터 기준). `price_range`: 미국 1인 예상 가격
- `note`, `recommended`, `coffee_price`, `price_range`, `has_seating`, `tip_expected`는 선택

### 관광 스팟 (`data/{국가}/spots.json`의 `"spots"` 배열)

```json
{
  "id": "스팟-이름-kebab",
  "name": L,
  "region": "gangnam", "area": "samseong",
  "category": "nations.json의 spot_categories id",
  "address": "주소 또는 L",
  "lat": 0.0, "lng": 0.0,
  "admission": "free|paid",
  "admission_note": L,
  "reservation": false,
  "hours": L,
  "description": L,
  "tips": [L]
}
```

JSON만 고치면 코드 수정 없이 반영됩니다. 새 지역·구역은 `regions.json`에 추가합니다. 자세한 규칙은 `.claude/CLAUDE.md`를 참고하세요.

---

## 배포

- 저장소: https://github.com/tnfhrnsss/trip-guide
- 배포 URL: https://tnfhrnsss.github.io/trip-guide/
- Settings → Pages → Source: `main` 브랜치, `/ (root)`. main에 푸시하면 자동 반영

---

## 향후 계획

- [ ] 강남구 데이터 보강 (역삼·청담 카페, 카페 외 가게 가격)
- [ ] 한국 화장실: 공공데이터 공중화장실 데이터 사용
- [ ] 서초구 추가
- [ ] 지도에 스팟 핀 표시
- [ ] PWA 아이콘 개선

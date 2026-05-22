const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const axios = require('axios');
const cheerio = require('cheerio');
//const { chromium } = require('playwright');

// server.js 상단에 추가
app.use((req, res, next) => {
  res.setTimeout(120000); // 2분
  next();
});

let latestResult = {
  keyword: '',
  placeCount: 0,
  result: []
};

async function getHtml(url) {
  const response = await axios.get(url);
  return response.data;
}
//
//
// localhost:4000 접속 시 HTML 출력
app.get('/', async (req, res) => {

  try {

    const html = await getHtml('https://pcmap.place.naver.com/restaurant/36084538/review/visitor');
    const $ = cheerio.load(html);

    // 문자열 목록 추출
    const reviews = [];

    $('a.pui__GStJHb').each((i, el) => {

      const text = $(el).text().trim();
    
      reviews.push(text);

    });
    
    console.log(reviews);
    res.send(reviews);

  } catch (error) {

    console.error(error);

    res.status(500).send('에러 발생');

  }

});

app.get('/search', async (req, res) => {

  const keyword = req.query.keyword;

  const searchUrl =
    `https://map.naver.com/p/search/${encodeURIComponent(keyword)}?c=15.00,0,0,0,dh`;

  try {

//const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});

    const page = await browser.newPage();

    const places = [];
    const visitedPlace = new Set();

    // ========================================
    // 검색 API 감지
    // ========================================
    page.on('response', async (response) => {

      try {

        const url = response.url();

        const contentType =
          response.headers()['content-type'] || '';

        if (
          contentType.includes('application/json')
        ) {

          if (
            url.includes('/search') ||
            url.includes('/graphql') ||
            url.includes('/list')
          ) {

            let json;

try {
  json = await response.json();
} catch {
  return;
}

            // placeId 추출 재귀 함수
            function extractPlaces(obj) {

              if (!obj) return;

              if (Array.isArray(obj)) {

                obj.forEach(extractPlaces);
                return;
              }

              if (typeof obj === 'object') {

                // id + name 조합 발견
                if (
                  obj.id &&
                  obj.name &&
                  /^\d+$/.test(String(obj.id))
                ) {

                  const placeId = String(obj.id);

                  if (!visitedPlace.has(placeId)) {

                    visitedPlace.add(placeId);

                    places.push({
                      placeId,
                      name: obj.name
                    });

                    console.log(
                      `[PLACE] ${placeId} / ${obj.name}`
                    );

                  }

                }

                for (const key in obj) {
                  extractPlaces(obj[key]);
                }

              }

            }

            extractPlaces(json);

          }

        }

      } catch (e) {}

    });

    // 검색 페이지 이동
    await page.goto(searchUrl);

    await page.waitForSelector('body');

    await page.waitForTimeout(7000);

const Allreviews = []

for (const place of places) {

      console.log('\n====================');
      console.log(`업체: ${place.name}`);
      console.log('====================');

    try {
 const reviewUrl = `https://pcmap.place.naver.com/restaurant/${place.placeId}/review/visitor`
    const html = await getHtml(reviewUrl)
    const $ = cheerio.load(html);

    // 문자열 목록 추출
    const reviews = [];

    $('a.pui__GStJHb').each((i, el) => {

      const text = $(el).text().trim()
      if(
        text &&
        !(text.includes('리뷰')&&text.includes('사진'))&&
        !text.includes('1명')&&
        !text.includes('2명')&&
        !text.includes('3명')&&
        !text.includes('4명')&&
        !text.includes('팔로우') &&
        !text.includes('펼쳐보기')&&
        !text.includes('반응 남기기')
      ){
        reviews.push(text);
      }

    });
    
    Allreviews.push({
      name: place.name,
      reviewCount: reviews.length,
      reviews
    })
    console.log(reviews);


  } catch (error) {

    console.log(
      `${place.name} 리뷰 수집 실패`
    );


  }
}
latestResult = {
  keyword,
  placeCount: places.length,
  result: Allreviews
};
res.json({
  success: true,
  data: latestResult
});
await browser.close();

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: '요청 실패'
    });

  }

});
app.get('/api/review', (req, res) => {
res.json({
  success: true,
  data: latestResult
});

});
/*
app.listen(PORT, () => {

  console.log(`서버 실행: http://localhost:${PORT}`);

});
*/

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SERVER START ${PORT}`);
});
import Fuse from "fuse.js";

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

function calculateRankingScore(item, keyword, fuseScore) {
  const searchText = normalizeText(keyword);

  const question = normalizeText(item.question);
  const context = normalizeText(item.context);

  const options = Object.values(item.options || {})
    .map(normalizeText);

  let score = 0;

  // 1. 題目完全等於搜尋內容
  if (question === searchText) {
    score += 150;
  }

  // 2. 題目包含完整關鍵字
  else if (question.includes(searchText)) {
    score += 100;
  }

  // 3. 題目開頭就出現關鍵字
  if (question.startsWith(searchText)) {
    score += 30;
  }

  // 4. 題組背景包含關鍵字
  if (context.includes(searchText)) {
    score += 40;
  }

  // 5. 選項包含關鍵字
  if (options.some((option) => option.includes(searchText))) {
    score += 20;
  }

  // 6. Fuse fuzzy score
  // Fuse score 越小越相關
  const fuzzyScore = (1 - (fuseScore ?? 1)) * 50;

  score += fuzzyScore;

  return score;
}

function searchQuestions(questions, keyword) {
  const cleanKeyword = keyword.trim();

  if (!cleanKeyword) {
    return {
      results: [],
      total: 0,
    };
  }

  const fuse = new Fuse(questions, {
    keys: [
      {
        name: "question",
        weight: 2,
      },
      {
        name: "context",
        weight: 1,
      },
      {
        name: "options.A",
        weight: 0.5,
      },
      {
        name: "options.B",
        weight: 0.5,
      },
      {
        name: "options.C",
        weight: 0.5,
      },
      {
        name: "options.D",
        weight: 0.5,
      },
    ],

    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  });

  // 先讓 Fuse 找所有候選
  const candidates = fuse.search(cleanKeyword);

  // 再進行自己的 ranking
  const rankedResults = candidates
    .map((result) => {
      const rankingScore = calculateRankingScore(
        result.item,
        cleanKeyword,
        result.score
      );

      return {
        ...result.item,

        fuseMatches: result.matches || [],

        fuseScore: result.score,

        rankingScore,
      };
    })

    // rankingScore 越大越相關
    .sort((a, b) => b.rankingScore - a.rankingScore);

  return {
    // 最後才取前三名
    results: rankedResults.slice(0, 3),

    // Fuse 總共找到幾筆
    total: rankedResults.length,
  };
}

export default searchQuestions;
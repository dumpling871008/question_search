import Fuse from "fuse.js";
import extractKeywords, { normalizeText } from "./extractKeywords.js";

export function calculateRankingScore(item, keyword, keywords, fuseScore) {
  const question = normalizeText(item.question);
  const context = normalizeText(item.context);
  const options = Object.values(item.options || {}).map(normalizeText);
  const searchText = normalizeText(keyword);

  let matchedKeywords = 0;
  let fieldScore = 0;

  for (const word of keywords) {
    // 每個詞只計算一次，採用命中欄位中的最高權重。
    const weight = question.includes(word) ? 1
      : context.includes(word) ? 0.5
        : options.some((option) => option.includes(word)) ? 0.25 : 0;

    if (weight > 0) matchedKeywords += 1;
    fieldScore += weight;
  }

  // Coverage 是正規化後的 substring 命中比例，不將 fuzzy 誤差當精確命中。
  const keywordCoverage = matchedKeywords / keywords.length;
  const exactScore = question === searchText ? 1
    : question.includes(searchText) ? 0.75
      : context.includes(searchText) ? 0.5
        : options.some((option) => option.includes(searchText)) ? 0.25 : 0;

  // 多命中一詞增加 100 / N 分；其餘加分合計最多 90 / N，確保 coverage 優先。
  const rankingScore = keywordCoverage * 100 + (
    40 * fieldScore / keywords.length +
    30 * exactScore +
    20 * (1 - fuseScore)
  ) / keywords.length;

  return { rankingScore, keywordCoverage };
}

function mergeMatches(matches) {
  const fields = new Map();

  for (const match of matches) {
    if (!fields.has(match.key)) {
      fields.set(match.key, { ...match, indices: [] });
    }
    fields.get(match.key).indices.push(...match.indices);
  }

  return [...fields.values()].map((match) => {
    const indices = [];
    const sorted = [...match.indices].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    for (const [start, end] of sorted) {
      const previous = indices[indices.length - 1];
      if (previous && start <= previous[1] + 1) {
        previous[1] = Math.max(previous[1], end);
      } else {
        indices.push([start, end]);
      }
    }

    // 保留 Fuse 在原始字串上的位置，QuestionCard 不需修改。
    return { ...match, indices };
  });
}

function searchQuestions(questions, keyword) {
  const keywords = extractKeywords(keyword);

  if (!keywords.length) {
    return { results: [], total: 0 };
  }

  const fuse = new Fuse(questions, {
    keys: [
      { name: "question", weight: 2 },
      { name: "context", weight: 1 },
      { name: "options.A", weight: 0.5 },
      { name: "options.B", weight: 0.5 },
      { name: "options.C", weight: 0.5 },
      { name: "options.D", weight: 0.5 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  });

  // OR retrieval：任一詞命中即納入候選；以原始索引合併，不依賴題號唯一性。
  const candidates = new Map();
  for (const word of keywords) {
    for (const result of fuse.search(word)) {
      if (!candidates.has(result.refIndex)) {
        candidates.set(result.refIndex, {
          item: result.item,
          refIndex: result.refIndex,
          scoreSum: keywords.length,
          matches: [],
        });
      }

      const candidate = candidates.get(result.refIndex);
      // 未命中的詞以最差分數 1 計算，避免只匹配一詞卻取得過高平均分。
      candidate.scoreSum += (result.score ?? 1) - 1;
      candidate.matches.push(...(result.matches || []));
    }
  }

  const rankedResults = [...candidates.values()].map((candidate) => {
    const fuseScore = Math.max(0, Math.min(1, candidate.scoreSum / keywords.length));
    return {
      refIndex: candidate.refIndex,
      item: {
        ...candidate.item,
        fuseMatches: mergeMatches(candidate.matches),
        fuseScore,
        ...calculateRankingScore(candidate.item, keyword, keywords, fuseScore),
      },
    };
  }).sort((a, b) =>
    b.item.rankingScore - a.item.rankingScore || a.refIndex - b.refIndex
  );

  return {
    results: rankedResults.slice(0, 3).map((result) => result.item),
    total: rankedResults.length,
  };
}

export default searchQuestions;

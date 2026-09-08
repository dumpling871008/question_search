import Fuse from "fuse.js";

function searchQuestions(questions, keyword) {
  const cleanKeyword = keyword.trim();

  if (!cleanKeyword) {
    return [];
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
        weight: 1,
      },
      {
        name: "options.B",
        weight: 1,
      },
      {
        name: "options.C",
        weight: 1,
      },
      {
        name: "options.D",
        weight: 1,
      },
    ],

    threshold: 0.35,
    ignoreLocation: true,
    includeMatches: true,
    includeScore: true,
  });

  return fuse
    .search(cleanKeyword)
    .slice(0, 3)
    .map((result) => ({
      ...result.item,

      // 給 QuestionCard 做 highlight
      fuseMatches: result.matches || [],

      // 顯示匹配度
      matchScore: Math.round(
        (1 - (result.score ?? 1)) * 100
      ),
    }));
}

export default searchQuestions;
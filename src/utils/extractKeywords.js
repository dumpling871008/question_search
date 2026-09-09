const segmenter = new Intl.Segmenter("zh-TW", { granularity: "word" });

const templatePattern = /最可能為何者|何者最適當|下列何者|下列何項|下列何種|何者正確|何者錯誤|請問/gu;

const stopWords = new Set([
  "的", "了", "是", "在", "有", "為", "與", "和", "或", "及", "於",
  "中", "之", "其", "此", "該", "若", "則", "請", "下列", "何者",
  "何種", "何項", "選項", "敘述", "正確", "錯誤", "最", "較",
  // 單字型低資訊詞
  "一", "二", "三",
  "甲", "乙", "丙", "丁",
  "圖", "表",
  "上", "下",
]);

export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function extractKeywords(text) {
  const cleanText = normalizeText(text).replace(templatePattern, " ");
  const keywords = new Set();

  for (const { segment, isWordLike } of segmenter.segment(cleanText)) {
    if (!isWordLike || stopWords.has(segment)) {
      continue;
    }
    keywords.add(segment);
  }

  // 保留斷詞的原始順序；重要性由 ranking 決定。
  return [...keywords];
}

export default extractKeywords;

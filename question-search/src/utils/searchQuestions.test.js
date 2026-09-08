import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import extractKeywords from "./extractKeywords.js";
import searchQuestions from "./searchQuestions.js";

const data = JSON.parse(readFileSync(
  new URL("../data/questions.json", import.meta.url), "utf8"
)).questions;

test("NFKC、模板、stop words、去重；保留英文與數字", () => {
  assert.deepEqual(
    extractKeywords("請問，下列何者正確？ ＡＰＰＬＥ apple，１２３ A 水 的"),
    ["apple", "123", "a"]
  );
  assert.deepEqual(extractKeywords("何者最適當？最可能為何者？"), []);
});

test("空輸入、標點、模板與單一中文字不產生候選", () => {
  for (const input of ["", "  ", "！？", "下列何者正確", "水"]) {
    assert.deepEqual(searchQuestions(data, input), { results: [], total: 0 });
  }
});

test("短中文詞與英文拼字誤差仍可搜尋", () => {
  assert.equal(searchQuestions(data, "紅樹林").results[0].question_number, "2");
  const result = searchQuestions([{ question: "apple", question_number: "1" }], "appl");
  assert.equal(result.total, 1);
  assert(result.results[0].fuseMatches.length > 0);
});

test("完整題目可找出原題與不同句子的相關候選", () => {
  const input = data.find((item) => item.question_number === "4").question;
  const related = { question_number: "related", question: "植物分類與學名：Malus Rosaceae apple" };
  const result = searchQuestions([...data, related], input);
  assert.equal(result.results[0].question_number, "4");
  assert(result.results.some((item) => item.question_number === "related"));
  assert.equal(result.results.length, 3);
});

test("coverage 優先於單一欄位的高權重", () => {
  const result = searchQuestions([
    { question_number: "partial", question: "alpha" },
    { question_number: "complete", question: "unrelated", options: { A: "alpha beta" } },
  ], "alpha beta");
  assert.equal(result.results[0].question_number, "complete");
  assert.equal(result.results[0].keywordCoverage, 1);
  assert.equal(result.results[1].keywordCoverage, 0.5);
});

test("coverage 相同時 question > context > options，支援 A 到 D", () => {
  for (const key of ["A", "B", "C", "D"]) {
    const result = searchQuestions([
      { question_number: "option", question: "", options: { [key]: "alpha" } },
      { question_number: "context", question: "", context: "alpha" },
      { question_number: "question", question: "alpha" },
    ], "alpha");
    assert.deepEqual(result.results.map((item) => item.question_number),
      ["question", "context", "option"]);
  }
});

test("exact match 優先於 substring match", () => {
  const result = searchQuestions([
    { question_number: "substring", question: "alpha beta gamma" },
    { question_number: "exact", question: "alpha beta" },
  ], "alpha beta");
  assert.equal(result.results[0].question_number, "exact");
});

test("同分依原始順序、Top 3 與 total，重複題號不吞掉資料", () => {
  const items = Array.from({ length: 5 }, (_, index) => ({
    question_number: "same", question: "alpha", originalIndex: index,
  }));
  const before = JSON.stringify(items);
  const result = searchQuestions(items, "alpha");
  assert.equal(result.total, 5);
  assert.deepEqual(result.results.map((item) => item.originalIndex), [0, 1, 2]);
  assert.deepEqual(searchQuestions(items, "alpha"), result);
  assert.equal(JSON.stringify(items), before);
});

test("多詞 highlight 合併成每欄位一筆，區間不重疊且保留原文字", () => {
  const question = "apple banana apple";
  const { results } = searchQuestions([{ question }], "apple banana");
  const matches = results[0].fuseMatches.filter((match) => match.key === "question");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].value, question);
  let end = -1;
  for (const [start, nextEnd] of matches[0].indices) {
    assert(start > end);
    assert(nextEnd >= start && nextEnd < question.length);
    end = nextEnd;
  }
  const highlighted = matches[0].indices.map(([start, last]) => question.slice(start, last + 1)).join(" ");
  assert(highlighted.includes("apple"));
  assert(highlighted.includes("banana"));
});

test("完整英文全形輸入正規化後可命中原始半形資料", () => {
  assert.equal(searchQuestions([{ question: "apple 123" }], "ＡＰＰＬＥ １２３").total, 1);
});

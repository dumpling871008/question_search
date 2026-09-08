import { useEffect, useMemo, useState } from "react";

import data from "./data/questions.json";

import SearchBar from "./components/SearchBar.jsx";
import QuestionCard from "./components/QuestionCard.jsx";

import searchQuestions from "./utils/searchQuestions";

import "./App.css";

function App() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  function handleSearch(keyword) {
    setDebouncedKeyword(keyword);
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [keyword]);

  // 確保 questions 一定是陣列
  const questions = useMemo(() => {
    return Array.isArray(data)
      ? data
      : data.questions ?? [];
  }, []);

  // 呼叫 searchQuestions.js
  const searchResults = useMemo(() => {
    return searchQuestions(questions, debouncedKeyword);
  }, [questions, debouncedKeyword]);
  
  const filteredQuestions = searchResults.results;
  const totalResults = searchResults.total;
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <h1>題庫搜尋</h1>

          <p className="subtitle">
            輸入關鍵字，搜尋最相關的題目
          </p>

          <SearchBar
            keyword={keyword}
            setKeyword={setKeyword}
            onSearch={handleSearch}
          />
        </div>
      </section>

      {keyword.trim() && (
        <section className="content">
          {searchResults.results.length > 0 ? (
            <>
              <p className="result-count">
                找到 {totalResults} 筆相關題目，
                顯示最相關的 {filteredQuestions.length} 筆
              </p>

              <div className="results">
                {filteredQuestions.map((item, index) => (
                  <QuestionCard
                    key={item.question_number}
                    item={item}
                    rank={index + 1}
                    keyword={debouncedKeyword}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>找不到相關題目</h2>

              <p>
                請嘗試其他關鍵字
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;

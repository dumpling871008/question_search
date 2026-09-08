import { useState} from "react";

import data from "./data/questions.json";
import SearchBar from "./components/SearchBar.jsx";
import QuestionCard from "./components/QuestionCard.jsx";
import searchQuestions from "./utils/searchQuestions";
import "./App.css";

function App() {
  const [keyword,setKeyword] = useState("");

  const results = searchQuestions(data.questions, keyword);

  return (
    <main className="container">
      <div className="search-section">
        <h1>題庫搜尋</h1>
        <p className="subtitle">
          輸入關鍵字，搜尋最相關的三個題目
        </p>

        <SearchBar
          keyword={keyword}
          setKeyword={setKeyword}
        />

        {keyword.trim() && results.length > 0 && (
          <p className="result-count">
            找到 {results.length} 筆相關結果
          </p>
        )}

        {keyword.trim() && results.length === 0 && (
          <p className="empty-message">
            找不到符合「{keyword}」的題目
          </p>
        )}
      </div>

      <section className="results">
        {results.map((item, index) => (
          <QuestionCard
            key={item.question_number}
            item={item}
            rank={index + 1}
            keyword={keyword}
          />
        ))}
      </section>
    </main>
  );
}

export default App;
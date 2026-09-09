# Question Search｜題庫模糊搜尋系統

使用 **React + Vite + Fuse.js** 開發的前端題庫搜尋系統。

使用者可以輸入短關鍵字，或直接貼上完整題目。系統會先擷取有效搜尋詞，再使用 Fuse.js 找出候選題，最後透過自訂 Ranking 根據關鍵詞覆蓋率、欄位權重與模糊匹配結果重新排序，顯示最相關的 Top 3 題目。

## Demo

[開啟 Demo](https://question-search-sigma.vercel.app/)

## Features

### Search

* 關鍵字搜尋
* 完整題目搜尋
* 完整題目的關鍵詞擷取
* Fuse.js fuzzy matching
* 搜尋題目、題組背景與選項
* 自訂 Ranking
* 顯示 Top 3 搜尋結果
* 搜尋關鍵字 Highlight

### UX

* 300ms Debounce 搜尋
* Enter 立即搜尋
* Escape / Clear 清除搜尋
* 無搜尋結果提示
* Responsive UI

## Tech Stack

* React
* Vite
* JavaScript
* Fuse.js
* CSS
* Vercel

## Project Structure

```text
src/
├─ components/
│  ├─ SearchBar.jsx
│  └─ QuestionCard.jsx
├─ data/
│  └─ questions.json
├─ utils/
│  ├─ extractKeywords.js
│  ├─ searchQuestions.js
│  └─ searchQuestions.test.js
└─ App.jsx
```

主要搜尋流程拆分為：

```text
extractKeywords.js
        ↓
searchQuestions.js
        ↓
QuestionCard.jsx
```

分別負責關鍵詞擷取、候選搜尋與 Ranking，以及搜尋結果與 Highlight 顯示。

## Search Design

### Search Flow

```text
短關鍵字 / 完整題目
        ↓
Keyword Extraction
        ↓
Fuse.js Candidate Retrieval
        ↓
Custom Ranking
        ↓
Top 3 Results
        ↓
Highlight
```

### Keyword Extraction

`src/utils/extractKeywords.js` 會先使用 `String.normalize("NFKC")` 正規化輸入，並進行英文小寫化、標點與多餘空白清理，以及移除「下列何者」、「最可能為何者」等常見題型模板。

接著使用：

```javascript
Intl.Segmenter("zh-TW", { granularity: "word" })
```

進行斷詞、過濾 stop words 並去除重複詞。非停用詞的單一中文字（例如「光」「水」）會保留，適用於單字查詢與完整題目；「的」「是」「甲」「圖」等低資訊詞仍會排除。

此階段只負責取得可用搜尋詞，不決定詞的重要性，也沒有針對特定科目 hard-code 搜尋規則。

### Candidate Retrieval

`src/utils/searchQuestions.js` 使用 Fuse.js 對每個關鍵詞分別搜尋：

* `question`
* `context`
* `options.A`
* `options.B`
* `options.C`
* `options.D`

只要任一關鍵詞命中，就會將該題加入候選集合。

Fuse.js 在這個專案中主要負責 **Candidate Retrieval**，而不是直接決定最終排名。

候選題取得後，再交由自訂 Ranking 演算法重新排序。

### Custom Ranking

最終排名主要考量以下因素：

* **Keyword coverage**
  主要排序依據。比較候選題實際命中了多少擷取出的關鍵詞，避免只命中少量詞彙的題目因 fuzzy score 較高而排在前面。

* **Field weight**
  不同欄位具有不同重要程度：

  ```text
  question > context > options
  ```

* **Exact / full-query match**
  當完整輸入與原題相同，或完整輸入直接出現在搜尋欄位中時，給予額外排序權重。

* **Fuzzy score**
  Fuse.js 的 fuzzy matching score 作為次要排序依據，用於區分 coverage 相近的候選題。

Keyword coverage 為最主要排序依據。

若 Ranking 分數相同，則維持原始題庫中的資料順序。

最後最多顯示 Top 3 搜尋結果。

## Why Custom Ranking?

如果直接使用 Fuse.js score 排序，當使用者貼入一整段完整題目時，只命中少量詞彙的題目仍可能因局部 fuzzy similarity 得到較高排名。

因此本專案將搜尋流程拆成：

```text
Keyword Extraction
        ↓
Candidate Retrieval
        ↓
Custom Ranking
```

先從完整輸入中移除低資訊文字並擷取搜尋詞，再由 Fuse.js 找出可能相關的候選題，最後以 **Keyword Coverage** 為主要依據重新排序。

這樣可以讓命中更多題意關鍵詞的題目優先顯示，而不是單純依賴 Fuse.js 原始 score。

## Getting Started

需要先安裝：

* Git
* Node.js
* npm

瀏覽器需支援 `Intl.Segmenter`。

Clone repository：

```powershell
git clone https://github.com/dumpling871008/question_search.git
cd question_search
```

安裝 dependencies：

```powershell
npm ci
```

啟動開發環境：

```powershell
npm run dev
```

開啟終端機顯示的本機網址即可使用。

React 應用程式位於 repository root，以下測試與建置指令也都在 repository root 執行。

## Testing & Build

### Unit Test

```powershell
node --test src/utils/searchQuestions.test.js
```

目前未設定 `npm test` script，測試直接使用 Node.js built-in test runner。

測試內容包含：

* Short keyword search
* Full-question search
* Typo / fuzzy matching
* NFKC normalization
* Keyword coverage
* Field ranking
* Stable ordering
* Top 3 results
* Highlight
* Empty input

### Lint

```powershell
npm run lint
```

### Build

```powershell
npm run build
```

Build 完成後，產物位於：

```text
dist/
```

可使用：

```powershell
npm run preview
```

預覽 production build。


## Deployment

目前專案部署於 Vercel。

設定：

```text
Root Directory: repository root
Build Command: npm run build
Output Directory: dist
```

## Limitations

* 目前屬於 **lexical / fuzzy search**，不是 semantic search，未使用 embeddings 或 cosine similarity。
* 如果兩個題目語意相近，但使用完全不同的詞彙，目前可能無法正確匹配。
* 支援非停用詞的單字搜尋，但單字涵蓋範圍較廣，結果可能較不精準；停用詞仍會被過濾。
* `Intl.Segmenter` 不保證所有專有名詞都能完整斷詞。
* 尚未加入 domain vocabulary 或 synonym expansion。
* 題庫目前以 JSON 載入前端，尚未驗證大型題庫下的搜尋效能。
* 搜尋結果目前最多顯示 Top 3，尚未提供 pagination 或查看全部候選結果。
* 部分原始題目包含圖片或需搭配原教材內容，目前 Demo 主要驗證文字搜尋與 Ranking 流程。

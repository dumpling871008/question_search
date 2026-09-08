# Question Search｜題庫模糊搜尋系統

使用 **React + Vite + Fuse.js** 開發的前端題庫搜尋網站。

使用者輸入關鍵字後，系統會從題目、題組背景與選項中搜尋可能相關的內容，
再根據欄位重要程度與模糊匹配結果進行 Ranking，
最後顯示最相關的 Top 3 題目。

## Demo

Vercel：

https://question-search-sigma.vercel.app/

## Features

- 關鍵字搜尋
- Fuse.js 模糊搜尋
- 題目、題組背景、選項皆可搜尋
- 自訂搜尋 Ranking
- 顯示 Top 3 最相關結果
- 搜尋關鍵字 Highlight
- Debounce 搜尋
- Enter 立即搜尋
- Escape / 清除按鈕
- 無搜尋結果提示
- Responsive UI

## Tech Stack

- React
- Vite
- JavaScript
- Fuse.js
- CSS
- Vercel

## Search Flow

搜尋流程：

```text
User Input
    ↓
Debounce
    ↓
Fuse.js Fuzzy Search
    ↓
Candidate Results
    ↓
Custom Ranking
    ↓
Sort by Relevance Score
    ↓
Top 3 Results
    ↓
Highlight Matching Text
function SearchBar({ keyword, setKeyword, onSearch }) {
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      onSearch?.(keyword);
    }

    if (e.key === "Escape") {
      setKeyword("");
    }
  }

  return (
    <div className="search-box">
      <span className="search-icon">⌕</span>

      <input
        type="text"
        placeholder="搜尋題目或題組內容..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {keyword && (
        <button
          type="button"
          className="clear-button"
          onClick={() => setKeyword("")}
          aria-label="清除搜尋"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBar;
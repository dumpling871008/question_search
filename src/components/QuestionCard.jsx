function QuestionCard({ item, rank, keyword }) {
  function highlightText(text, field) {
    if (!text) {
      return text;
    }

    const value = String(text);

    // 找 Fuse.js 判斷這個欄位匹配到的位置
    const match = item.fuseMatches?.find(
      (match) => match.key === field
    );

    // 如果 Fuse 有提供匹配位置
    if (match?.indices?.length) {
      const result = [];
      let lastIndex = 0;

      match.indices.forEach(([start, end], index) => {
        // 前面沒有匹配到的文字
        if (start > lastIndex) {
          result.push(
            value.slice(lastIndex, start)
          );
        }

        // Fuse 判斷匹配到的文字
        result.push(
          <mark key={`${field}-${index}`}>
            {value.slice(start, end + 1)}
          </mark>
        );

        lastIndex = end + 1;
      });

      // 最後剩餘文字
      if (lastIndex < value.length) {
        result.push(
          value.slice(lastIndex)
        );
      }

      return result;
    }

    // Fuse 沒有 match 時，保留原本精確關鍵字標記
    if (!keyword?.trim()) {
      return value;
    }

    const cleanKeyword = keyword.trim();

    const escapedKeyword = cleanKeyword.replace(
      /[-[\]{}()*+?.,\\^$|#\s]/g,
      "\\$&"
    );

    const parts = value.split(
      new RegExp(`(${escapedKeyword})`, "gi")
    );

    return parts.map((part, index) =>
      part.toLowerCase() === cleanKeyword.toLowerCase() ? (
        <mark key={`exact-${index}`}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <article className="question-card">
      <div className="card-top">
        <span className={`rank rank-${rank}`}>
          TOP {rank}
        </span>

        <span className="question-number">
          題目 {item.question_number}
        </span>
      </div>

      {item.context && (
        <div className="context-box">
          <span className="context-label">
            題組背景
          </span>

          <p>
            {highlightText(item.context, "context")}
          </p>
        </div>
      )}

      <div className="question-content">
        <span className="question-label">
          QUESTION
        </span>

        <h3>
          {highlightText(item.question, "question")}
        </h3>

        {item.options && (
          <div className="options">
            {Object.entries(item.options).map(
              ([key, option]) => (
                <div className="option" key={key}>
                  <span className="option-label">
                    {key}
                  </span>

                  <span>
                    {highlightText(
                      option,
                      `options.${key}`
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default QuestionCard;
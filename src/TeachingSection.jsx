import { X } from 'lucide-react';

const detailNumbers = [2, 3, 4, 5, 6, 7, 8, 9];
const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const tableColors = [
  '#0ea5d8',
  '#263b96',
  '#a20f93',
  '#d80b80',
  '#e91d2e',
  '#f18416',
  '#f2d40b',
  '#82bd39',
  '#079456'
];

function getFormulaText(a, b) {
  return `${a} x ${b} = ${a * b}`;
}

function getMeaningText(a, b) {
  return `${b} 个 ${a} 相加`;
}

function getChineseNumber(number) {
  return chineseNumbers[number - 1];
}

function getProductText(product) {
  if (product < 10) {
    return `得${getChineseNumber(product)}`;
  }

  if (product === 10) {
    return '一十';
  }

  const tens = Math.floor(product / 10);
  const ones = product % 10;
  const tensText = tens === 1 ? '十' : `${getChineseNumber(tens)}十`;

  return ones === 0 ? tensText : `${tensText}${getChineseNumber(ones)}`;
}

function getChineseFormula(a, b) {
  return `${getChineseNumber(a)}${getChineseNumber(b)}${getProductText(a * b)}`;
}

export default function TeachingSection({ onClose }) {
  return (
    <aside className="teaching-panel" aria-labelledby="teaching-title">
      <header className="teaching-header">
        <div>
          <p className="eyebrow">口诀学习</p>
          <h2 id="teaching-title">乘法口诀对照表</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭口诀表">
          <X size={20} />
        </button>
      </header>

      <p className="teaching-intro">看题时先想“几个几相加”，再对照口诀记答案。</p>

      <div className="teaching-tip">
        例子：3 x 4 表示 4 个 3 相加，也就是 3 + 3 + 3 + 3 = 12。
      </div>

      <section className="integrated-chart" aria-labelledby="integrated-title">
        <h3 id="integrated-title">九九乘法整合速记表</h3>
        <div className="integrated-scroll">
          <div className="stair-formula-table">
            {tableNumbers.map((row) => (
              <div className="stair-row" key={row}>
                {tableNumbers.map((column) => {
                  if (column > row) {
                    return <span className="stair-cell stair-cell--empty" key={column} />;
                  }

                  return (
                    <span
                      className="stair-cell"
                      key={column}
                      style={{ background: tableColors[column - 1] }}
                    >
                      {column} x {row} = {column * row}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="stair-number-row">
            {tableNumbers.map((number) => (
              <strong key={number} style={{ color: tableColors[number - 1] }}>
                {number}
              </strong>
            ))}
          </div>

          <div className="stair-chinese-table">
            {tableNumbers.map((row) => (
              <div className="stair-row" key={row}>
                {tableNumbers.map((column) => {
                  if (row < column) {
                    return <span className="stair-cell stair-cell--empty" key={column} />;
                  }

                  return (
                    <span
                      className="stair-cell"
                      key={column}
                      style={{ background: tableColors[column - 1] }}
                    >
                      {getChineseFormula(column, row)}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-chart" aria-labelledby="detail-title">
        <h3 id="detail-title">逐条理解对照</h3>
        <div className="formula-groups">
          {detailNumbers.map((a) => (
            <article className="formula-group" key={a}>
              <h3>{a} 的口诀</h3>
              <div className="formula-list">
                {detailNumbers.map((b) => (
                  <div className="formula-item" key={`${a}-${b}`}>
                    <strong>{getFormulaText(a, b)}</strong>
                    <span>{getMeaningText(a, b)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}

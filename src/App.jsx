import { useState } from 'react';
import { BookOpen, Flame, Swords, X } from 'lucide-react';
import { generateQuestion } from './QuestionGenerator.js';
import { checkAnswer } from './GameEngine.js';
import Monster from './Monster.jsx';
import TeachingSection from './TeachingSection.jsx';
import {
  playAttackSound,
  playMonsterDefeatSound,
  playMonsterHitSound,
  playWrongSound
} from './SoundEngine.js';

const MAX_HP = 12;

function isSameQuestion(first, second) {
  return Boolean(first && second && first.a === second.a && first.b === second.b);
}

function getNextQuestion(wrongQuestions, currentQuestion) {
  const reviewQuestions = wrongQuestions.filter(
    (wrongQuestion) => !isSameQuestion(wrongQuestion, currentQuestion)
  );
  const shouldReview = reviewQuestions.length > 0 && Math.random() < 0.45;

  if (shouldReview) {
    const index = Math.floor(Math.random() * reviewQuestions.length);
    return reviewQuestions[index];
  }

  let next = generateQuestion();
  while (isSameQuestion(next, currentQuestion)) {
    next = generateQuestion();
  }

  return next;
}

export default function App() {
  const [question, setQuestion] = useState(() => generateQuestion());
  const [answerText, setAnswerText] = useState('');
  const [monsterHp, setMonsterHp] = useState(MAX_HP);
  const [message, setMessage] = useState('答对题目就能发射火球');
  const [combo, setCombo] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isDead, setIsDead] = useState(false);
  const [isTeachingOpen, setIsTeachingOpen] = useState(false);
  const [attackKey, setAttackKey] = useState(0);

  function resetFeedback(nextFeedback) {
    setFeedback('');
    setIsDead(false);
    requestAnimationFrame(() => setFeedback(nextFeedback));
  }

  function nextQuestion(nextWrongQuestions = wrongQuestions) {
    setQuestion((currentQuestion) => getNextQuestion(nextWrongQuestions, currentQuestion));
    setAnswerText('');
  }

  function damageMonster(nextHp) {
    if (nextHp <= 0) {
      setMonsterHp(0);
      setIsDead(true);
      setMessage('12 格血清空！怪兽被打败了');
      window.setTimeout(() => {
        setMonsterHp(MAX_HP);
        setIsDead(false);
        nextQuestion(wrongQuestions);
      }, 520);
      return;
    }

    setMonsterHp(nextHp);
  }

  function healMonster() {
    setMonsterHp((hp) => Math.min(MAX_HP, hp + 1));
  }

  function getComboMessage(nextCombo) {
    if (nextCombo >= 3) {
      return '暴击！火球变强了';
    }

    if (nextCombo === 2) {
      return 'x2 连击！';
    }

    return '击中！怪兽少 1 格血';
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (answerText.trim() === '') {
      setMessage('先输入答案再攻击');
      return;
    }

    const isCorrect = checkAnswer(question, answerText);

    if (isCorrect) {
      const nextHp = monsterHp - 1;
      const nextCombo = combo + 1;
      const isCritical = nextCombo >= 3;

      playAttackSound(isCritical);
      if (nextHp <= 0) {
        playMonsterDefeatSound();
      } else {
        playMonsterHitSound();
      }

      setCombo(nextCombo);
      setMessage(getComboMessage(nextCombo));
      setAttackKey((key) => key + 1);
      resetFeedback('correct');
      damageMonster(nextHp);
      if (nextHp > 0) {
        nextQuestion(wrongQuestions);
      }
      return;
    }

    const nextWrongQuestions = [...wrongQuestions, question];
    playWrongSound();
    setCombo(0);
    setWrongQuestions(nextWrongQuestions);
    healMonster();
    setMessage(`答错了，正确答案是 ${question.answer}，怪兽回复 1 格血`);
    resetFeedback('wrong');
    nextQuestion(nextWrongQuestions);
  }

  return (
    <main className="app-shell">
      <div className={`app-layout ${isTeachingOpen ? 'app-layout--teaching-open' : ''}`}>
        <div className={`battle-board ${feedback ? `battle-board--${feedback}` : ''}`}>
          <header className="battle-header">
            <p className="eyebrow">Battle Mode</p>
            <h1>乘法口诀打怪游戏 V3</h1>
            <button
              className="study-toggle"
              type="button"
              onClick={() => setIsTeachingOpen((isOpen) => !isOpen)}
              aria-expanded={isTeachingOpen}
            >
              {isTeachingOpen ? <X size={18} /> : <BookOpen size={18} />}
              {isTeachingOpen ? '收起口诀表' : '打开口诀表'}
            </button>
          </header>

          <div className="status-row">
            <div className="combo-box">
              <span>Combo</span>
              <strong>{combo >= 2 ? `x${combo}` : combo}</strong>
            </div>
            <div className="combo-box">
              <span>错题池</span>
              <strong>{wrongQuestions.length}</strong>
            </div>
          </div>

          <div className="battle-stage">
            {feedback === 'correct' && (
              <div
                className={`fireball ${combo >= 3 ? 'fireball--critical' : ''}`}
                key={attackKey}
                aria-hidden="true"
              >
                <Flame size={34} />
              </div>
            )}
            <Monster hp={monsterHp} maxHp={MAX_HP} mood={feedback} isDead={isDead} />
          </div>

          <form className="question-panel" onSubmit={handleSubmit}>
            <div className="question">
              {question.a} x {question.b} ?
            </div>

            <label className="answer-label" htmlFor="answer">
              输入答案
            </label>
            <div className="answer-row">
              <input
                id="answer"
                type="number"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                autoComplete="off"
                autoFocus
              />
              <button type="submit">
                <Swords size={18} />
                攻击
              </button>
            </div>
          </form>

          <p className="message" role="status">
            {message}
          </p>
        </div>

        {isTeachingOpen && <TeachingSection onClose={() => setIsTeachingOpen(false)} />}
      </div>
    </main>
  );
}

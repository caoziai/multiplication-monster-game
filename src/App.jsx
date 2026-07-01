import { useEffect, useState } from 'react';
import { BookOpen, Flame, Swords, Volume2, VolumeX, X } from 'lucide-react';
import { checkAnswer } from './GameEngine.js';
import Monster from './Monster.jsx';
import TeachingSection from './TeachingSection.jsx';
import { generateQuestion, getAllQuestions } from './QuestionGenerator.js';
import {
  playAttackSound,
  playMonsterDefeatSound,
  playMonsterHitSound,
  playVictoryMusic,
  playWrongSound,
  setBackgroundMusicMood,
  startBackgroundMusic,
  stopBackgroundMusic
} from './SoundEngine.js';

const MAX_HP = 12;
const RECENT_LIMIT = 10;
const PRACTICE_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9];

function getQuestionKey(question) {
  return `${question.a}x${question.b}`;
}

function isSameQuestion(first, second) {
  return Boolean(first && second && first.a === second.a && first.b === second.b);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getNextQuestion({ wrongQuestions, currentQuestion, recentKeys, mode, fixedBase }) {
  const activeBase = mode === 'fixed' ? fixedBase : null;
  const candidates = getAllQuestions(activeBase);
  const recentSet = new Set(recentKeys);
  const freshCandidates = candidates.filter(
    (candidate) => !recentSet.has(getQuestionKey(candidate)) && !isSameQuestion(candidate, currentQuestion)
  );
  const availableCandidates = freshCandidates.length > 0
    ? freshCandidates
    : candidates.filter((candidate) => !isSameQuestion(candidate, currentQuestion));

  const reviewQuestions = wrongQuestions.filter((wrongQuestion) => {
    const matchesMode = !activeBase || wrongQuestion.a === activeBase;
    return (
      matchesMode &&
      !recentSet.has(getQuestionKey(wrongQuestion)) &&
      !isSameQuestion(wrongQuestion, currentQuestion)
    );
  });
  const shouldReview = reviewQuestions.length > 0 && Math.random() < 0.25;

  if (shouldReview) {
    return pickRandom(reviewQuestions);
  }

  return pickRandom(availableCandidates.length > 0 ? availableCandidates : candidates);
}

export default function App() {
  const [mode, setMode] = useState('random');
  const [fixedBase, setFixedBase] = useState(2);
  const [question, setQuestion] = useState(() => generateQuestion());
  const [recentKeys, setRecentKeys] = useState(() => [getQuestionKey(question)]);
  const [answerText, setAnswerText] = useState('');
  const [monsterHp, setMonsterHp] = useState(MAX_HP);
  const [message, setMessage] = useState('答对题目就能发射火球');
  const [combo, setCombo] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isDead, setIsDead] = useState(false);
  const [isTeachingOpen, setIsTeachingOpen] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [attackKey, setAttackKey] = useState(0);

  const musicMood = isDead
    ? 'victory'
    : feedback === 'wrong'
      ? 'warning'
      : monsterHp <= 3
        ? 'danger'
        : combo >= 3
          ? 'combo'
          : mode === 'fixed'
            ? 'focus'
            : 'battle';

  useEffect(() => {
    if (isMusicOn) {
      setBackgroundMusicMood(musicMood);
    }
  }, [isMusicOn, musicMood]);

  useEffect(() => stopBackgroundMusic, []);

  function toggleMusic() {
    if (isMusicOn) {
      stopBackgroundMusic();
      setIsMusicOn(false);
      return;
    }

    startBackgroundMusic(musicMood);
    setIsMusicOn(true);
  }

  function rememberQuestion(nextQuestion) {
    setRecentKeys((keys) => {
      const nextKeys = [...keys, getQuestionKey(nextQuestion)];
      return nextKeys.slice(-RECENT_LIMIT);
    });
  }

  function resetFeedback(nextFeedback) {
    setFeedback('');
    setIsDead(false);
    requestAnimationFrame(() => setFeedback(nextFeedback));
  }

  function nextQuestion(nextWrongQuestions = wrongQuestions, options = {}) {
    const nextMode = options.mode ?? mode;
    const nextFixedBase = options.fixedBase ?? fixedBase;

    setQuestion((currentQuestion) => {
      const pickedQuestion = getNextQuestion({
        wrongQuestions: nextWrongQuestions,
        currentQuestion,
        recentKeys,
        mode: nextMode,
        fixedBase: nextFixedBase
      });
      rememberQuestion(pickedQuestion);
      return pickedQuestion;
    });
    setAnswerText('');
  }

  function switchToRandomMode() {
    setMode('random');
    setRecentKeys([]);
    setMessage('随机练习：题目会尽量避开刚出现过的题');
    nextQuestion(wrongQuestions, { mode: 'random' });
  }

  function switchToFixedMode(base) {
    setMode('fixed');
    setFixedBase(base);
    setRecentKeys([]);
    setMessage(`专项练习：现在只练 ${base} 的乘法`);
    nextQuestion(wrongQuestions, { mode: 'fixed', fixedBase: base });
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
      }, 2200);
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
        playVictoryMusic();
        if (isMusicOn) {
          setBackgroundMusicMood('victory');
        }
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
            <div className="header-actions">
              <button
                className="study-toggle"
                type="button"
                onClick={() => setIsTeachingOpen((isOpen) => !isOpen)}
                aria-expanded={isTeachingOpen}
              >
                {isTeachingOpen ? <X size={18} /> : <BookOpen size={18} />}
                {isTeachingOpen ? '收起口诀表' : '打开口诀表'}
              </button>
              <button className="music-toggle" type="button" onClick={toggleMusic}>
                {isMusicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                {isMusicOn ? '音乐开' : '音乐关'}
              </button>
            </div>
          </header>

          <section className="practice-panel" aria-label="题型切换">
            <div className="practice-panel__top">
              <div>
                <p className="practice-title">题型切换</p>
                <p className="practice-note">
                  {mode === 'random'
                    ? '随机练习：系统会避开最近出现过的题'
                    : `专项练习：当前只出 ${fixedBase} 的乘法题`}
                </p>
              </div>
              <button
                className={`mode-button ${mode === 'random' ? 'mode-button--active' : ''}`}
                type="button"
                onClick={switchToRandomMode}
              >
                随机练习
              </button>
            </div>
            <div className="series-buttons">
              {PRACTICE_NUMBERS.map((number) => (
                <button
                  className={`series-button ${
                    mode === 'fixed' && fixedBase === number ? 'series-button--active' : ''
                  }`}
                  type="button"
                  key={number}
                  onClick={() => switchToFixedMode(number)}
                >
                  {number} 的
                </button>
              ))}
            </div>
          </section>

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

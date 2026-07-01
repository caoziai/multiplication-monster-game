import monsterNormal from './assets/monster-normal.png';
import monsterHit from './assets/monster-hit.png';
import monsterSmirk from './assets/monster-smirk.png';
import monsterDead from './assets/monster-dead.png';

function getMoodClass(mood, isDead) {
  if (isDead) {
    return 'monster-card--dead';
  }

  if (mood === 'correct') {
    return 'monster-card--hit';
  }

  if (mood === 'wrong') {
    return 'monster-card--smirk';
  }

  return '';
}

function getMonsterImage(mood, isDead) {
  if (isDead) {
    return monsterDead;
  }

  if (mood === 'correct') {
    return monsterHit;
  }

  if (mood === 'wrong') {
    return monsterSmirk;
  }

  return monsterNormal;
}

export default function Monster({ hp, maxHp, mood, isDead }) {
  const isDefeated = isDead || hp <= 0;
  const monsterImage = getMonsterImage(mood, isDefeated);
  const cells = Array.from({ length: maxHp }, (_, index) => index < hp);

  return (
    <section className={`monster-card ${getMoodClass(mood, isDefeated)}`}>
      <div className="monster-scene">
        <div className="monster-shadow" />
        <img className="monster-image" src={monsterImage} alt="乘法怪兽" />
      </div>

      <div className="hp-panel">
        <div className="hp-panel__top">
          <span>怪兽 HP</span>
          <strong>
            {hp} / {maxHp}
          </strong>
        </div>
        <div className="hp-grid" aria-label={`怪兽血量 ${hp} / ${maxHp}`}>
          {cells.map((isFilled, index) => (
            <span
              className={`hp-cell ${isFilled ? 'hp-cell--filled' : ''}`}
              key={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

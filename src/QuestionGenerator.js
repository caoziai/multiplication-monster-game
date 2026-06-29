function randomNumber() {
  return Math.floor(Math.random() * 8) + 2;
}

export function createQuestion(a, b) {
  return {
    a,
    b,
    answer: a * b
  };
}

export function generateQuestion(fixedBase = null) {
  const a = fixedBase ?? randomNumber();
  const b = randomNumber();

  return createQuestion(a, b);
}

export function getAllQuestions(fixedBase = null) {
  const numbers = [2, 3, 4, 5, 6, 7, 8, 9];

  if (fixedBase) {
    return numbers.map((b) => createQuestion(fixedBase, b));
  }

  return numbers.flatMap((a) => numbers.map((b) => createQuestion(a, b)));
}

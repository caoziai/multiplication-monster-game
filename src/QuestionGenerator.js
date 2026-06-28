function randomNumber() {
  return Math.floor(Math.random() * 8) + 2;
}

export function generateQuestion() {
  const a = randomNumber();
  const b = randomNumber();

  return {
    a,
    b,
    answer: a * b
  };
}

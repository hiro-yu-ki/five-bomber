export const DEFAULT_QUESTIONS = Object.freeze([
  { prompt: '日本の都道府県を1つ答えよ', answer: '例：東京都、大阪府、北海道' },
  { prompt: '「あ」から始まる国名を1つ答えよ', answer: '例：アメリカ、アルゼンチン' },
  { prompt: '太陽系の惑星を1つ答えよ', answer: '例：地球、火星、木星' },
  { prompt: '日本の祝日を1つ答えよ', answer: '例：元日、文化の日' },
  { prompt: '漢字1文字の駅名を1つ答えよ', answer: '例：津、柏、蕨' },
  { prompt: 'オリンピック競技を1つ答えよ', answer: '例：柔道、陸上競技' },
  { prompt: '四字熟語を1つ答えよ', answer: '例：一期一会、温故知新' },
  { prompt: '海に面していない県を1つ答えよ', answer: '例：長野県、奈良県' },
  { prompt: '春の季語を1つ答えよ', answer: '例：桜、つくし' },
  { prompt: '英語で5文字の動物を1つ答えよ', answer: '例：TIGER、HORSE' },
  { prompt: '世界遺産を1つ答えよ', answer: '例：姫路城、屋久島' },
  { prompt: '日本の昔話を1つ答えよ', answer: '例：桃太郎、浦島太郎' }
]);

export function parseQuestions(text) {
  const questions = String(text).split(/\r?\n/).map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const separator = trimmed.indexOf('|');
    if (separator < 1 || separator === trimmed.length - 1) throw new Error(`${index + 1}行目は「問題|答え」の形式にしてください`);
    return { prompt: trimmed.slice(0, separator).trim(), answer: trimmed.slice(separator + 1).trim() };
  }).filter(Boolean);
  if (questions.length === 0) throw new Error('問題を1問以上入力してください');
  return questions;
}

export function formatQuestions(questions) { return questions.map(({ prompt, answer }) => `${prompt}|${answer}`).join('\n'); }

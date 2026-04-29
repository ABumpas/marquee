const CATEGORY_EMOJIS = ['🟨', '🟪', '🟧', '🟦'];

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function shareGrid(gridResults) {
  const score = gridResults.flat().filter(Boolean).length;
  const label = `The Grid: ${score}/9`;
  const grid = gridResults
    .map(row => row.map(cell => (cell ? '🟩' : '⬜')).join(''))
    .join('\n');
  return `${label}\n${grid}`;
}

export function shareChain(chainLength) {
  const label = `Movie Chain: ${chainLength} link${chainLength === 1 ? '' : 's'}`;
  const chain = '🟩' + '⛓️'.repeat(chainLength) + '🟩';
  return `${label}\n${chain}`;
}

export function shareCrosscut(tileResults) {
  const flat = tileResults.flat();
  const solvedCategories = [0, 1, 2, 3].filter(
    cat => flat.filter(cell => cell === cat).length === 4
  ).length;
  const label = `Crosscut: ${solvedCategories}/4`;
  const grid = tileResults
    .map(row =>
      row.map(cell => (cell === null ? '⬜' : CATEGORY_EMOJIS[cell])).join('')
    )
    .join('\n');
  return `${label}\n${grid}`;
}

export function shareAll(gridResults, chainLength, tileResults, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const text = [
    `Marquee \u2014 ${formatDate(d)}`,
    '',
    shareGrid(gridResults),
    '',
    shareChain(chainLength),
    '',
    shareCrosscut(tileResults),
    '',
    'marquee.app',
  ].join('\n');

  if (typeof navigator !== 'undefined') {
    if (navigator.share) {
      navigator.share({ text }).catch(() => navigator.clipboard?.writeText(text));
    } else {
      navigator.clipboard?.writeText(text);
    }
  }

  return text;
}

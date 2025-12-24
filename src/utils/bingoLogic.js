// src/utils/bingoLogic.js

export const generateCard = () => {
  const card = { B: [], I: [], N: [], G: [], O: [] };
  const ranges = {
    B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75]
  };

  for (const [letter, range] of Object.entries(ranges)) {
    const numbers = new Set();
    while (numbers.size < 5) {
      const num = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
      numbers.add(num);
    }
    card[letter] = Array.from(numbers);
  }
  card.N[2] = 'FREE'; 
  return card;
};

export const checkPatterns = (card, drawnNumbers) => {
  const patterns = [];
  const cols = ['B', 'I', 'N', 'G', 'O'];
  
  // Converter para Matriz 5x5 booleana (true se marcado)
  const grid = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      const val = card[cols[c]][r];
      // FREE conta como marcado
      const isMarked = val === 'FREE' || drawnNumbers.includes(val);
      row.push(isMarked);
    }
    grid.push(row);
  }

  // 1. Horizontal
  const hasHorizontal = grid.some(row => row.every(cell => cell === true));
  if (hasHorizontal) patterns.push('horizontal');

  // 2. Diagonal
  const diag1 = [0,1,2,3,4].every(i => grid[i][i] === true);
  const diag2 = [0,1,2,3,4].every(i => grid[i][4-i] === true);
  if (diag1 || diag2) patterns.push('diagonal');

  // 3. Cartela Cheia (Full)
  const allMarked = grid.every(row => row.every(cell => cell === true));
  if (allMarked) patterns.push('full');

  return patterns;
};
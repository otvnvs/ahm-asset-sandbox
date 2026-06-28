const STORAGE_KEY = 'mobile_spreadsheet_data';

export const createEmptyGrid = (rows, cols) => Array.from({ length: rows }, () => Array(cols).fill(''));

export const saveGridData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
};

export const loadGridData = (rows, cols) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === rows) return parsed;
    }
  } catch (e) { console.error(e); }
  return createEmptyGrid(rows, cols);
};

export const clearStorage = () => localStorage.removeItem(STORAGE_KEY);

/**
 * Formats a given evaluated value to 2 decimal places if it's a floating-point number.
 */
export const formatNumber = (value) => {
  if (typeof value === 'number') {
    // Check if the number has decimals, if so format it cleanly
    return value % 1 !== 0 ? value.toFixed(2) : value.toString();
  }
  return value;
};

const parseCellCoords = (cellStr) => {
  const match = cellStr.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  let col = 0;
  const colStr = match[1];
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return [parseInt(match[2], 10) - 1, col - 1];
};

const getCellValue = (grid, row, col) => {
  if (!grid[row] || grid[row][col] === undefined) return 0;
  const val = grid[row][col];
  if (typeof val === 'string' && val.startsWith('=')) return 0; 
  const num = Number(val);
  return isNaN(num) ? val : num;
};

const getRangeValues = (rangeStr, grid) => {
  const [startCell, endCell] = rangeStr.split(':');
  const start = parseCellCoords(startCell);
  const end = parseCellCoords(endCell || startCell);
  if (!start || !end) return null;

  const values = [];
  for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
    for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
      const val = getCellValue(grid, r, c);
      if (typeof val === 'number') values.push(val);
    }
  }
  return values;
};

export const evaluateCell = (rawValue, grid) => {
  if (!rawValue || typeof rawValue !== 'string' || !rawValue.startsWith('=')) {
    const num = Number(rawValue);
    return isNaN(num) || rawValue.trim() === '' ? rawValue : num;
  }

  try {
    const formula = rawValue.substring(1).toUpperCase().trim();

    const funcMatch = formula.match(/^(SUM|AVERAGE|MIN|MAX)\((.+)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const numbers = getRangeValues(funcMatch[2], grid);
      if (!numbers) return '#REF!';
      if (numbers.length === 0) return 0;

      if (funcName === 'SUM') return numbers.reduce((a, b) => a + b, 0);
      if (funcName === 'AVERAGE') return numbers.reduce((a, b) => a + b, 0) / numbers.length;
      if (funcName === 'MIN') return Math.min(...numbers);
      if (funcName === 'MAX') return Math.max(...numbers);
    }

    let expression = formula;
    const cellRegex = /[A-Z]+\d+/g;
    let match;
    const cellsToReplace = [];
    while ((match = cellRegex.exec(formula)) !== null) { cellsToReplace.push(match); }
    
    cellsToReplace.reverse().forEach(matchItem => {
      const cellStr = matchItem[0];
      const coords = parseCellCoords(cellStr);
      if (coords) {
        const value = getCellValue(grid, coords[0], coords[1]);
        expression = expression.replace(cellStr, typeof value === 'number' ? value : `"${value}"`);
      }
    });

    if (/^[0-9+\-*/().\s"']*$/.test(expression)) {
      const result = new Function(`return (${expression})`)();
      return result === undefined ? '' : result;
    }
    return '#VALUE!';
  } catch (e) {
    return '#ERROR!';
  }
};

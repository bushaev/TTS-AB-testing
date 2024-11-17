interface ChiSquareResult {
  chiSquareValue: number;
  pValue: number;
  degreesOfFreedom: number;
  isSignificant: boolean;
}

// Gamma function approximation for p-value calculation
const gamma = (z: number): number => {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  let x = 0.99999999999980993;
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Incomplete gamma function for p-value calculation
const regularizedGammaIncomplete = (s: number, x: number): number => {
  if (x <= 0) {
    return 0;
  }
  
  const accuracy = 1e-10;
  const maxIterations = 100;
  let sum = 1;
  let term = 1;
  
  for (let i = 0; i < maxIterations; i++) {
    term *= x / (s + i);
    sum += term;
    if (Math.abs(term) < accuracy) break;
  }
  
  return sum * Math.exp(-x) * Math.pow(x, s) / gamma(s);
}

const calculateChiSquarePValue = (chiSquare: number, df: number): number => {
  return 1 - regularizedGammaIncomplete(df / 2, chiSquare / 2);
};

const calculateChiSquare = (observed: number[]): ChiSquareResult => {
  // Validate input
  if (observed.length < 2) {
    throw new Error('At least two categories are required for chi-square test');
  }
  
  if (observed.some(val => val < 0)) {
    throw new Error('Observed frequencies cannot be negative');
  }
  
  const total = observed.reduce((sum, val) => sum + val, 0);
  const expected = observed.map(() => total / observed.length);
  
  // Check for expected frequencies < 5
  if (expected.some(exp => exp < 5)) {
    console.warn('Warning: Chi-square test may be invalid - some expected frequencies are less than 5');
  }
  
  // Calculate chi-square statistic
  const chiSquareValue = observed.reduce((sum, obs, i) => {
    const exp = expected[i];
    return sum + Math.pow(obs - exp, 2) / exp;
  }, 0);
  
  const degreesOfFreedom = observed.length - 1;
  const pValue = calculateChiSquarePValue(chiSquareValue, degreesOfFreedom);
  
  return {
    chiSquareValue,
    pValue,
    degreesOfFreedom,
    isSignificant: pValue < 0.05
  };
};

export { calculateChiSquare };
export type { ChiSquareResult }; 
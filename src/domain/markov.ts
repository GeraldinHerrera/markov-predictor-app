/**
 * Markov Academic Predictor - Dominio Matemático Puro
 * 
 * Implementación desacoplada y formal de Cadenas de Markov a Tiempo Discreto (DTMC).
 * Este módulo contiene lógica pura de álgebra lineal y validación estocástica,
 * libre de dependencias de React o del DOM.
 */

export const EPSILON = 1e-6;

export interface MarkovState {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
}

export type ProbabilityVector = readonly number[];
export type MutableProbabilityVector = number[];
export type TransitionMatrix = readonly (readonly number[])[];
export type MutableTransitionMatrix = number[][];

export type ValidationErrorCode =
  | 'EMPTY_MATRIX'
  | 'NOT_SQUARE'
  | 'MIN_DIMENSION'
  | 'PROBABILITY_OUT_OF_BOUNDS'
  | 'ROW_SUM_INVALID'
  | 'INITIAL_VECTOR_DIMENSION_MISMATCH'
  | 'INITIAL_VECTOR_SUM_INVALID';

export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
  readonly row?: number;
  readonly col?: number;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

export interface StepPrediction {
  readonly step: number;
  readonly probabilities: readonly number[];
  readonly sum: number;
}

export interface PredictionResult {
  readonly steps: readonly StepPrediction[];
  readonly isStationaryReached: boolean;
  readonly stationaryStep?: number;
}

export interface PresetDefinition {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly states: readonly MarkovState[];
  readonly defaultInitialState: ProbabilityVector;
  readonly defaultTransitionMatrix: TransitionMatrix;
}

/**
 * Preset predeterminado para el modelado de Rendimiento Académico Estudiantil (3x3).
 */
export const ACADEMIC_PRESET: PresetDefinition = {
  id: 'academic',
  title: 'Rendimiento Académico (3x3)',
  category: 'Educación',
  description: 'Trayectoria y probabilidad de retención, avance regular o rezago estudiantil.',
  states: [
    {
      id: 'high',
      name: 'Alto Rendimiento',
      description: 'Estudiantes sobresalientes con materias al día y alto promedio',
      color: '#10B981', // Verde esmeralda
    },
    {
      id: 'regular',
      name: 'Rendimiento Regular',
      description: 'Estudiantes con avance curricular estándar y riesgo moderado',
      color: '#F59E0B', // Ámbar
    },
    {
      id: 'risk',
      name: 'En Riesgo',
      description: 'Estudiantes en rezago, materias reprobadas o alerta de deserción',
      color: '#EF4444', // Carmesí
    },
  ],
  defaultInitialState: [0.50, 0.30, 0.20],
  defaultTransitionMatrix: [
    [0.70, 0.25, 0.05],
    [0.20, 0.60, 0.20],
    [0.10, 0.30, 0.60],
  ],
};

/**
 * Preset de Clima Meteorológico (3x3).
 */
export const WEATHER_PRESET: PresetDefinition = {
  id: 'weather',
  title: 'Clima Meteorológico (3x3)',
  category: 'Meteorología',
  description: 'Transición atmosférica entre estados de tiempo diario.',
  states: [
    { id: 'sunny', name: 'Soleado', description: 'Día despejado con alta radiación', color: '#FBBF24' },
    { id: 'cloudy', name: 'Nublado', description: 'Cielo cubierto con nubosidad moderada', color: '#94A3B8' },
    { id: 'rainy', name: 'Lluvioso', description: 'Precipitaciones intensas o tormentas', color: '#38BDF8' },
  ],
  defaultInitialState: [0.60, 0.25, 0.15],
  defaultTransitionMatrix: [
    [0.70, 0.20, 0.10],
    [0.30, 0.40, 0.30],
    [0.20, 0.45, 0.35],
  ],
};

/**
 * Preset de Tráfico Urbano (4x4).
 */
export const TRAFFIC_PRESET: PresetDefinition = {
  id: 'traffic',
  title: 'Tráfico Urbano (4x4)',
  category: 'Transporte y Movilidad',
  description: 'Niveles de congestión vehicular en arterias viales principales.',
  states: [
    { id: 'free', name: 'Fluido', description: 'Velocidad óptima sin detenciones', color: '#34D399' },
    { id: 'moderate', name: 'Moderado', description: 'Flujo continuo a velocidad reducida', color: '#60A5FA' },
    { id: 'congested', name: 'Congestionado', description: 'Detenciones intermitentes y demoras', color: '#FB923C' },
    { id: 'gridlock', name: 'Paralizado', description: 'Colapso vial o embotellamiento severo', color: '#F43F5E' },
  ],
  defaultInitialState: [0.40, 0.30, 0.20, 0.10],
  defaultTransitionMatrix: [
    [0.60, 0.25, 0.10, 0.05],
    [0.20, 0.50, 0.20, 0.10],
    [0.05, 0.25, 0.50, 0.20],
    [0.05, 0.10, 0.35, 0.50],
  ],
};

export const AVAILABLE_PRESETS: readonly PresetDefinition[] = [
  ACADEMIC_PRESET,
  WEATHER_PRESET,
  TRAFFIC_PRESET,
];

/**
 * Valida que una matriz de transición cumpla con las propiedades estocásticas por filas:
 * 1. No vacía.
 * 2. Cuadrada de dimensión mínima 3x3.
 * 3. Todos los elementos pertenezcan al intervalo cerrado [0, 1].
 * 4. La suma de cada fila sea exactamente 1.0 (con tolerancia de punto flotante EPSILON).
 */
export function validateTransitionMatrix(
  matrix: TransitionMatrix,
  tolerance: number = EPSILON
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!matrix || matrix.length === 0) {
    return {
      isValid: false,
      errors: [
        {
          code: 'EMPTY_MATRIX',
          message: 'La matriz de transición no puede estar vacía.',
        },
      ],
    };
  }

  const numRows = matrix.length;
  if (numRows < 3) {
    errors.push({
      code: 'MIN_DIMENSION',
      message: `La matriz debe tener al menos dimensión 3x3 (actual: ${numRows} filas).`,
    });
  }

  let isSquare = true;
  for (let i = 0; i < numRows; i++) {
    const row = matrix[i];
    if (!row || row.length !== numRows) {
      isSquare = false;
      errors.push({
        code: 'NOT_SQUARE',
        row: i,
        message: `La fila ${i + 1} tiene ${row ? row.length : 0} columnas, pero se esperaban ${numRows}.`,
      });
    }
  }

  // Si no es cuadrada, evitamos validaciones de celda que dependan de columnas cuadradas
  if (!isSquare) {
    return { isValid: false, errors };
  }

  for (let i = 0; i < numRows; i++) {
    const row = matrix[i]!;
    let rowSum = 0;

    for (let j = 0; j < numRows; j++) {
      const val = row[j]!;

      if (isNaN(val) || val < 0 || val > 1) {
        errors.push({
          code: 'PROBABILITY_OUT_OF_BOUNDS',
          row: i,
          col: j,
          message: `La celda (${i + 1}, ${j + 1}) contiene un valor fuera de [0, 1]: ${val}`,
        });
      }

      rowSum += val;
    }

    if (Math.abs(rowSum - 1.0) > tolerance) {
      errors.push({
        code: 'ROW_SUM_INVALID',
        row: i,
        message: `La fila ${i + 1} suma ${rowSum.toFixed(6)}, pero debe sumar exactamente 1.0 (diferencia: ${(rowSum - 1.0).toFixed(6)})`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida un vector de estado inicial:
 * 1. Dimensión coincidente con el número esperado de estados.
 * 2. Valores en [0, 1].
 * 3. Suma total unitaria dentro de la tolerancia EPSILON.
 */
export function validateInitialState(
  vector: ProbabilityVector,
  expectedDimension: number,
  tolerance: number = EPSILON
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!vector || vector.length !== expectedDimension) {
    return {
      isValid: false,
      errors: [
        {
          code: 'INITIAL_VECTOR_DIMENSION_MISMATCH',
          message: `El vector inicial debe tener ${expectedDimension} elementos (actual: ${vector ? vector.length : 0}).`,
        },
      ],
    };
  }

  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    const val = vector[i]!;
    if (isNaN(val) || val < 0 || val > 1) {
      errors.push({
        code: 'PROBABILITY_OUT_OF_BOUNDS',
        col: i,
        message: `El elemento ${i + 1} del vector inicial contiene un valor fuera de [0, 1]: ${val}`,
      });
    }
    sum += val;
  }

  if (Math.abs(sum - 1.0) > tolerance) {
    errors.push({
      code: 'INITIAL_VECTOR_SUM_INVALID',
      message: `El vector inicial suma ${sum.toFixed(6)}, pero debe sumar exactamente 1.0 (diferencia: ${(sum - 1.0).toFixed(6)})`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normaliza las filas de una matriz de transición para que sumen exactamente 1.0.
 * Si una fila suma 0 o no tiene elementos válidos, divide equitativamente 1/N.
 */
export function normalizeMatrixRows(matrix: TransitionMatrix): MutableTransitionMatrix {
  const n = matrix.length;
  return matrix.map((row) => {
    const sanitizedRow = row.map((val) => (isNaN(val) || val < 0 ? 0 : val));
    const rowSum = sanitizedRow.reduce((acc, curr) => acc + curr, 0);

    if (rowSum <= 0) {
      const equalShare = Number((1 / n).toFixed(6));
      const normalized = new Array(n).fill(equalShare);
      // Ajustar último elemento para suma exacta 1.0
      const currentSum = equalShare * n;
      normalized[n - 1] = Number((equalShare + (1.0 - currentSum)).toFixed(6));
      return normalized;
    }

    // Normalizar proporcionalmente y redondear a 4 decimales
    const rawNormalized = sanitizedRow.map((v) => v / rowSum);
    const rounded = rawNormalized.map((v) => Number(v.toFixed(4)));
    const roundSum = rounded.reduce((a, b) => a + b, 0);
    const diff = Number((1.0 - roundSum).toFixed(4));
    rounded[n - 1] = Number((rounded[n - 1]! + diff).toFixed(4));
    return rounded;
  });
}

/**
 * Normaliza un vector de estado inicial para que sume 1.0.
 */
export function normalizeVector(vector: ProbabilityVector): MutableProbabilityVector {
  const n = vector.length;
  const sanitized = vector.map((val) => (isNaN(val) || val < 0 ? 0 : val));
  const sum = sanitized.reduce((acc, curr) => acc + curr, 0);

  if (sum <= 0) {
    const equalShare = Number((1 / n).toFixed(4));
    const normalized = new Array(n).fill(equalShare);
    const currentSum = equalShare * n;
    normalized[n - 1] = Number((equalShare + (1.0 - currentSum)).toFixed(4));
    return normalized;
  }

  const rounded = sanitized.map((v) => Number((v / sum).toFixed(4)));
  const roundSum = rounded.reduce((a, b) => a + b, 0);
  const diff = Number((1.0 - roundSum).toFixed(4));
  rounded[n - 1] = Number((rounded[n - 1]! + diff).toFixed(4));
  return rounded;
}

/**
 * Multiplica dos matrices cuadradas determinísticamente (A x B).
 */
export function multiplyMatrices(
  a: TransitionMatrix,
  b: TransitionMatrix
): MutableTransitionMatrix {
  const n = a.length;
  const result: MutableTransitionMatrix = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    const rowA = a[i]!;
    for (let k = 0; k < n; k++) {
      const aVal = rowA[k]!;
      const rowB = b[k]!;
      for (let j = 0; j < n; j++) {
        result[i]![j]! += aVal * rowB[j]!;
      }
    }
  }

  return result;
}

/**
 * Calcula la potencia entera n de una matriz cuadrada de transición P^n.
 */
export function matrixPower(
  matrix: TransitionMatrix,
  exponent: number
): MutableTransitionMatrix {
  if (exponent < 0 || !Number.isInteger(exponent)) {
    throw new Error(`El exponente debe ser un entero no negativo. Recibido: ${exponent}`);
  }

  const n = matrix.length;

  if (exponent === 0) {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
  }

  if (exponent === 1) {
    return matrix.map((row) => [...row]);
  }

  let base: MutableTransitionMatrix = matrix.map((row) => [...row]);
  let result: MutableTransitionMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  let exp = exponent;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = multiplyMatrices(result, base);
    }
    exp = Math.floor(exp / 2);
    if (exp > 0) {
      base = multiplyMatrices(base, base);
    }
  }

  return result;
}

/**
 * Multiplica un vector de probabilidad fila por una matriz de transición: pi * P.
 */
export function multiplyMatrixVector(
  vector: ProbabilityVector,
  matrix: TransitionMatrix
): MutableProbabilityVector {
  const dim = vector.length;
  if (matrix.length !== dim) {
    throw new Error(
      `Discrepancia de dimensiones: vector de tamaño ${dim} y matriz con ${matrix.length} filas.`
    );
  }

  const result: MutableProbabilityVector = new Array<number>(dim).fill(0);

  for (let j = 0; j < dim; j++) {
    let sum = 0;
    for (let i = 0; i < dim; i++) {
      sum += vector[i]! * matrix[i]![j]!;
    }
    result[j] = sum;
  }

  return result;
}

/**
 * Calcula la predicción de distribución de estados para los pasos especificados.
 */
export function predictSteps(
  initialState: ProbabilityVector,
  matrix: TransitionMatrix,
  steps: readonly number[] = [1, 3, 5, 10],
  convergenceTolerance: number = 1e-4
): PredictionResult {
  const validation = validateTransitionMatrix(matrix);
  if (!validation.isValid) {
    throw new Error(
      `No se puede predecir con una matriz de transición inválida: ${validation.errors[0]?.message}`
    );
  }

  const stateValidation = validateInitialState(initialState, matrix.length);
  if (!stateValidation.isValid) {
    throw new Error(
      `No se puede predecir con un vector inicial inválido: ${stateValidation.errors[0]?.message}`
    );
  }

  const sortedSteps = [...new Set(steps)].filter((s) => s >= 0).sort((a, b) => a - b);

  const stepPredictions: StepPrediction[] = [];
  let previousProbs: ProbabilityVector | null = null;
  let stationaryStep: number | undefined;
  let isStationaryReached = false;

  for (const step of sortedSteps) {
    let probs: ProbabilityVector;

    if (step === 0) {
      probs = [...initialState];
    } else {
      const pPowN = matrixPower(matrix, step);
      probs = multiplyMatrixVector(initialState, pPowN);
    }

    const sum = probs.reduce((acc, val) => acc + val, 0);

    if (previousProbs && !isStationaryReached) {
      const maxDiff = Math.max(...probs.map((p, idx) => Math.abs(p - previousProbs![idx]!)));
      if (maxDiff < convergenceTolerance) {
        isStationaryReached = true;
        stationaryStep = step;
      }
    }

    previousProbs = probs;

    stepPredictions.push({
      step,
      probabilities: probs,
      sum,
    });
  }

  return {
    steps: stepPredictions,
    isStationaryReached,
    stationaryStep,
  };
}

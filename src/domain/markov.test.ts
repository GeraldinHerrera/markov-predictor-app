import { describe, it, expect } from 'vitest';
import {
  validateTransitionMatrix,
  validateInitialState,
  matrixPower,
  multiplyMatrixVector,
  predictSteps,
  ACADEMIC_PRESET,
  EPSILON,
  type TransitionMatrix,
  type ProbabilityVector,
} from './markov';

describe('Markov Domain Model & Engine (OpenSpec SPEC-MARKOV-001)', () => {
  describe('Regla 1: Integridad y Validación de la Matriz Estocástica', () => {
    it('Escenario 1.1: Valida exitosamente la matriz estocástica académica 3x3 por defecto', () => {
      // Given
      const matrix = ACADEMIC_PRESET.defaultTransitionMatrix;

      // When
      const result = validateTransitionMatrix(matrix);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('Escenario 1.1b: Valida exitosamente una matriz estocástica válida de dimensión 4x4', () => {
      // Given
      const matrix4x4: TransitionMatrix = [
        [0.40, 0.30, 0.20, 0.10],
        [0.10, 0.50, 0.20, 0.20],
        [0.25, 0.25, 0.25, 0.25],
        [0.00, 0.10, 0.40, 0.50],
      ];

      // When
      const result = validateTransitionMatrix(matrix4x4);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('Escenario 1.2: Rechaza cuando una fila no suma 1.0 (fuera de tolerancia 1e-6) con mensaje claro', () => {
      // Given: Fila 1 suma 0.90 en vez de 1.00
      const invalidMatrix: TransitionMatrix = [
        [0.70, 0.25, 0.05],
        [0.20, 0.50, 0.20], // Suma 0.90
        [0.10, 0.30, 0.60],
      ];

      // When
      const result = validateTransitionMatrix(invalidMatrix);

      // Then
      expect(result.isValid).toBe(false);
      const rowSumError = result.errors.find((e) => e.code === 'ROW_SUM_INVALID');
      expect(rowSumError).toBeDefined();
      expect(rowSumError?.row).toBe(1);
      expect(rowSumError?.message).toContain('La fila 2 suma 0.900000, pero debe sumar exactamente 1.0');
    });

    it('Escenario 1.3: Rechaza cuando una celda contiene probabilidades negativas o superiores a 1.0', () => {
      // Given: Fila 0 con un valor negativo -0.05
      const invalidProbMatrix: TransitionMatrix = [
        [1.00, -0.05, 0.05],
        [0.20, 0.60, 0.20],
        [0.10, 0.30, 0.60],
      ];

      // When
      const result = validateTransitionMatrix(invalidProbMatrix);

      // Then
      expect(result.isValid).toBe(false);
      const probError = result.errors.find((e) => e.code === 'PROBABILITY_OUT_OF_BOUNDS');
      expect(probError).toBeDefined();
      expect(probError?.row).toBe(0);
      expect(probError?.col).toBe(1);
      expect(probError?.message).toContain('fuera de [0, 1]: -0.05');
    });

    it('Escenario 1.4: Tolera variaciones infinitesimales de punto flotante dentro de EPSILON (1e-6)', () => {
      // Given
      const floatMatrix: TransitionMatrix = [
        [1 / 3, 1 / 3, 1 / 3],
        [0.5, 0.25, 0.25],
        [0.1, 0.3, 0.6],
      ];

      // When
      const result = validateTransitionMatrix(floatMatrix, EPSILON);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('Rechaza matrices con dimensión menor a 3x3 o no cuadradas', () => {
      const smallMatrix: TransitionMatrix = [
        [0.5, 0.5],
        [0.5, 0.5],
      ];
      const resultSmall = validateTransitionMatrix(smallMatrix);
      expect(resultSmall.isValid).toBe(false);
      expect(resultSmall.errors.some((e) => e.code === 'MIN_DIMENSION')).toBe(true);

      const nonSquareMatrix: TransitionMatrix = [
        [0.5, 0.3, 0.2],
        [0.2, 0.8],
        [0.1, 0.3, 0.6],
      ];
      const resultNonSquare = validateTransitionMatrix(nonSquareMatrix);
      expect(resultNonSquare.isValid).toBe(false);
      expect(resultNonSquare.errors.some((e) => e.code === 'NOT_SQUARE')).toBe(true);
    });
  });

  describe('Regla 2: Integridad y Validación del Vector Inicial (pi_0)', () => {
    it('Valida exitosamente un vector de probabilidad inicial unitario', () => {
      const pi0 = ACADEMIC_PRESET.defaultInitialState;
      const result = validateInitialState(pi0, 3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('Rechaza cuando el vector inicial no suma 1.0', () => {
      const invalidPi0: ProbabilityVector = [0.60, 0.30, 0.30]; // Suma 1.20
      const result = validateInitialState(invalidPi0, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INITIAL_VECTOR_SUM_INVALID')).toBe(true);
    });

    it('Rechaza discrepancia en dimensión del vector inicial', () => {
      const invalidDimPi0: ProbabilityVector = [0.50, 0.50];
      const result = validateInitialState(invalidDimPi0, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INITIAL_VECTOR_DIMENSION_MISMATCH')).toBe(true);
    });
  });

  describe('Regla 3: Precisión de Cálculo de Distribución de Estados (pi_n = pi_0 * P^n)', () => {
    const P = ACADEMIC_PRESET.defaultTransitionMatrix;
    const pi0 = ACADEMIC_PRESET.defaultInitialState;

    it('Escenario 3.1: Calcula con exactitud la distribución para n = 1 paso', () => {
      // Given: pi0 = [0.50, 0.30, 0.20], P de ACADEMIC_PRESET
      // pi_1(S1) = 0.5*0.7 + 0.3*0.2 + 0.2*0.1 = 0.35 + 0.06 + 0.02 = 0.430000
      // pi_1(S2) = 0.5*0.25 + 0.3*0.6 + 0.2*0.3 = 0.125 + 0.18 + 0.06 = 0.365000
      // pi_1(S3) = 0.5*0.05 + 0.3*0.2 + 0.2*0.6 = 0.025 + 0.06 + 0.12 = 0.205000

      // When
      const result = predictSteps(pi0, P, [1]);

      // Then
      expect(result.steps).toHaveLength(1);
      const step1 = result.steps[0]!;
      expect(step1.step).toBe(1);

      expect(step1.probabilities[0]).toBeCloseTo(0.430000, 5);
      expect(step1.probabilities[1]).toBeCloseTo(0.365000, 5);
      expect(step1.probabilities[2]).toBeCloseTo(0.205000, 5);
      expect(step1.sum).toBeCloseTo(1.000000, 6);
    });

    it('Escenario 3.2: Calcula con exactitud la distribución para n = 3 pasos', () => {
      // When
      const result = predictSteps(pi0, P, [3]);

      // Then
      expect(result.steps).toHaveLength(1);
      const step3 = result.steps[0]!;
      expect(step3.step).toBe(3);

      expect(step3.probabilities[0]).toBeCloseTo(0.375500, 5);
      expect(step3.probabilities[1]).toBeCloseTo(0.396675, 5);
      expect(step3.probabilities[2]).toBeCloseTo(0.227825, 5);
      expect(step3.sum).toBeCloseTo(1.000000, 6);
    });

    it('Escenario 3.3: Calcula con exactitud la distribución para n = 5 y n = 10 pasos', () => {
      // When
      const result = predictSteps(pi0, P, [1, 3, 5, 10]);

      // Then
      expect(result.steps).toHaveLength(4);

      // n = 5
      const step5 = result.steps.find((s) => s.step === 5)!;
      expect(step5.probabilities[0]).toBeCloseTo(0.359003, 4);
      expect(step5.probabilities[1]).toBeCloseTo(0.401820, 4);
      expect(step5.probabilities[2]).toBeCloseTo(0.239177, 4);
      expect(step5.sum).toBeCloseTo(1.000000, 6);

      // n = 10
      const step10 = result.steps.find((s) => s.step === 10)!;
      expect(step10.probabilities[0]).toBeCloseTo(0.351415, 4);
      expect(step10.probabilities[1]).toBeCloseTo(0.403413, 4);
      expect(step10.probabilities[2]).toBeCloseTo(0.245172, 4);
      expect(step10.sum).toBeCloseTo(1.000000, 6);
    });

    it('Verifica que en cada paso la suma de probabilidades se conserve invariante en 1.0', () => {
      const result = predictSteps(pi0, P, [1, 2, 3, 5, 7, 10]);
      for (const step of result.steps) {
        expect(step.sum).toBeCloseTo(1.000000, 6);
      }
    });
  });

  describe('Casos Borde y Potenciación de Matrices', () => {
    const P = ACADEMIC_PRESET.defaultTransitionMatrix;

    it('P^0 retorna la matriz identidad', () => {
      const identity = matrixPower(P, 0);
      expect(identity).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it('P^1 retorna una copia idéntica de la matriz', () => {
      const p1 = matrixPower(P, 1);
      expect(p1).toEqual(P);
    });

    it('Caso borde: Estado inicial 100% concentrado en un solo estado (ej. 100% En Riesgo)', () => {
      // Given: Cohorte donde todos los estudiantes inician en riesgo
      const edgePi0: ProbabilityVector = [0.0, 0.0, 1.0];

      // When: n = 1
      // El resultado en t=1 debe coincidir exactamente con la fila 2 de la matriz P
      const result = predictSteps(edgePi0, P, [1]);
      const step1 = result.steps[0]!;

      // Then
      expect(step1.probabilities[0]).toBeCloseTo(P[2]![0]!, 6); // 0.10
      expect(step1.probabilities[1]).toBeCloseTo(P[2]![1]!, 6); // 0.30
      expect(step1.probabilities[2]).toBeCloseTo(P[2]![2]!, 6); // 0.60
      expect(step1.sum).toBeCloseTo(1.000000, 6);
    });

    it('Caso borde: Estado inicial 100% en Alto Rendimiento proyectado a 10 pasos', () => {
      const topPi0: ProbabilityVector = [1.0, 0.0, 0.0];
      const result = predictSteps(topPi0, P, [1, 3, 5, 10]);

      for (const step of result.steps) {
        expect(step.sum).toBeCloseTo(1.000000, 6);
        expect(step.probabilities.every((p) => p >= 0 && p <= 1)).toBe(true);
      }
    });

    it('Multiplicación vector-matriz directa lanza error si las dimensiones no coinciden', () => {
      expect(() => multiplyMatrixVector([0.5, 0.5], P)).toThrow(/Discrepancia de dimensiones/);
    });
  });
});

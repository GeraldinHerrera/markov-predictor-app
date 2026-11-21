import React, { useState, useMemo, useCallback } from 'react';
import {
  type MarkovState,
  type MutableProbabilityVector,
  type MutableTransitionMatrix,
  type PresetDefinition,
  ACADEMIC_PRESET,
  validateTransitionMatrix,
  validateInitialState,
  predictSteps,
  normalizeMatrixRows,
  normalizeVector,
} from './domain/markov';
import { MatrixEditor } from './components/MatrixEditor';
import { PredictionCharts } from './components/PredictionCharts';
import { ResultsTable } from './components/ResultsTable';
import { Binary, Cpu, Info, GitBranch } from 'lucide-react';

export const App: React.FC = () => {
  // Estado actual del preset y dimensiones
  const [activePreset, setActivePreset] = useState<PresetDefinition>(ACADEMIC_PRESET);
  const [states, setStates] = useState<MarkovState[]>(() => [...ACADEMIC_PRESET.states]);
  const [initialState, setInitialState] = useState<MutableProbabilityVector>(() => [
    ...ACADEMIC_PRESET.defaultInitialState,
  ]);
  const [matrix, setMatrix] = useState<MutableTransitionMatrix>(() =>
    ACADEMIC_PRESET.defaultTransitionMatrix.map((row) => [...row])
  );

  // Validación estocástica memorizada
  const matrixValidation = useMemo(() => {
    return validateTransitionMatrix(matrix);
  }, [matrix]);

  const initialValidation = useMemo(() => {
    return validateInitialState(initialState, states.length);
  }, [initialState, states.length]);

  const combinedValidation = useMemo(() => {
    const errors = [...matrixValidation.errors, ...initialValidation.errors];
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [matrixValidation, initialValidation]);

  // Predicciones memorizadas: sólo se calculan si los datos son estocásticamente válidos
  const predictions = useMemo(() => {
    if (!combinedValidation.isValid) {
      return null;
    }
    try {
      return predictSteps(initialState, matrix, [1, 3, 5, 10]);
    } catch {
      return null;
    }
  }, [initialState, matrix, combinedValidation.isValid]);

  // Manejadores optimizados con useCallback
  const handleUpdateStateName = useCallback((index: number, newName: string) => {
    setStates((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index]!, name: newName };
      }
      return next;
    });
  }, []);

  const handleUpdateInitialProb = useCallback((index: number, value: number) => {
    setInitialState((prev) => {
      const next = [...prev];
      next[index] = isNaN(value) ? 0 : value;
      return next;
    });
  }, []);

  const handleUpdateMatrixCell = useCallback((row: number, col: number, value: number) => {
    setMatrix((prev) => {
      const next = prev.map((r) => [...r]);
      if (next[row]) {
        next[row]![col] = isNaN(value) ? 0 : value;
      }
      return next;
    });
  }, []);

  const handleLoadPreset = useCallback((preset: PresetDefinition) => {
    setActivePreset(preset);
    setStates([...preset.states]);
    setInitialState([...preset.defaultInitialState]);
    setMatrix(preset.defaultTransitionMatrix.map((row) => [...row]));
  }, []);

  const handleNormalizeMatrix = useCallback(() => {
    setMatrix((prev) => normalizeMatrixRows(prev));
    setInitialState((prev) => normalizeVector(prev));
  }, []);

  const handleResetPreset = useCallback(() => {
    setStates([...activePreset.states]);
    setInitialState([...activePreset.defaultInitialState]);
    setMatrix(activePreset.defaultTransitionMatrix.map((row) => [...row]));
  }, [activePreset]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Barra de Navegación Superior */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Binary className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Markov Academic Predictor
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  OpenSpec Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulador de Cadenas de Markov Discretas (DTMC) con Arquitectura Limpia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modelo: π<sub>n</sub> = π<sub>0</sub> · P<sup>n</sup></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pasos: n &isin; &#123;1, 3, 5, 10&#125;</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 w-full flex flex-col gap-6 flex-1">
        {/* Banner Informativo */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white font-semibold">{activePreset.title}: </strong>
            {activePreset.description} Puedes alterar cualquier probabilidad de transición o valor inicial; el motor validará en tiempo real la estocasticidad por filas con tolerancia $\epsilon = 10^{'{'}-6{'}'}$.
          </div>
        </div>

        {/* Editor de Matriz y Estados */}
        <MatrixEditor
          states={states}
          initialState={initialState}
          matrix={matrix}
          validation={combinedValidation}
          onUpdateStateName={handleUpdateStateName}
          onUpdateInitialProb={handleUpdateInitialProb}
          onUpdateMatrixCell={handleUpdateMatrixCell}
          onLoadPreset={handleLoadPreset}
          onNormalizeMatrix={handleNormalizeMatrix}
          onResetPreset={handleResetPreset}
          activePresetId={activePreset.id}
        />

        {/* Gráficas de Evolución y Comparativa */}
        <PredictionCharts
          states={states}
          initialState={initialState}
          prediction={predictions}
        />

        {/* Tabla Detallada de Resultados */}
        <ResultsTable
          states={states}
          initialState={initialState}
          prediction={predictions}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Markov Academic Predictor &bull; Desarrollado bajo Spec-Driven Development (SDD) &bull; React 19 + TypeScript + Vite + Vitest
      </footer>
    </div>
  );
};

export default App;

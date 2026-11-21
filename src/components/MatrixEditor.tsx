import React from 'react';
import {
  type MarkovState,
  type ProbabilityVector,
  type MutableTransitionMatrix,
  type ValidationResult,
  AVAILABLE_PRESETS,
  type PresetDefinition,
  EPSILON,
} from '../domain/markov';
import { CheckCircle2, AlertTriangle, Wand2, RotateCcw, Sparkles } from 'lucide-react';

interface MatrixEditorProps {
  states: readonly MarkovState[];
  initialState: ProbabilityVector;
  matrix: MutableTransitionMatrix;
  validation: ValidationResult;
  onUpdateStateName: (index: number, newName: string) => void;
  onUpdateInitialProb: (index: number, value: number) => void;
  onUpdateMatrixCell: (row: number, col: number, value: number) => void;
  onLoadPreset: (preset: PresetDefinition) => void;
  onNormalizeMatrix: () => void;
  onResetPreset: () => void;
  activePresetId: string;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  states,
  initialState,
  matrix,
  validation,
  onUpdateStateName,
  onUpdateInitialProb,
  onUpdateMatrixCell,
  onLoadPreset,
  onNormalizeMatrix,
  onResetPreset,
  activePresetId,
}) => {
  const initialSum = initialState.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
  const isInitialSumValid = Math.abs(initialSum - 1.0) <= EPSILON;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header y Selector de Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Configuración de Matriz y Estados
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Modifica la matriz estocástica $P$ y el vector de cohorte inicial $\pi_0$.
          </p>
        </div>

        {/* Botones de acción y Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {AVAILABLE_PRESETS.map((preset) => {
              const isActive = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => onLoadPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  data-testid={`preset-btn-${preset.id}`}
                >
                  {preset.title}
                </button>
              );
            })}
          </div>

          <button
            onClick={onNormalizeMatrix}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Ajusta proporcionalmente las filas para que sumen exactamente 1.00"
            data-testid="normalize-btn"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Normalizar Filas
          </button>

          <button
            onClick={onResetPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Restablecer valores predeterminados del preset seleccionado"
            data-testid="reset-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Restablecer
          </button>
        </div>
      </div>

      {/* Alertas de Validación */}
      {!validation.isValid && (
        <div
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex flex-col gap-1.5 animate-fadeIn"
          data-testid="validation-alert"
        >
          <div className="flex items-center gap-2 font-semibold text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Invariantes estocásticos violados ({validation.errors.length} error/es):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-300/90 pl-1">
            {validation.errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor del Vector Inicial pi_0 */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Vector de Estado Inicial ($\pi_0$)
            </h3>
            <span className="text-xs text-slate-400 font-normal">
              (Distribución de cohorte en t=0)
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              isInitialSumValid
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
            data-testid="initial-sum-badge"
          >
            {isInitialSumValid ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            Suma: {initialSum.toFixed(4)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {states.map((state, idx) => {
            const prob = initialState[idx] ?? 0;
            return (
              <div
                key={state.id || idx}
                className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: state.color || '#6366F1' }}
                  />
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) => onUpdateStateName(idx, e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 border-b border-transparent w-full"
                    title="Editar nombre del estado"
                    data-testid={`state-name-input-${idx}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={prob}
                    onChange={(e) => onUpdateInitialProb(idx, parseFloat(e.target.value))}
                    className="bg-slate-950 text-slate-100 font-mono text-sm px-2.5 py-1.5 rounded border border-slate-700 focus:border-indigo-500 focus:outline-none w-full"
                    data-testid={`initial-prob-input-${idx}`}
                  />
                  <span className="text-xs font-mono text-slate-400 w-12 text-right">
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor de la Matriz de Transición P */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Matriz de Transición de Probabilidades ($P$)
          </h3>
          <span className="text-xs text-slate-400">
            Cada fila debe sumar exactamente 1.00 (p<sub>ij</sub>: probabilidad de transición del estado i al j)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm" data-testid="transition-matrix-table">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 w-44">Estado Origen ($i$)</th>
                {states.map((st, j) => (
                  <th key={j} className="p-3 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: st.color || '#6366F1' }}
                      />
                      <span className="truncate max-w-[120px]" title={st.name}>
                        {st.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center w-28">Suma Fila</th>
                <th className="p-3 text-center w-24">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
              {matrix.map((row, i) => {
                const rowSum = row.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
                const isRowValid = Math.abs(rowSum - 1.0) <= EPSILON;
                const state = states[i];

                return (
                  <tr
                    key={i}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !isRowValid ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-sans font-medium text-slate-300">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: state?.color || '#6366F1' }}
                        />
                        <span className="truncate max-w-[150px]" title={state?.name}>
                          {state?.name ?? `Estado ${i + 1}`}
                        </span>
                      </div>
                    </td>

                    {row.map((cellVal, j) => {
                      const isCellOutOfBounds = isNaN(cellVal) || cellVal < 0 || cellVal > 1;
                      return (
                        <td key={j} className="p-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={cellVal}
                            onChange={(e) =>
                              onUpdateMatrixCell(i, j, parseFloat(e.target.value))
                            }
                            className={`w-20 text-center font-mono text-sm px-2 py-1.5 rounded border focus:outline-none transition ${
                              isCellOutOfBounds
                                ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                                : 'bg-slate-950 text-slate-100 border-slate-700 focus:border-indigo-500'
                            }`}
                            data-testid={`matrix-cell-${i}-${j}`}
                          />
                        </td>
                      );
                    })}

                    <td className="p-3 text-center">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          isRowValid
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                        data-testid={`row-sum-${i}`}
                      >
                        {rowSum.toFixed(4)}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {isRowValid ? (
                        <span className="inline-flex items-center text-xs text-emerald-400 font-sans gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-rose-400 font-sans gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ≠ 1.0
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

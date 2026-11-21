import React from 'react';
import {
  type MarkovState,
  type PredictionResult,
  type ProbabilityVector,
} from '../domain/markov';
import { Table, ArrowUpRight, Award, ShieldAlert, Activity } from 'lucide-react';

interface ResultsTableProps {
  states: readonly MarkovState[];
  initialState: ProbabilityVector;
  prediction: PredictionResult | null;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  states,
  initialState,
  prediction,
}) => {
  if (!prediction || prediction.steps.length === 0) {
    return null;
  }

  // Identificar métricas clave
  const step10 = prediction.steps.find((s) => s.step === 10) ?? prediction.steps[prediction.steps.length - 1]!;
  
  // Estado dominante en t=10
  let maxProbIndex = 0;
  let maxProbVal = -1;
  step10.probabilities.forEach((p, idx) => {
    if (p > maxProbVal) {
      maxProbVal = p;
      maxProbIndex = idx;
    }
  });
  const dominantState = states[maxProbIndex];

  // Estado con mayor variación (t=0 -> t=10)
  const deltas = states.map((state, idx) => {
    const init = initialState[idx] ?? 0;
    const final = step10.probabilities[idx] ?? 0;
    return {
      state,
      diff: final - init,
      init,
      final,
    };
  });

  const biggestGainer = [...deltas].sort((a, b) => b.diff - a.diff)[0];
  const biggestLoser = [...deltas].sort((a, b) => a.diff - b.diff)[0];

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6" data-testid="results-table-section">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Table className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Distribución Temporal de Probabilidades
          </h3>
          <p className="text-xs text-slate-400">
            Valores exactos y porcentuales de la cohorte en los horizontes evaluados n &isin; &#123;1, 3, 5, 10&#125;
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-medium">Estado Dominante (t=10)</span>
            <h4 className="text-sm font-bold text-slate-100 mt-0.5" data-testid="dominant-state">
              {dominantState?.name ?? 'N/A'}
            </h4>
            <p className="text-xs text-emerald-400 font-mono mt-1">
              {(maxProbVal * 100).toFixed(2)}% de la población
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-medium">Mayor Incremento Relativo</span>
            <h4 className="text-sm font-bold text-slate-100 mt-0.5">
              {biggestGainer?.state.name ?? 'N/A'}
            </h4>
            <p className="text-xs text-indigo-400 font-mono mt-1">
              {biggestGainer && biggestGainer.diff >= 0 ? '+' : ''}
              {(biggestGainer?.diff ? biggestGainer.diff * 100 : 0).toFixed(2)}% (desde t=0)
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-medium">Mayor Reducción / Desplazamiento</span>
            <h4 className="text-sm font-bold text-slate-100 mt-0.5">
              {biggestLoser?.state.name ?? 'N/A'}
            </h4>
            <p className="text-xs text-rose-400 font-mono mt-1">
              {(biggestLoser?.diff ? biggestLoser.diff * 100 : 0).toFixed(2)}% (desde t=0)
            </p>
          </div>
        </div>
      </div>

      {/* Tabla detallada de distribución */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm" data-testid="predictions-summary-table">
          <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3 w-36">Horizonte Temporal</th>
              {states.map((st, idx) => (
                <th key={idx} className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: st.color || '#6366F1' }}
                    />
                    <span>{st.name}</span>
                  </div>
                </th>
              ))}
              <th className="p-3 text-center w-28">Control Suma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono text-xs">
            {/* Fila t=0 */}
            <tr className="bg-slate-950/40 text-slate-400">
              <td className="p-3 font-sans font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>t = 0 (Inicial)</span>
                </div>
              </td>
              {states.map((_, idx) => {
                const prob = initialState[idx] ?? 0;
                return (
                  <td key={idx} className="p-3 text-center">
                    <span className="font-bold text-slate-200">{(prob * 100).toFixed(2)}%</span>
                    <span className="block text-[11px] text-slate-500 font-normal">
                      ({prob.toFixed(4)})
                    </span>
                  </td>
                );
              })}
              <td className="p-3 text-center text-emerald-400 font-semibold">
                {(initialState.reduce((a, b) => a + b, 0) * 100).toFixed(2)}%
              </td>
            </tr>

            {/* Filas t=1, 3, 5, 10 */}
            {prediction.steps.map((st) => (
              <tr key={st.step} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-sans font-medium text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-semibold">
                    t = {st.step} {st.step === 1 ? 'paso' : 'pasos'}
                  </span>
                </td>
                {states.map((_, idx) => {
                  const prob = st.probabilities[idx] ?? 0;
                  return (
                    <td key={idx} className="p-3 text-center" data-testid={`prob-t${st.step}-col${idx}`}>
                      <span className="font-bold text-slate-100">{(prob * 100).toFixed(2)}%</span>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        ({prob.toFixed(4)})
                      </span>
                    </td>
                  );
                })}
                <td className="p-3 text-center text-emerald-400 font-semibold">
                  {(st.sum * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

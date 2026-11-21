import React from 'react';
import {
  type MarkovState,
  type PredictionResult,
  type ProbabilityVector,
} from '../domain/markov';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, Clock } from 'lucide-react';

interface PredictionChartsProps {
  states: readonly MarkovState[];
  initialState: ProbabilityVector;
  prediction: PredictionResult | null;
}

export const PredictionCharts: React.FC<PredictionChartsProps> = ({
  states,
  initialState,
  prediction,
}) => {
  if (!prediction || prediction.steps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500 animate-pulse" />
        <p className="text-sm">Configura una matriz estocástica válida para visualizar las gráficas de evolución.</p>
      </div>
    );
  }

  // Preparamos los datos para la gráfica de evolución temporal (t=0, t=1, t=3, t=5, t=10)
  const trajectoryData = [
    {
      stepLabel: 't = 0 (Inicial)',
      step: 0,
      ...states.reduce<Record<string, number>>((acc, state, idx) => {
        acc[state.name] = Number(((initialState[idx] ?? 0) * 100).toFixed(2));
        return acc;
      }, {}),
    },
    ...prediction.steps.map((st) => ({
      stepLabel: `t = ${st.step}`,
      step: st.step,
      ...states.reduce<Record<string, number>>((acc, state, idx) => {
        acc[state.name] = Number(((st.probabilities[idx] ?? 0) * 100).toFixed(2));
        return acc;
      }, {}),
    })),
  ];

  // Preparamos los datos para la gráfica comparativa: Estado Inicial (t=0) vs Horizonte Final (t=10)
  const step10 = prediction.steps.find((s) => s.step === 10) ?? prediction.steps[prediction.steps.length - 1];

  const comparisonData = states.map((state, idx) => {
    const initialProb = (initialState[idx] ?? 0) * 100;
    const finalProb = step10 ? (step10.probabilities[idx] ?? 0) * 100 : 0;
    return {
      name: state.name,
      'Inicial (t=0)': Number(initialProb.toFixed(2)),
      'Horizonte (t=10)': Number(finalProb.toFixed(2)),
      color: state.color || '#6366F1',
    };
  });

  return (
    <div className="flex flex-col gap-6" data-testid="prediction-charts-container">
      {/* Gráfica 1: Evolución Temporal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Evolución de Probabilidades en el Tiempo
              </h3>
              <p className="text-xs text-slate-400">
                Trayectoria proyectada de los estados para los pasos t &isin; &#123;1, 3, 5, 10&#125;
              </p>
            </div>
          </div>
          {prediction.isStationaryReached && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Convergencia detectada (t ≈ {prediction.stationaryStep})
            </span>
          )}
        </div>

        <div className="w-full h-72" data-testid="trajectory-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <LineChart data={trajectoryData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="stepLabel" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val: any) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              {states.map((st) => (
                <Line
                  key={st.name}
                  type="monotone"
                  dataKey={st.name}
                  stroke={st.color || '#6366F1'}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: st.color || '#6366F1' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica 2: Comparativa Inicial (t=0) vs Horizonte Final (t=10) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Comparativa: Estado Inicial (t=0) vs Horizonte Final (t=10)
            </h3>
            <p className="text-xs text-slate-400">
              Desplazamiento neto de la distribución estudiantil a largo plazo
            </p>
          </div>
        </div>

        <div className="w-full h-64" data-testid="comparison-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                }}
                formatter={(val: any) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Bar dataKey="Inicial (t=0)" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Horizonte (t=10)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

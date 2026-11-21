# Contexto del Proyecto: Markov Academic Predictor

## 1. Visión General
**Markov Academic Predictor** es una aplicación web interactiva de alto rendimiento orientada al modelado estocástico mediante **Cadenas de Markov a Tiempo Discreto (DTMC - Discrete-Time Markov Chains)**. Su objetivo principal es predecir la trayectoria y evolución del rendimiento académico estudiantil a lo largo de múltiples periodos temporales (semestres o trimestres) a partir de una distribución inicial de estudiantes y una matriz de transición empírica o configurada por el usuario.

El modelado resuelve una necesidad crítica en instituciones educativas: proyectar tasas de deserción, permanencia y excelencia académica para la toma oportuna de decisiones de intervención pedagógica y asignación de tutorías.

---

## 2. Dominio Matemático

### 2.1. Espacio de Estados
El sistema opera sobre un espacio de estados finito y discreto $S = \{S_1, S_2, S_3\}$ definido por:
- $S_1$: **Alto Rendimiento** (Estudiantes con promedio sobresaliente, sin materias reprobadas).
- $S_2$: **Rendimiento Regular** (Estudiantes en promedio estándar, riesgo académico bajo o medio).
- $S_3$: **En Riesgo** (Estudiantes en riesgo de deserción o pérdida académica, materias reprobadas o bajo promedio).

### 2.2. Matriz de Transición de Probabilidades ($P$)
Sea $\{X_t\}_{t \ge 0}$ un proceso estocástico que toma valores en $S$. Se asume la propiedad markoviana de primer orden:
$$P(X_{t+1} = j \mid X_t = i, X_{t-1} = i_{t-1}, \dots, X_0 = i_0) = P(X_{t+1} = j \mid X_t = i) = p_{ij}$$

La matriz de transición $P \in \mathbb{R}^{3 \times 3}$ es una matriz estocástica por filas:
$$P = \begin{pmatrix} p_{11} & p_{12} & p_{13} \\ p_{21} & p_{22} & p_{23} \\ p_{31} & p_{32} & p_{33} \end{pmatrix}$$

#### Invariantes Estocásticos:
1. **No-negatividad y acotamiento**: $\forall i, j \in \{1, 2, 3\}: 0 \le p_{ij} \le 1$.
2. **Suma unitaria por fila**: $\forall i \in \{1, 2, 3\}: \sum_{j=1}^{3} p_{ij} = 1.0$.
3. **Tolerancia de punto flotante**: Debido a la representación IEEE 754 de números flotantes, se aplica un factor de tolerancia $\epsilon = 10^{-6}$:
   $$\left| \sum_{j=1}^{3} p_{ij} - 1.0 \right| \le 10^{-6}$$

### 2.3. Vector de Estado Inicial ($\pi_0$)
El vector de distribución inicial $\pi_0 \in \mathbb{R}^{1 \times 3}$ representa la proporción de la población estudiantil en cada estado en $t=0$:
$$\pi_0 = \begin{pmatrix} \pi_0(S_1) & \pi_0(S_2) & \pi_0(S_3) \end{pmatrix}$$
Sujeto a:
$$\sum_{k=1}^{3} \pi_0(S_k) = 1.0 \quad \text{con } \left| \sum_{k=1}^{3} \pi_0(S_k) - 1.0 \right| \le 10^{-6} \quad \text{y} \quad \pi_0(S_k) \in [0, 1]$$

### 2.4. Predicción de Estados Futuros ($\pi_n$)
La distribución de probabilidad en el paso $n$ se calcula mediante la ecuación de Chapman-Kolmogorov:
$$\pi_n = \pi_0 \cdot P^n$$
donde $P^n$ es la $n$-ésima potencia de la matriz de transición $P$.

Los horizontes temporales de predicción obligatorios evaluados en el sistema corresponden a:
$$n \in \{1, 3, 5, 10\}$$

---

## 3. Stack Tecnológico

| Capa / Herramienta | Elección Tecnológica | Justificación Arquitectónica |
| :--- | :--- | :--- |
| **Runtime & Framework** | React 19 + TypeScript (strict mode) | Composición basada en componentes fuertemente tipados, control de estado reactivo y garantía de tipos en tiempo de compilación. |
| **Bundler & Tooling** | Vite | Tiempos ultra-rápidos de compilación, HMR instantáneo y build optimizado basado en Rollup/ESBuild. |
| **Estilos & UI** | Tailwind CSS v4 | Enfoque utility-first para diseño de dashboards analíticos responsivos, consistentes y de alto contraste. |
| **Visualización Gráfica** | Recharts | Librería nativa y declarativa para React basada en SVG; soporte directo para gráficos de líneas, áreas y barras con transiciones suaves. |
| **Motor de Pruebas Unitarias** | Vitest | Compatibilidad nativa con Vite, ejecución paralela de tests y validación estricta del motor matemático sin overhead de DOM. |
| **Iconografía** | Lucide React | Conjunto de iconos moderno, ligero y modular para indicadores de estado y alertas. |

---

## 4. Arquitectura de Software y Principios de Diseño

El sistema sigue los principios de **Clean Architecture** y **Functional Core, Reactive Shell**, asegurando que el motor de cómputo estocástico sea completamente desacoplado e independiente de cualquier librería de UI o navegador.

```
src/
├── core/                         # NÚCLEO PURO (Sin dependencias de React ni DOM)
│   ├── domain/                   # Modelos, Entidades e Interfaces matemáticas
│   │   ├── types.ts              # Matrix, ProbabilityVector, MarkovState, StepResult
│   │   └── constants.ts          # Matriz académica por defecto, tolerancia epsilon
│   ├── math/                     # Funciones matemáticas puras e inmutables
│   │   ├── matrix-operations.ts  # Multiplicación, potencia de matrices (exponenciación)
│   │   └── vector-operations.ts  # Multiplicación vector-matriz
│   ├── validation/               # Validadores formales de invariantes estocásticos
│   │   └── markov-validator.ts   # Validación de sumas unitarias y rangos [0, 1]
│   └── services/                 # Casos de uso / Orquestador de predicción
│       └── markov-engine.ts      # Cálculo de pi_n para n in {1, 3, 5, 10}
│
├── presentation/                 # CAPA DE UI REACTIVA (Shell)
│   ├── components/               # Componentes atómicos y moleculares
│   │   ├── MatrixEditor/         # Edición tabular interactiva con validación por celda
│   │   ├── InitialStateEditor/   # Configuración de vector inicial pi_0
│   │   ├── PredictionChart/      # Visualización gráfica con Recharts
│   │   ├── ResultsTable/         # Tabla de distribución temporal de probabilidades
│   │   └── ValidationAlerts/     # Feedback visual de errores matemáticos
│   ├── hooks/                    # Custom Hooks para gestión de estado del predictor
│   │   └── useMarkovPredictor.ts # Puente reactivo entre Core y Componentes
│   └── App.tsx                   # Layout principal del Dashboard
│
└── tests/                        # PRUEBAS AUTOMATIZADAS
    └── core/                     # Cobertura exhaustiva de math, validation y services
```

### Reglas de Dependencia y Calidad de Código:
1. **Regla de Dependencia Unidireccional**: La capa `core/` no debe importar nada de `presentation/`, `react`, ni ninguna librería externa salvo librerías puramente matemáticas si fuera necesario.
2. **Inmutabilidad**: Todas las funciones de `core/math` son funciones puras (`(matrix, n) => newMatrix`) sin mutación de arreglos de entrada.
3. **Tipado Estricto**: Prohibido el uso de `any` o aserciones de tipo `as unknown`. Interfaces nominales y tipos unión discriminados para resultados (`ValidationResult = { isValid: true; ... } | { isValid: false; errors: string[] }`).
4. **Verificabilidad Automatizada**: La lógica matemática debe alcanzar el 100% de cobertura de ramas y sentencias en pruebas con Vitest.

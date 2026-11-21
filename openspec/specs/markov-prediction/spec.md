# Especificación de Requerimiento: Markov Prediction Engine & UI

| Metadato | Detalle |
| :--- | :--- |
| **ID de Especificación** | `SPEC-MARKOV-001` |
| **Módulo** | `markov-prediction` |
| **Estado** | `APPROVED` |
| **Versión** | `1.0.0` |
| **Dominio** | Predicción de Rendimiento Académico mediante Cadenas de Markov Discretas |
| **Enfoque Metodológico** | Spec-Driven Development (SDD) / OpenSpec |

---

## 1. Descripción del Requerimiento
El sistema debe proporcionar un motor de simulación y un panel de visualización interactivo para proyectar la distribución de estados de rendimiento académico estudiantil ("Alto Rendimiento", "Rendimiento Regular", "En Riesgo") a lo largo de pasos temporales discretos $n \in \{1, 3, 5, 10\}$.

El usuario podrá interactuar tanto con el vector de probabilidad inicial $\pi_0$ como con la matriz de transición estocástica $P$, contando con validaciones matemáticas en tiempo real antes de efectuar cualquier cálculo de predicción.

---

## 2. Definición del Espacio de Estados y Valores por Defecto

### 2.1. Estados
1. $S_1$: `Alto Rendimiento` (Índice 0)
2. $S_2$: `Rendimiento Regular` (Índice 1)
3. $S_3$: `En Riesgo` (Índice 2)

### 2.2. Vector de Estado Inicial por Defecto ($\pi_0$)
$$\pi_0 = \begin{bmatrix} 0.50 & 0.30 & 0.20 \end{bmatrix}$$

### 2.3. Matriz de Transición por Defecto ($P$)
$$P = \begin{bmatrix} 0.70 & 0.25 & 0.05 \\ 0.20 & 0.60 & 0.20 \\ 0.10 & 0.30 & 0.60 \end{bmatrix}$$

- **Fila 0 (Alto Rendimiento)**: 70% retiene alto rendimiento, 25% baja a regular, 5% cae en riesgo.
- **Fila 1 (Rendimiento Regular)**: 20% asciende a alto, 60% permanece regular, 20% desciende a riesgo.
- **Fila 2 (En Riesgo)**: 10% asciende a alto, 30% pasa a regular, 60% permanece en riesgo.

---

## 3. Escenarios de Comportamiento (Given / When / Then)

### Regla 1: Integridad y Validación de la Matriz Estocástica

#### Escenario 1.1: Matriz de transición válida por filas
```gherkin
Given una matriz de transición P de dimensión 3x3
And todos los elementos p[i][j] cumplen 0.0 <= p[i][j] <= 1.0
And la suma de cada fila sum(p[i]) satisface |sum(p[i]) - 1.0| <= 1e-6 para todo i in {0, 1, 2}
When el sistema valida la matriz
Then el validador emite un resultado de validez "true"
And no se registran mensajes de error
And el motor habilita el cálculo de predicciones
```

#### Escenario 1.2: Detección de fila cuya suma no es 1.0 (fuera de tolerancia)
```gherkin
Given la fila 1 de la matriz de transición con valores [0.20, 0.50, 0.20] cuya suma es 0.90
When el validador estocástico analiza la fila 1
Then el validador emite un resultado de validez "false"
And genera un error con código "ROW_SUM_INVALID"
And el mensaje de error indica: "La fila 'Rendimiento Regular' (fila 2) suma 0.900000, pero debe sumar exactamente 1.0 (diferencia: -0.100000)"
And el motor bloquea el cálculo de predicciones futuras
```

#### Escenario 1.3: Detección de probabilidades fuera del rango [0, 1]
```gherkin
Given una matriz de transición con p[0][1] = -0.05 y p[0][0] = 1.00 y p[0][2] = 0.05
When el validador estocástico analiza la celda (0, 1)
Then el validador emite un resultado de validez "false"
And genera un error con código "PROBABILITY_OUT_OF_BOUNDS"
And el mensaje indica: "La celda [Alto Rendimiento -> Rendimiento Regular] contiene un valor inválido (-0.05). Las probabilidades deben estar entre 0.0 y 1.0"
And se resalta la celda con borde y fondo de advertencia en la interfaz
```

#### Escenario 1.4: Tolerancia numérica de punto flotante aceptada
```gherkin
Given una fila de transición con valores [0.333333, 0.333333, 0.333334]
And la suma aritmética es 1.000000
And la discrepancia respecto a 1.0 es |1.000000 - 1.0| = 0.0 <= 1e-6
When el validador evalúa la fila
Then la fila es catalogada como ESTOCÁSTICA_VÁLIDA
And se permite el cálculo sin emitir falsos positivos
```

---

### Regla 2: Integridad y Validación del Vector de Estado Inicial ($\pi_0$)

#### Escenario 2.1: Vector de estado inicial válido
```gherkin
Given un vector de estado inicial pi_0 = [0.50, 0.30, 0.20]
When el sistema valida el vector de estado inicial
Then el validador confirma que pi_0 es válido
And la suma total de probabilidades es igual a 1.0 (con tolerancia 1e-6)
```

#### Escenario 2.2: Vector de estado inicial inválido
```gherkin
Given un vector de estado inicial pi_0 = [0.60, 0.30, 0.30] cuya suma es 1.20
When el sistema valida el vector de estado inicial
Then el validador emite un error con código "INITIAL_VECTOR_SUM_INVALID"
And el mensaje indica: "El vector de estado inicial suma 1.200000; la distribución debe sumar 1.0"
And se suspende la generación de gráficos
```

---

### Regla 3: Cálculo Exacto de Distribución de Estados ($\pi_n = \pi_0 \cdot P^n$)

#### Escenario 3.1: Proyección en un solo periodo (Paso n = 1)
```gherkin
Given el vector inicial pi_0 = [0.50, 0.30, 0.20]
And la matriz académica estándar P = [
  [0.70, 0.25, 0.05],
  [0.20, 0.60, 0.20],
  [0.10, 0.30, 0.60]
]
When el motor de Markov ejecuta la predicción para n = 1
Then el vector de probabilidad resultante pi_1 es:
  | Estado | Probabilidad Calculada |
  | Alto Rendimiento (S1) | 0.430000 |
  | Rendimiento Regular (S2) | 0.365000 |
  | En Riesgo (S3) | 0.205000 |
And la suma del vector resultante es exactamente 1.000000
```

#### Escenario 3.2: Proyección a mediano plazo (Paso n = 3)
```gherkin
Given el vector inicial pi_0 y la matriz P académica estándar
When el motor de Markov ejecuta la predicción para n = 3
Then el vector de probabilidad resultante pi_3 es (con precisión de 6 decimales):
  | Estado | Probabilidad Calculada |
  | Alto Rendimiento (S1) | 0.375500 |
  | Rendimiento Regular (S2) | 0.396675 |
  | En Riesgo (S3) | 0.227825 |
And la suma sum(pi_3) es igual a 1.000000
```

#### Escenario 3.3: Proyección en pasos n = 5 y n = 10
```gherkin
Given el vector inicial pi_0 y la matriz P académica estándar
When el motor calcula las distribuciones para n = 5 y n = 10
Then para n = 5 el vector resultante pi_5 es:
  | Estado | Probabilidad Calculada |
  | Alto Rendimiento (S1) | 0.359003 |
  | Rendimiento Regular (S2) | 0.401820 |
  | En Riesgo (S3) | 0.239177 |
And para n = 10 el vector resultante pi_10 es:
  | Estado | Probabilidad Calculada |
  | Alto Rendimiento (S1) | 0.351415 |
  | Rendimiento Regular (S2) | 0.403413 |
  | En Riesgo (S3) | 0.245172 |
And la tendencia demuestra convergencia suave hacia el vector estacionario de la cadena
```

---

### Regla 4: Edición Interactiva y Restablecimiento

#### Escenario 4.1: Restaurar la matriz académica por defecto
```gherkin
Given que el usuario modificó manualmente celdas de la matriz o del vector inicial
When el usuario pulsa el botón "Restablecer Valores Académicos"
Then la matriz P vuelve a sus valores predeterminados:
  [[0.70, 0.25, 0.05], [0.20, 0.60, 0.20], [0.10, 0.30, 0.60]]
And el vector pi_0 vuelve a [0.50, 0.30, 0.20]
And se limpian todas las alertas de error
And los cálculos y gráficos se recalculan inmediatamente
```

#### Escenario 4.2: Edición reactiva con re-cálculo automático
```gherkin
Given una matriz válida en pantalla
When el usuario modifica el valor de una celda manteniendo la suma de fila en 1.0 (ej. p[0][0] = 0.80 y p[0][1] = 0.15)
Then el sistema actualiza automáticamente el estado reactivo sin recargar la página
And los valores de pi_1, pi_3, pi_5 y pi_10 se actualizan de forma reactiva
And el gráfico de evolución refleja la nueva trayectoria estocástica
```

---

### Regla 5: Visualización Gráfica y Resultados Tabulares

#### Escenario 5.1: Gráfica comparativa de evolución en los pasos n in {1, 3, 5, 10}
```gherkin
Given un conjunto de resultados calculados válidos para n in {0, 1, 3, 5, 10}
When la vista renderiza el componente gráfico
Then se presenta un gráfico con eje X representando los pasos temporales: ["Inicial (n=0)", "Paso 1", "Paso 3", "Paso 5", "Paso 10"]
And el eje Y muestra la probabilidad entre 0% y 100% (o 0.0 a 1.0)
And se renderizan 3 series claramente diferenciadas por color y leyenda:
  - Alto Rendimiento (Color Esmeralda / Verde: `#10B981`)
  - Rendimiento Regular (Color Ámbar / Amarillo: `#F59E0B`)
  - En Riesgo (Color Carmesí / Rojo: `#EF4444`)
And se incluye tooltip interactivo que detalla los valores porcentuales exactos al posicionar el cursor
```

#### Escenario 5.2: Tabla comparativa detallada
```gherkin
Given predicciones calculadas para n in {1, 3, 5, 10}
When la vista renderiza la tabla de resultados
Then cada fila o columna representa un paso temporal n
And para cada paso se exponen las probabilidades de los 3 estados en formato decimal (ej: 0.3755) y porcentual (ej: 37.55%)
And se muestra una columna de control de suma que verifica que sum(pi_n) == 100.00%
```

---

## 4. Requerimientos No Funcionales

1. **Rendimiento de Cómputo**: El cálculo de $\pi_n$ para $n \le 10$ debe ejecutarse en menos de 5 milisegundos en el hilo de ejecución principal.
2. **Determinismo y Pureza**: Las funciones de álgebra lineal no deben tener efectos colaterales (side-effects) ni depender del estado del navegador.
3. **Manejo de Errores Amigable**: Ninguna entrada numérica no válida (ej. caracteres alfanuméricos, `NaN`, valores infinitos o nulos) debe causar excepciones no controladas en tiempo de ejecución.
4. **Accesibilidad y UX**: Los colores de los estados deben cumplir con contrastes legibles (WCAG AA), y los campos numéricos deben indicar visualmente su validez con estados de error y ayuda textual contextual.

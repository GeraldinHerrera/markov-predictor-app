import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock de ResizeObserver para Recharts en entorno JSDOM
beforeEach(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('App Integration Tests (OpenSpec UI & Engine)', () => {
  it('Renderiza el dashboard con el preset académico predeterminado y resultados válidos', () => {
    render(<App />);

    // Verificar encabezado y títulos
    expect(screen.getByText('Markov Academic Predictor')).toBeDefined();
    expect(screen.getByText('Configuración de Matriz y Estados')).toBeDefined();

    // Verificar estados académicos por defecto
    expect(screen.getAllByDisplayValue('Alto Rendimiento').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Rendimiento Regular').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('En Riesgo').length).toBeGreaterThan(0);

    // Verificar resultados iniciales calculados para t=1 (43.00%, 36.50%, 20.50%)
    expect(screen.getByTestId('prob-t1-col0').textContent).toContain('43.00%');
    expect(screen.getByTestId('prob-t1-col1').textContent).toContain('36.50%');
    expect(screen.getByTestId('prob-t1-col2').textContent).toContain('20.50%');

    // Verificar que no haya alerta de validación al inicio
    expect(screen.queryByTestId('validation-alert')).toBeNull();
  });

  it('Muestra alerta de validación cuando una fila no suma 1.0 tras una edición de celda', () => {
    render(<App />);

    // Modificar la celda (1, 1) cambiando de 0.60 a 0.20 (fila 1 sumará 0.60 en vez de 1.0)
    const cellInput = screen.getByTestId('matrix-cell-1-1');
    fireEvent.change(cellInput, { target: { value: '0.20' } });

    // La alerta de validación debe aparecer
    const alert = screen.getByTestId('validation-alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('La fila 2 suma 0.600000, pero debe sumar exactamente 1.0');

    // El indicador de estado de la fila 1 debe marcar error
    const rowSum = screen.getByTestId('row-sum-1');
    expect(rowSum.textContent).toBe('0.6000');
  });

  it('El botón de Normalizar Filas reajusta la matriz para que sume 1.0 y elimina la alerta', () => {
    render(<App />);

    // Descuadrar celda
    const cellInput = screen.getByTestId('matrix-cell-0-0');
    fireEvent.change(cellInput, { target: { value: '0.20' } });
    expect(screen.getByTestId('validation-alert')).toBeDefined();

    // Ejecutar normalización
    const normalizeBtn = screen.getByTestId('normalize-btn');
    fireEvent.click(normalizeBtn);

    // Tras normalizar, las filas deben sumar 1.0 y la alerta debe desaparecer
    expect(screen.queryByTestId('validation-alert')).toBeNull();
  });

  it('Carga correctamente el preset de Tráfico Urbano (4x4)', () => {
    render(<App />);

    // Clic en preset de Tráfico
    const trafficBtn = screen.getByTestId('preset-btn-traffic');
    fireEvent.click(trafficBtn);

    // Verificar que se cargan los 4 estados de tráfico
    expect(screen.getAllByDisplayValue('Fluido').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Moderado').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Congestionado').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('Paralizado').length).toBeGreaterThan(0);

    // Verificar que la matriz 4x4 se calcule sin errores
    expect(screen.queryByTestId('validation-alert')).toBeNull();
    expect(screen.getByTestId('prob-t1-col3')).toBeDefined();
  });

  it('Restablece los valores al presionar el botón Restablecer', () => {
    render(<App />);

    // Modificar celda
    const cellInput = screen.getByTestId('matrix-cell-0-0');
    fireEvent.change(cellInput, { target: { value: '0.99' } });
    expect(screen.getByTestId('validation-alert')).toBeDefined();

    // Restablecer
    const resetBtn = screen.getByTestId('reset-btn');
    fireEvent.click(resetBtn);

    // Debe volver a los valores predeterminados (0.70)
    expect(screen.queryByTestId('validation-alert')).toBeNull();
    const cellAfterReset = screen.getByTestId('matrix-cell-0-0') as HTMLInputElement;
    expect(cellAfterReset.value).toBe('0.7');
  });
});

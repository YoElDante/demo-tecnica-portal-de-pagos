/**
 * Tests del Motor de Fórmula de Intereses
 * 
 * Cubre los 2 modos del contador + edge cases + dispatcher.
 */

const {
  calcularInteresCoeficiente,
  calcularInteresSimpleFA,
  calcularMovimiento,
  calcularDiasMora,
} = require('../../services/intereses.service');

// ── Modo A: Coeficiente ──

describe('Modo A — Recálculo por Coeficiente', () => {
  test('calcula interés por coeficiente correctamente', () => {
    const result = calcularInteresCoeficiente(10000, 150, 100);
    // 10000 * (150/100) = 10000 * 1.5 = 15000
    expect(result).toBe(15000);
  });

  test('retorna 0 si saldo es 0 o negativo', () => {
    expect(calcularInteresCoeficiente(0, 150, 100)).toBe(0);
    expect(calcularInteresCoeficiente(-100, 150, 100)).toBe(0);
  });

  test('retorna 0 si IndiceFinal es null o 0', () => {
    expect(calcularInteresCoeficiente(1000, null, 100)).toBe(0);
    expect(calcularInteresCoeficiente(1000, 0, 100)).toBe(0);
  });

  test('retorna 0 si CoeficienteCuota es 0 o negativo', () => {
    expect(calcularInteresCoeficiente(1000, 150, 0)).toBe(0);
    expect(calcularInteresCoeficiente(1000, 150, -5)).toBe(0);
  });

  test('redondea a 2 decimales', () => {
    const result = calcularInteresCoeficiente(3333, 100, 300);
    // 3333 * (100/300) = 3333 * 0.3333... = 1111
    expect(result).toBe(1111);
  });
});

// ── Modo B: Interés Simple FA ──

describe('Modo B — Interés Simple FA', () => {
  test('calcula interés simple correctamente', () => {
    // saldo=10000, tasa=40%, dias=30
    // 10000 * (40/36500) * 30 = 10000 * 0.00109589 * 30 = 328.77
    const result = calcularInteresSimpleFA(10000, 40, 30);
    expect(result).toBe(328.77);
  });

  test('retorna 0 si saldo <= 0', () => {
    expect(calcularInteresSimpleFA(0, 40, 30)).toBe(0);
    expect(calcularInteresSimpleFA(-500, 40, 30)).toBe(0);
  });

  test('retorna 0 si dias <= 0', () => {
    expect(calcularInteresSimpleFA(10000, 40, 0)).toBe(0);
    expect(calcularInteresSimpleFA(10000, 40, -5)).toBe(0);
  });

  test('retorna 0 si tasa es 0', () => {
    expect(calcularInteresSimpleFA(10000, 0, 30)).toBe(0);
  });
});

// ── Dispatcher: calcularMovimiento ──

describe('Dispatcher — calcularMovimiento', () => {
  const config = {
    tasaInteres: 40,
    tasaDescuento: 20,
    indiceFinal: 150,
    fechaDesdeIntereses: '2023-01-01',
  };

  test('Modo A: dispara coeficiente cuando CoeficienteCuota>0 y FechaVto <= fechaDesdeIntereses', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 100,
      FechaVto: '2022-06-15',
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.tipo).toBe('C');
    expect(result.interes).toBe(15000); // 10000 * (150/100)
  });

  test('Modo A: FechaVto igual a fechaDesdeIntereses activa coeficiente (<=)', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 100,
      FechaVto: '2023-01-01',
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.tipo).toBe('C');
    expect(result.interes).toBe(15000);
  });

  test('Modo B: cae a interés simple si CoeficienteCuota es 0', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 0,
      FechaVto: '2022-06-15',
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.tipo).toBe('T');
  });

  test('Modo B: interés simple solo para TipoMovim FA', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 0,
      FechaVto: '2024-06-15',
      TipoMovim: 'XX',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.interes).toBe(0);
  });

  test('ACTUALIZACION_COBRADO: se usa cuando Saldo <= 0', () => {
    const mov = {
      Saldo: 0,
      ACTUALIZACION_COBRADO: 250.50,
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.tipo).toBe('A');
    expect(result.interes).toBe(250.50);
  });

  test('display incluye días, tipo y coeficiente', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 100,
      FechaVto: '2022-06-15',
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.display).toMatch(/^\d+C:/);
  });

  test('maneja fechaVto nula', () => {
    const mov = {
      Saldo: 10000,
      CoeficienteCuota: 0,
      FechaVto: null,
      TipoMovim: 'FA',
    };
    const result = calcularMovimiento(mov, config);
    expect(result.dias).toBe(0);
    expect(result.interes).toBe(0);
  });
});

// ── calcularDiasMora ──

describe('calcularDiasMora', () => {
  test('calcula días correctamente para fecha pasada', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 5);
    const dias = calcularDiasMora(ayer);
    expect(dias).toBe(5);
  });

  test('retorna 0 para fecha futura', () => {
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 5);
    expect(calcularDiasMora(futuro)).toBe(0);
  });

  test('retorna 0 para fecha nula', () => {
    expect(calcularDiasMora(null)).toBe(0);
  });
});

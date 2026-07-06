/**
 * Portal de Pagos Municipal — Utils / Currency Tests
 * @description Tests unitarios para las funciones de conversión monetaria.
 *
 * Key Variables: None
 *
 * Exports: None — ejecutado por node:test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extraerNumero, extraerNumeroConSigno, formatCurrency } from './currency.js';

// ---------------------------------------------------------------------------
// extraerNumero
// ---------------------------------------------------------------------------

describe('extraerNumero', () => {
  it('parsea "$ 1.234,56" → 1234.56', () => {
    assert.strictEqual(extraerNumero('$ 1.234,56'), 1234.56);
  });

  it('parsea "$ 0,00" → 0', () => {
    assert.strictEqual(extraerNumero('$ 0,00'), 0);
  });

  it('retorna 0 para texto vacío', () => {
    assert.strictEqual(extraerNumero(''), 0);
  });

  it('parsea valores negativos → -500', () => {
    assert.strictEqual(extraerNumero('-$ 500,00'), -500);
  });
});

// ---------------------------------------------------------------------------
// extraerNumeroConSigno
// ---------------------------------------------------------------------------

describe('extraerNumeroConSigno', () => {
  it('descuento class → negativo', () => {
    const celda = {
      textContent: '$ 500,00',
      classList: { contains: (cls) => cls === 'deudas__value--discount' }
    };
    assert.strictEqual(extraerNumeroConSigno(celda), -500);
  });

  it('sin class → positivo', () => {
    const celda = {
      textContent: '$ 500,00',
      classList: { contains: () => false }
    };
    assert.strictEqual(extraerNumeroConSigno(celda), 500);
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formatea 1234.56 → "$ 1.234,56"', () => {
    assert.strictEqual(formatCurrency(1234.56), '$ 1.234,56');
  });

  it('formatea 0 → "$ 0,00"', () => {
    assert.strictEqual(formatCurrency(0), '$ 0,00');
  });

  it('formatea -500 → "-$ 500,00"', () => {
    assert.strictEqual(formatCurrency(-500), '-$ 500,00');
  });
});

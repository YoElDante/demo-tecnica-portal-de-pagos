/**
 * Portal de Pagos Municipal — Utils / Date Tests
 * @description Tests unitarios para el parseo de fechas de ordenamiento.
 *
 * Key Variables: None
 *
 * Exports: None — ejecutado por node:test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsearFechaParaOrden } from './date.js';

// ---------------------------------------------------------------------------
// parsearFechaParaOrden
// ---------------------------------------------------------------------------

describe('parsearFechaParaOrden', () => {
  it('parsea "01/12/2025" → Date(2025, 11, 1)', () => {
    const resultado = parsearFechaParaOrden('01/12/2025');
    assert.strictEqual(resultado.getFullYear(), 2025);
    assert.strictEqual(resultado.getMonth(), 11);
    assert.strictEqual(resultado.getDate(), 1);
  });

  it('parsea "30/06/2026" → Date(2026, 5, 30)', () => {
    const resultado = parsearFechaParaOrden('30/06/2026');
    assert.strictEqual(resultado.getFullYear(), 2026);
    assert.strictEqual(resultado.getMonth(), 5);
    assert.strictEqual(resultado.getDate(), 30);
  });

  it('retorna Date(0) para string vacío', () => {
    const resultado = parsearFechaParaOrden('');
    assert.strictEqual(resultado.getTime(), new Date(0).getTime());
  });

  it('fallback ISO "2025-01-15" → Date', () => {
    const resultado = parsearFechaParaOrden('2025-01-15');
    assert.strictEqual(resultado.getUTCFullYear(), 2025);
    assert.strictEqual(resultado.getUTCMonth(), 0);
    assert.strictEqual(resultado.getUTCDate(), 15);
  });
});

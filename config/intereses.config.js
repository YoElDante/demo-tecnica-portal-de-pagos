/**
 * Configuración del motor de cálculo de intereses.
 * 
 * DESC_INMUEBLE: Factor histórico de recargo municipal.
 *   Se mantiene en 1.0 porque la BD productiva (alcaldiasmlqdsmanzano)
 *   ya almacena los valores de Saldo e Importe con el factor aplicado.
 *   Validado contra CSV del escritorio: 35/35 filas coinciden (2026-07-03).
 */
const DESC_INMUEBLE = 1.0;

module.exports = {
  DESC_INMUEBLE,
};

/**
 * Modelo de la tabla dbo.DatosGenerales
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 * 
 * Columnas clave para el motor de fórmula:
 * - TasaInteres (int)
 * - TasaDescuento (int)
 * - IndiceFinal (money)
 * - FechaDesdeInt (date)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DatosGenerales = sequelize.define('DatosGenerales', {
    RazonSocial: { type: DataTypes.CHAR(48), allowNull: false },
    NombreFantasia: { type: DataTypes.STRING(48), allowNull: true },
    Direccion: { type: DataTypes.STRING(120), allowNull: true },
    Ciudad: { type: DataTypes.STRING(20), allowNull: true },
    Provincia: { type: DataTypes.STRING(20), allowNull: true },
    CodigoPostal: { type: DataTypes.CHAR(10), allowNull: true },
    Telefono: { type: DataTypes.STRING(48), allowNull: true },
    Cuit: { type: DataTypes.CHAR(13), allowNull: true },
    IngBrutos: { type: DataTypes.STRING(15), allowNull: true },
    IngBrutosAgente: { type: DataTypes.STRING(15), allowNull: true },
    MesApertura: { type: DataTypes.INTEGER, allowNull: true },
    Sucursal: { type: DataTypes.CHAR(3), allowNull: true },
    DetSucursal: { type: DataTypes.STRING(35), allowNull: true },
    FechaInicioActividades: { type: DataTypes.DATE, allowNull: true },
    SmtpServer: { type: DataTypes.STRING(100), allowNull: true },
    TipoIVA_DG: { type: DataTypes.CHAR(1), allowNull: true },
    Coordx: { type: DataTypes.STRING(22), allowNull: true },
    Coordy: { type: DataTypes.STRING(22), allowNull: true },
    ModoComFacturaDeCredito: { type: DataTypes.CHAR(3), allowNull: true },
    SmtpServer_Port: { type: DataTypes.INTEGER, allowNull: true },
    SmtpServer_UsaSSL: { type: DataTypes.BOOLEAN, allowNull: true },
    FechaPagoTotal: { type: DataTypes.DATEONLY, allowNull: true },
    DiasCuotaUnica: { type: DataTypes.INTEGER, allowNull: true },
    TasaDescuento: { type: DataTypes.INTEGER, allowNull: true },
    TasaInteres: { type: DataTypes.INTEGER, allowNull: true },
    EjercicioCerrado: { type: DataTypes.STRING(6), allowNull: true },
    CtaCheques: { type: DataTypes.STRING(4), allowNull: true },
    CtaTarjetaD: { type: DataTypes.STRING(4), allowNull: true },
    CtaPlanPagos: { type: DataTypes.STRING(4), allowNull: true },
    CtaTarjeta: { type: DataTypes.STRING(4), allowNull: true },
    CtaIntereses: { type: DataTypes.STRING(4), allowNull: true },
    CtaCaja: { type: DataTypes.STRING(4), allowNull: true },
    CtaDescuentos: { type: DataTypes.STRING(4), allowNull: true },
    CtaVentas: { type: DataTypes.STRING(4), allowNull: true },
    EjercicioActual: { type: DataTypes.STRING(6), allowNull: true },
    FechaDeCaja: { type: DataTypes.DATE, allowNull: true },
    WebPagos: { type: DataTypes.STRING(200), allowNull: true },
    Impresora: { type: DataTypes.STRING(150), allowNull: true },
    GraficoCirculo: { type: DataTypes.CHAR(100), allowNull: true },
    Feriados: { type: DataTypes.CHAR(250), allowNull: true },
    CtaAdelantosProv: { type: DataTypes.STRING(4), allowNull: true },
    ImpresoraCaja: { type: DataTypes.STRING(150), allowNull: true },
    Firmantes: { type: DataTypes.STRING(600), allowNull: true },
    IndiceFinal: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    FechaDesdeInt: { type: DataTypes.DATEONLY, allowNull: true },
  }, {
    tableName: 'DatosGenerales',
    schema: 'dbo',
    timestamps: false,
  });

  return DatosGenerales;
};

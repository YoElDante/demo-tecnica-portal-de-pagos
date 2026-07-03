/**
 * Modelo de la tabla dbo.Automotores
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 * 
 * REVIEW: cuotabasica → TIPO_PLAN mapping — verify with accountant
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Automotores = sequelize.define('Automotores', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    IDENTIFICADOR: { type: DataTypes.STRING(7), allowNull: true },
    Codigo: { type: DataTypes.STRING(7), allowNull: true },
    ID_AUTOMOTOR: { type: DataTypes.STRING(6), allowNull: true },
    TIPO_CATEGORIA_AUTOMOTOR: { type: DataTypes.STRING(2), allowNull: true },
    CIP: { type: DataTypes.STRING(10), allowNull: true },
    ANO_VALUACION: { type: DataTypes.STRING(4), allowNull: true },
    MODELO_AUTOMOTOR: { type: DataTypes.STRING(4), allowNull: true },
    NRO_MOTOR: { type: DataTypes.STRING(24), allowNull: true },
    NRO_CHASIS: { type: DataTypes.STRING(50), allowNull: true },
    CERTIFICADO_FABRICACION: { type: DataTypes.STRING(30), allowNull: true },
    NRO_ADUANA: { type: DataTypes.STRING(30), allowNull: true },
    MARCA_VEHICULO: { type: DataTypes.STRING(50), allowNull: true },
    DESCRIPCION_INDIVIDUAL: { type: DataTypes.STRING(50), allowNull: true },
    PESO_CILINDRADA: { type: DataTypes.INTEGER, allowNull: true },
    IMPORTADO: { type: DataTypes.STRING(1), allowNull: true },
    DOMINIO: { type: DataTypes.STRING(12), allowNull: true },
    VIM: { type: DataTypes.STRING(30), allowNull: true },
    TIPO_ALTA: { type: DataTypes.STRING(4), allowNull: true },
    VALOR_FACTURA: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    CARGA: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    SUBESCALA: { type: DataTypes.STRING(10), allowNull: true },
    Fecha: { type: DataTypes.DATE, allowNull: true },
    BASE_IMP_CALC: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    BASE_IMP_CALC2: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    BASE_IMPCALC2: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    BASE__IMPCALC2: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    LIQUIDA: { type: DataTypes.STRING(1), allowNull: true },
    ID_AUTOMOTORPGM: { type: DataTypes.STRING(7), allowNull: true },
    FechaAlta: { type: DataTypes.DATE, allowNull: true },
    EXENCION: { type: DataTypes.STRING(4), allowNull: true },
    Valuacion2023: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    Valuacion2024: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    FechaBaja: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'Automotores',
    schema: 'dbo',
    timestamps: false,
  });

  return Automotores;
};

/**
 * Modelo de la tabla dbo.Devengamientos
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Devengamientos = sequelize.define('Devengamientos', {
    id_devenga: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
    Descripcion_dev: { type: DataTypes.STRING(100), allowNull: true },
    Fecha_creada: { type: DataTypes.DATE, allowNull: true },
    Fecha_vto: { type: DataTypes.DATE, allowNull: true },
    Cuotas_dev: { type: DataTypes.INTEGER, allowNull: true },
    Dias_dev: { type: DataTypes.INTEGER, allowNull: true },
    Nombre_dev: { type: DataTypes.STRING(100), allowNull: false },
    Formula_dev: { type: DataTypes.STRING(200), allowNull: true },
    Memo_dev: { type: DataTypes.STRING(500), allowNull: true },
    Fecha_Cierre: { type: DataTypes.DATE, allowNull: true },
    Primer_cuota: { type: DataTypes.INTEGER, allowNull: true },
    TablaLiq: { type: DataTypes.STRING(100), allowNull: true },
  }, {
    tableName: 'Devengamientos',
    schema: 'dbo',
    timestamps: false,
  });

  return Devengamientos;
};

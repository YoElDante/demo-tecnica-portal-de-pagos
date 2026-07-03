/**
 * Modelo de la tabla dbo.ClientesCtaCteTransitoria
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientesCtaCteTransitoria = sequelize.define('ClientesCtaCteTransitoria', {
    TIPO_BIEN: { type: DataTypes.CHAR(4), allowNull: true },
    NUMERO: { type: DataTypes.CHAR(10), allowNull: true },
    Importe: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    TipoImporte: { type: DataTypes.CHAR(3), allowNull: true },
    Vencimiento: { type: DataTypes.DATEONLY, allowNull: true },
    Cuota: { type: DataTypes.CHAR(3), allowNull: true },
    Ano: { type: DataTypes.CHAR(4), allowNull: true },
  }, {
    tableName: 'ClientesCtaCteTransitoria',
    schema: 'dbo',
    timestamps: false,
  });

  return ClientesCtaCteTransitoria;
};

/**
 * Modelo de la tabla dbo.Clientes
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-10-28
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cliente = sequelize.define('Cliente', {
    Codigo: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false
    },
    NombreFantasia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DesHabilitado: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    Direccion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DirNumero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Piso: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Departamento: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Barrio: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Ciudad: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    CodigoPostal: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Fax: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Provincia: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    TipoIva: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    IvaDiferencial: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    TipoTasaIva: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    TipoGanancia: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Cuit: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    IngBrutos: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Pais: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    FechaAlta: {
      type: DataTypes.DATE,
      allowNull: true
    },
    FechaUltmod: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ClienteGrupo: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    CodigoTipo: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Sucursal: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    MaxLimCred: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    CondicionPago: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Zona: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    QListaPrecios: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    QListaOferta: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DescuentoGeneral: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    LLevaFlete: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Vendedor: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    PorcentajePercepIBTucuman: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    PercepIBTucuman: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    IDENTIFICADOR: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    CodPostalAmp: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    FechaFallecimiento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Apellido: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Nombre: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ID_COMERCIO_INDUSTRIA: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    RazonSocial: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DOCUMENTO: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Posedor: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    tableName: 'Clientes', // Ajusta al nombre real de tu tabla
    schema: 'dbo',
    timestamps: false // Si la tabla no tiene createdAt/updatedAt automáticos
  });

  return Cliente;
};
/**
 * Modelo de la tabla dbo.Clientes
 * Alineado con script_creacion_bd_ElManzano_062026.sql
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2025-10-28
 * @updated 2026-07-02 — alineación de tipos, constraints y columna nueva
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
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN — era INTEGER
      defaultValue: false
    },
    Direccion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DirNumero: {
      type: DataTypes.STRING(6),        // SQL: varchar(6)
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
      type: DataTypes.STRING(30),       // SQL: varchar(30) — era INTEGER, CORREGIDO
      allowNull: true
    },
    CodigoPostal: {
      type: DataTypes.STRING(5),        // SQL: varchar(5)
      allowNull: true
    },
    Telefono: {
      type: DataTypes.STRING(30),       // SQL: varchar(30)
      allowNull: true
    },
    Fax: {
      type: DataTypes.STRING(30),       // SQL: varchar(30)
      allowNull: true
    },
    Email: {
      type: DataTypes.STRING(120),      // SQL: varchar(120)
      allowNull: true
    },
    Provincia: {
      type: DataTypes.STRING(2),        // SQL: varchar(2)
      allowNull: true
    },
    TipoIva: {
      type: DataTypes.STRING(1),        // SQL: char(1) — era INTEGER, CORREGIDO
      allowNull: true
    },
    IvaDiferencial: {
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN — era INTEGER
      defaultValue: false
    },
    TipoTasaIva: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    TipoGanancia: {
      type: DataTypes.STRING(1),        // SQL: char(1)
      allowNull: true
    },
    Cuit: {
      type: DataTypes.STRING(13),       // SQL: varchar(13)
      allowNull: true
    },
    IngBrutos: {
      type: DataTypes.STRING(15),       // SQL: varchar(15)
      allowNull: true
    },
    Pais: {
      type: DataTypes.STRING(25),       // SQL: varchar(25)
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
      type: DataTypes.STRING(200),      // SQL: varchar(200) — era TEXT, CORREGIDO
      allowNull: true
    },
    ClienteGrupo: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    CodigoTipo: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
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
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    Zona: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    QListaPrecios: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    QListaOferta: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    DescuentoGeneral: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    LLevaFlete: {
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN — era STRING(10), CORREGIDO
      defaultValue: false
    },
    Vendedor: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    PorcentajePercepIBTucuman: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    PercepIBTucuman: {
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN — era STRING(20), CORREGIDO
      defaultValue: false
    },
    IDENTIFICADOR: {
      type: DataTypes.STRING(6),        // SQL: varchar(6) NOT NULL
      allowNull: false                  // NOT NULL — CORREGIDO
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
      type: DataTypes.STRING(100),      // SQL: varchar(100) — era 50, CORREGIDO
      allowNull: true
    },
    Nombre: {
      type: DataTypes.STRING(100),      // SQL: varchar(100) — era 50, CORREGIDO
      allowNull: true
    },
    ID_COMERCIO_INDUSTRIA: {
      type: DataTypes.STRING(6),        // SQL: varchar(6) NOT NULL
      allowNull: false                  // NOT NULL — CORREGIDO
    },
    RazonSocial: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    DOCUMENTO: {
      type: DataTypes.STRING(8),        // SQL: varchar(8) NOT NULL
      allowNull: false                  // NOT NULL — CORREGIDO
    },
    Posedor: {
      type: DataTypes.STRING(100),      // SQL: varchar(100)
      allowNull: true
    },
    Deshabilita: {
      type: DataTypes.STRING(20),       // SQL: varchar(20) — NUEVA columna
      allowNull: true
    }
  }, {
    tableName: 'Clientes', // Ajusta al nombre real de tu tabla
    schema: 'dbo',
    timestamps: false // Si la tabla no tiene createdAt/updatedAt automáticos
  });

  return Cliente;
};

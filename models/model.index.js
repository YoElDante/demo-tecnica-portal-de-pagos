/**
 * Inicializa Sequelize y carga todos los modelos.
 * Versión CommonJS para Express Generator
 * 
 * @author Dante Marcos Delprato
 * @version 2.0
 * @date 2026-07-02 — 18 nuevos modelos del dominio de deuda El Manzano
 */

// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { sequelize } = require('../config');

// ── Modelos existentes ──
const ClienteModel = require('./Cliente');
const ClientesCtaCteModel = require('./ClientesCtasCtes');
const TicketsPagoModel = require('./TicketsPago');
const TicketPagoEventosModel = require('./TicketPagoEventos');

// ── Modelos nuevos — dominio de deuda El Manzano ──
const DatosGeneralesModel = require('./DatosGenerales');
const NumeracionModel = require('./Numeracion');
const FeriadosModel = require('./Feriados');
const DevengamientosModel = require('./Devengamientos');
const ClientesCtaCteTransitoriaModel = require('./ClientesCtaCteTransitoria');
const AguaClientesModel = require('./AguaClientes');
const AguaServiciosModel = require('./AguaServicios');
const CobrosCtaCteModel = require('./CobrosCtaCte');
const CIActividadesModel = require('./CIActividades');
const CementerioServiciosModel = require('./CementerioServicios');
const AutomotoresModel = require('./Automotores');
const CatastroModel = require('./Catastro');
const MedidoresModel = require('./Medidores');
const PavimentoClientesModel = require('./PavimentoClientes');
const PavimentoServiciosModel = require('./PavimentoServicios');
const PadronBaseModel = require('./PadronBase');
const CTACTESUMModel = require('./CTACTESUM');
const ProvinciasModel = require('./Provincias');

// ── Inicializar modelos existentes ──
const Cliente = ClienteModel(sequelize);
const ClientesCtaCte = ClientesCtaCteModel(sequelize);
const TicketsPago = TicketsPagoModel(sequelize);
const TicketPagoEventos = TicketPagoEventosModel(sequelize);

// ── Inicializar modelos nuevos ──
const DatosGenerales = DatosGeneralesModel(sequelize);
const Numeracion = NumeracionModel(sequelize);
const Feriados = FeriadosModel(sequelize);
const Devengamientos = DevengamientosModel(sequelize);
const ClientesCtaCteTransitoria = ClientesCtaCteTransitoriaModel(sequelize);
const AguaClientes = AguaClientesModel(sequelize);
const AguaServicios = AguaServiciosModel(sequelize);
const CobrosCtaCte = CobrosCtaCteModel(sequelize);
const CIActividades = CIActividadesModel(sequelize);
const CementerioServicios = CementerioServiciosModel(sequelize);
const Automotores = AutomotoresModel(sequelize);
const Catastro = CatastroModel(sequelize);
const Medidores = MedidoresModel(sequelize);
const PavimentoClientes = PavimentoClientesModel(sequelize);
const PavimentoServicios = PavimentoServiciosModel(sequelize);
const PadronBase = PadronBaseModel(sequelize);
const CTACTESUM = CTACTESUMModel(sequelize);
const Provincias = ProvinciasModel(sequelize);

// ── Asociaciones existentes ──
Cliente.hasMany(ClientesCtaCte, {
  foreignKey: 'Codigo',
  sourceKey: 'Codigo',
  as: 'cuentasCorrientes'
});

ClientesCtaCte.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

TicketsPago.hasMany(TicketPagoEventos, {
  foreignKey: 'ticketId',
  sourceKey: 'ticketId',
  as: 'eventos'
});

TicketPagoEventos.belongsTo(TicketsPago, {
  foreignKey: 'ticketId',
  targetKey: 'ticketId',
  as: 'ticket'
});

// ── Asociaciones nuevas — dominio de deuda ──

// Modelos con columna Codigo → Cliente
Automotores.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

Catastro.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

AguaClientes.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

PavimentoClientes.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

CobrosCtaCte.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

// Cliente → Provincias
Cliente.belongsTo(Provincias, {
  foreignKey: 'Provincia',
  targetKey: 'Id',
  as: 'provincia'
});

// NOTE: CIActividades y ClientesCtaCteTransitoria no tienen columna Codigo.
// La asociación belongsTo(Cliente) se omite hasta confirmar la FK correcta con el contador.

// ── Exportar sequelize y todos los modelos ──
module.exports = {
  sequelize,
  Cliente,
  ClientesCtaCte,
  TicketsPago,
  TicketPagoEventos,
  DatosGenerales,
  Numeracion,
  Feriados,
  Devengamientos,
  ClientesCtaCteTransitoria,
  AguaClientes,
  AguaServicios,
  CobrosCtaCte,
  CIActividades,
  CementerioServicios,
  Automotores,
  Catastro,
  Medidores,
  PavimentoClientes,
  PavimentoServicios,
  PadronBase,
  CTACTESUM,
  Provincias,
};

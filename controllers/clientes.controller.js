/**
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2025-10-31
 */

const { Cliente, ClientesCtaCte, sequelize } = require('../models/model.index');
const { Op } = require('sequelize');

/**
 * Busca cliente por código, DNI o dominio y retorna sus deudas
 * GET /api/clientes/deudas/:codigo
 */
exports.obtenerDeudasPorCodigo = async (req, res) => {
  try {
    let codigo = req.params.codigo.trim();
    let clienteInfo = null;

    // PASO 1: Si es DNI (8 dígitos), buscar en tabla Clientes
    if (codigo.length === 8) {
      const cliente = await Cliente.findOne({
        where: { DOCUMENTO: codigo },
        attributes: ['Codigo', 'Nombre', 'Apellido']
      });

      if (!cliente) {
        return res.status(404).json({
          error: 'Cliente no encontrado',
          codigo: null,
          nombre: null,
          apellido: null,
          deudas: []
        });
      }

      // Actualizar variables con datos del cliente
      clienteInfo = {
        codigo: cliente.Codigo.trim(),
        nombre: cliente.Nombre || '',
        apellido: cliente.Apellido || ''
      };
      codigo = cliente.Codigo.trim();
    }

    // PASO 2: Determinar tipo de búsqueda en ClientesCtaCte
    let whereCondition = {};

    if (codigo.length === 7) {
      if (codigo.startsWith('00')) {
        // Buscar por código de cliente
        whereCondition = { Codigo: codigo };
      } else {
        // Buscar por dominio de auto
        whereCondition = {
          TIPO_BIEN: 'AUAU',
          Dominio: codigo
        };
      }
    } else if (codigo.length === 6) {
      // Buscar por dominio de auto
      whereCondition = {
        TIPO_BIEN: 'AUAU',
        Dominio: codigo
      };
    } else {
      // Código inválido
      return res.status(400).json({ error: 'Formato de código inválido' });
    }

    // Agregar condición de saldo pendiente
    whereCondition.Saldo = { [Op.ne]: 0 };

    // PASO 3: Buscar deudas en ClientesCtaCte
    const deudas = await ClientesCtaCte.findAll({
      where: whereCondition,
      attributes: [
        [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
        'Detalle',
        'Dominio',
        [sequelize.literal("CONVERT(VARCHAR, NRO_CUOTA) + CONVERT(VARCHAR, ANO_CUOTA) + CONVERT(VARCHAR, ID_BIEN)"), 'Cuota'],
        'Importe',
        [sequelize.literal('Importe * 0.01'), 'Descuento'],
        [sequelize.literal('Importe * 1.01'), 'Total'],
        'NRO_CUOTA',
        'ANO_CUOTA',
        'ID_BIEN',
        'IdTrans'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // PASO 4: Formatear deudas
    const deudasFormateadas = deudas.map(deuda => ({
      IdTrans: deuda.IdTrans,
      Fecha: deuda.Fecha,
      Detalle: `${deuda.Detalle} ${deuda.Dominio || ''}`.trim(),
      Cuota: deuda.Cuota || '',
      Importe: parseFloat(deuda.Importe || 0),
      Descuento: parseFloat(deuda.Descuento || 0),
      Total: parseFloat(deuda.Total || 0)
    }));

    // Respuesta
    res.json({
      codigo: clienteInfo?.codigo || codigo,
      nombre: clienteInfo?.nombre || '',
      apellido: clienteInfo?.apellido || '',
      registrosEncontrados: deudasFormateadas.length,
      deudas: deudasFormateadas
    });

  } catch (error) {
    console.error('Error en obtenerDeudasPorCodigo:', error);
    res.status(500).json({
      error: 'Error al consultar deudas',
      detalle: error.message
    });
  }
};

/**
 * Obtiene todos los clientes (con paginación)
 * GET /api/clientes?limit=50&offset=0
 */

exports.obtenerTodosClientes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { count, rows } = await Cliente.findAndCountAll({
      limit,
      offset,
      attributes: ['Codigo', 'Nombre', 'Apellido', 'DOCUMENTO', 'Email', 'Telefono'],
      order: [['Codigo', 'ASC']]
    });

    res.json({
      total: count,
      limit,
      offset,
      clientes: rows
    });

  } catch (error) {
    console.error('Error en obtenerTodosClientes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene un cliente específico por código
 * GET /api/clientes/:codigo
 */
exports.obtenerClientePorCodigo = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { Codigo: req.params.codigo }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);

  } catch (error) {
    console.error('Error en obtenerClientePorCodigo:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Genera JSON de pago a partir de IDs de transacciones seleccionadas
 * POST /api/clientes/generar-pago
 * Body: { ids: [4906, 4907, 4908] }
 */
exports.generarJsonPago = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar un array de IDs' });
    }

    const deudas = await ClientesCtaCte.findAll({
      where: {
        IdTrans: { [Op.in]: ids }
      },
      attributes: [
        [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
        'Detalle',
        'Dominio',
        [sequelize.literal("CONVERT(VARCHAR, NRO_CUOTA) + CONVERT(VARCHAR, ANO_CUOTA) + CONVERT(VARCHAR, ID_BIEN)"), 'Cuota'],
        'Importe',
        [sequelize.literal('Importe * 0.01'), 'Descuento'],
        [sequelize.literal('Importe * 1.01'), 'Total']
      ],
      raw: true
    });

    const pagos = deudas.map(deuda => ({
      Fecha: deuda.Fecha,
      Detalle: `${deuda.Detalle} ${deuda.Dominio || ''}`.trim(),
      Cuota: deuda.Cuota || '',
      Importe: parseFloat(deuda.Importe || 0),
      Descuento: parseFloat(deuda.Descuento || 0),
      Total: parseFloat(deuda.Total || 0)
    }));

    res.json({ pagos });

  } catch (error) {
    console.error('Error en generarJsonPago:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Busca un cliente por DNI y renderiza la vista con sus deudas formateadas
 * POST /buscar
 */
exports.buscarPorDni = async (req, res) => {
  try {
    const { dni } = req.body;

    // Validación básica
    if (!dni || dni.trim().length < 6) {
      return res.render('index', {
        title: 'Portal de Pagos',
        dni,
        cliente: null,
        deudas: [],
        totalGeneral: 0,
        clienteNoEncontrado: false,
        mensaje: 'Debe ingresar un DNI válido.'
      });
    }

    // 🔹 Paso 1: Buscar cliente por DNI
    const cliente = await Cliente.findOne({
      where: { DOCUMENTO: dni.trim() },
      attributes: ['Codigo', 'Nombre', 'Apellido']
    });

    if (!cliente) {
      return res.render('index', {
        title: 'Portal de Pagos',
        dni,
        cliente: null,
        deudas: [],
        totalGeneral: 0,
        clienteNoEncontrado: true, // ✅ Flag para aplicar estilos
        mensaje: null
      });
    }

    // 🔹 Paso 2: Buscar deudas con saldo pendiente
    const deudasRaw = await ClientesCtaCte.findAll({
      where: {
        Codigo: cliente.Codigo.trim(),
        Saldo: { [Op.ne]: 0 }
      },
      order: [['Fecha', 'DESC']],
      raw: true
    });

    // 🔹 Paso 3: Formatear los datos numéricos y de texto
    const deudas = deudasRaw.map(d => {
      const importe = Number(d.Importe) || 0;
      const descuento = Number((importe * 0.01).toFixed(2)); // 1% ejemplo
      const total = Number((importe - descuento).toFixed(2));

      return {
        Fecha: d.Fecha ? new Date(d.Fecha).toISOString().split('T')[0] : '',
        Detalle: d.Detalle || '',
        Cuota: d.NRO_CUOTA && d.ANO_CUOTA ? `${d.NRO_CUOTA}/${d.ANO_CUOTA}` : '',
        Importe: importe,
        Descuento: descuento,
        Total: total
      };
    });

    // 🔹 Paso 4: Calcular total general
    const totalGeneral = deudas.reduce((acc, d) => acc + d.Total, 0);

    // 🔹 Paso 5: Renderizar vista con datos listos
    res.render('index', {
      title: 'Portal de Pagos',
      dni,
      cliente,
      deudas,
      totalGeneral,
      clienteNoEncontrado: false,
      mensaje: null
    });

  } catch (error) {
    console.error('Error en buscarPorDni:', error);
    res.render('index', {
      title: 'Portal de Pagos',
      dni: req.body.dni,
      cliente: null,
      deudas: [],
      totalGeneral: 0,
      clienteNoEncontrado: false,
      mensaje: 'Error interno al buscar los datos.'
    });
  }
};


/**
 * Obtiene un cliente por DNI
 * GET /api/clientes/buscar/dni/:dni
 */
exports.obtenerClientePorDni = async (req, res) => {
  try {
    const dni = req.params.dni.trim();

    // Validación básica del DNI
    if (!dni || dni.length < 6) {
      return res.status(400).json({
        error: 'DNI inválido',
        mensaje: 'El DNI debe tener al menos 6 caracteres'
      });
    }

    // Buscar cliente por DNI
    const cliente = await Cliente.findOne({
      where: { DOCUMENTO: dni },
      attributes: ['Codigo', 'Nombre', 'Apellido', 'DOCUMENTO', 'Email', 'Telefono']
    });

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        dni
      });
    }

    // Obtener deudas del cliente
    const deudas = await ClientesCtaCte.findAll({
      where: {
        Codigo: cliente.Codigo.trim(),
        Saldo: { [Op.ne]: 0 }
      },
      attributes: [
        [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
        'Detalle',
        'Dominio',
        [sequelize.literal("CONVERT(VARCHAR, NRO_CUOTA) + CONVERT(VARCHAR, ANO_CUOTA) + CONVERT(VARCHAR, ID_BIEN)"), 'Cuota'],
        'Importe',
        [sequelize.literal('Importe * 0.01'), 'Descuento'],
        [sequelize.literal('Importe * 1.01'), 'Total']
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    res.json({
      cliente,
      deudas: deudas.map(deuda => ({
        Fecha: deuda.Fecha,
        Detalle: `${deuda.Detalle} ${deuda.Dominio || ''}`.trim(),
        Cuota: deuda.Cuota || '',
        Importe: parseFloat(deuda.Importe || 0),
        Descuento: parseFloat(deuda.Descuento || 0),
        Total: parseFloat(deuda.Total || 0)
      }))
    });

  } catch (error) {
    console.error('Error en obtenerClientePorDni:', error);
    res.status(500).json({
      error: 'Error al buscar cliente por DNI',
      mensaje: error.message
    });
  }
};

exports.listarContribuyentes = async (req, res) => {
  try {
    // Obtener límite y offset de la query para paginación
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Consulta para obtener clientes con count de deudas
    const contribuyentes = await Cliente.findAll({
      attributes: [
        'Codigo',
        'Nombre',
        'Apellido',
        'DOCUMENTO',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM ClientesCtaCte
            WHERE ClientesCtaCte.Codigo = Cliente.Codigo
            AND ClientesCtaCte.Saldo != 0
          )`),
          'cantidadDeudas'
        ]
      ],
      limit,
      offset,
      order: [['Apellido', 'ASC'], ['Nombre', 'ASC']],
      raw: true
    });

    // Formatear respuesta
    const contribuyentesFormateados = contribuyentes.map(c => ({
      codigo: c.Codigo?.trim(),
      nombreCompleto: `${c.Apellido || ''} ${c.Nombre || ''}`.trim(),
      documento: c.DOCUMENTO?.trim(),
      cantidadDeudas: parseInt(c.cantidadDeudas) || 0
    }));

    res.json({
      total: contribuyentesFormateados.length,
      limit,
      offset,
      contribuyentes: contribuyentesFormateados
    });

  } catch (error) {
    console.error('Error en listarContribuyentes:', error);
    res.status(500).json({
      error: 'Error al listar contribuyentes',
      mensaje: error.message
    });
  }
};

// Reemplaza la implementación existente de exports.buscarPorDni por esta versión
exports.buscarPorDni = async (req, res) => {
  try {
    const rawDni = String(req.body?.dni || '').trim();
    const dniValido = /^\d{7,10}$/.test(rawDni);

    if (!dniValido) {
      return res.render('index', {
        title: 'Portal de Pagos',
        dni: rawDni,
        cliente: null,
        deudas: [],
        totalGeneral: 0,
        clienteNoEncontrado: false,
        mensaje: 'El DNI debe tener entre 7 y 10 números.'
      });
    }

    const cliente = await Cliente.findOne({
      where: { DOCUMENTO: rawDni },
      attributes: ['Codigo', 'Nombre', 'Apellido']
    });

    if (!cliente) {
      return res.render('index', {
        title: 'Portal de Pagos',
        dni: rawDni,
        cliente: null,
        deudas: [],
        totalGeneral: 0,
        clienteNoEncontrado: true,
        mensaje: null
      });
    }

    const codigoCliente = cliente.Codigo.trim();
    const deudasRaw = await ClientesCtaCte.findAll({
      where: {
        Codigo: codigoCliente,
        Saldo: { [Op.ne]: 0 }
      },
      order: [['Fecha', 'DESC']],
      raw: true
    });

    const deudas = deudasRaw.map(d => {
      const importe = Number(d.Importe) || 0;
      const descuento = Number((importe * 0.01).toFixed(2));
      const total = Number((importe - descuento).toFixed(2));
      const fecha = d.Fecha ? new Date(d.Fecha).toISOString().split('T')[0] : '';

      return {
        Fecha: fecha,
        Detalle: d.Detalle || '',
        Cuota: d.NRO_CUOTA && d.ANO_CUOTA ? `${d.NRO_CUOTA}/${d.ANO_CUOTA}` : '',
        Importe: importe,
        Descuento: descuento,
        Total: total
      };
    });

    const totalGeneral = deudas.reduce((acc, item) => acc + item.Total, 0);

    return res.render('index', {
      title: 'Portal de Pagos',
      dni: rawDni,
      cliente,
      deudas,
      totalGeneral,
      clienteNoEncontrado: false,
      mensaje: null
    });

  } catch (error) {
    console.error('Error en buscarPorDni:', error);
    return res.render('index', {
      title: 'Portal de Pagos',
      dni: req.body?.dni,
      cliente: null,
      deudas: [],
      totalGeneral: 0,
      clienteNoEncontrado: false,
      mensaje: 'Error interno al buscar los datos.'
    });
  }
};
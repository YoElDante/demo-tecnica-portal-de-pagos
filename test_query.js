const { TicketsPago, ClientesCtaCte, sequelize } = require('./models/model.index');
const { Op } = require('sequelize');

async function run() {
  try {
    console.log('--- Consultando últimos 5 registros de TicketsPago ---');
    const tickets = await TicketsPago.findAll({
      where: {
        external_reference: {
          [Op.like]: 'DEMO-SIM-%'
        }
      },
      order: [['updated_at_utc', 'DESC']],
      limit: 5,
      raw: true
    });

    if (tickets.length === 0) {
      console.log('No se encontraron tickets.');
      return;
    }

    tickets.forEach(t => {
      console.log('\nTicket ID: ' + t.ticketId);
      console.log('Ticket Number: ' + t.ticketNumber);
      console.log('External Reference: ' + t.external_reference);
      console.log('Status: ' + t.status);
      console.log('Reconciliation Source: ' + t.reconciliation_source);
      console.log('ID Operacion: ' + t.id_operacion);
      console.log('NRO Operacion: ' + t.nro_operacion);
      console.log('Updated At UTC: ' + t.updated_at_utc);

      let idTransList = [];
      try {
        const payload = JSON.parse(t.payload_snapshot);
        if (payload && payload.items) {
           idTransList = payload.items.map(function(item) { return item.IdTrans || item.id_trans || item.idTrans; }).filter(function(id) { return id; });
        } else if (payload && Array.isArray(payload)) {
           idTransList = payload.map(function(item) { return item.IdTrans || item.id_trans || item.idTrans; }).filter(function(id) { return id; });
        }
      } catch (e) {
        console.log('Error parseando payload_snapshot');
      }
      
      console.log('Conceptos (IdTrans): ' + (idTransList.join(', ') || 'Ninguno found'));
      console.log('Cantidad de conceptos: ' + idTransList.length);
      t.idTransList = idTransList; 
    });

    const recentTicket = tickets[0];
    if (recentTicket && recentTicket.idTransList && recentTicket.idTransList.length > 0) {
      console.log('\n--- Consultando ClientesCtaCte para el ticket más reciente (' + recentTicket.ticketId + ') ---');
      const ctaCtes = await ClientesCtaCte.findAll({
        where: {
          IdTrans: {
            [Op.in]: recentTicket.idTransList
          }
        },
        raw: true
      });

      ctaCtes.forEach(function(cc) {
        console.log('IdTrans: ' + cc.IdTrans + ', Saldo: ' + cc.Saldo + ', EsPago: ' + cc.EsPago + ', NRO_OPERACION: ' + cc.NRO_OPERACION);
      });
    } else {
      console.log('\nNo hay IdTrans para consultar en ClientesCtaCte para el ticket más reciente.');
    }

  } catch (error) {
    console.error('Error durante la ejecución:', error);
  } finally {
    await sequelize.close();
  }
}

run();

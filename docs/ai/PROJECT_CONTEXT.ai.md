# PROJECT_CONTEXT.ai.md
# Token-optimized context for AI agents
# Format: KEY=VALUE | Sections: ## | Lists: - | Code: ```

## META
PROJECT=demo-portal-de-pago
TYPE=frontend-municipal
STACK=node+express+ejs+sequelize+mssql
INTEGRATION_TARGET=api-gateway-mp
CURRENT_PHASE=0/8
STATUS=planning_complete

## OBJECTIVE
GOAL=integrate_frontend_with_mercadopago_api_gateway
FLOW=user_selects_debts→click_pay→api_creates_preference→redirect_mp→pay→return→webhook→update_db

## FILES_CREATE
services/paymentGateway.service.js|call_api_gateway_post_/api/pagos
services/pagos.service.js|update_db_on_payment_confirmed
controllers/payment.controller.js|iniciarPago,confirmacion,pagoExitoso,pagoFallido,pagoPendiente
routes/payment.routes.js|POST_/pago/iniciar,POST_/api/pagos/confirmacion,GET_/pago/*
views/pago/exitoso.ejs|success_page+email_input
views/pago/fallido.ejs|failure_page
views/pago/pendiente.ejs|pending_page

## FILES_MODIFY
.env.example|add:API_GATEWAY_URL,MUNICIPIO_ID,FRONTEND_PUBLIC_URL
.env|configure_dev_values
app.js|register_payment_routes
views/index.ejs|change_pay_button_to_post_form_line_188

## DB_SCHEMA_RELEVANT
TABLE=ClientesCtaCte
PK=IdTrans
FILTER_PENDING=Saldo!=0
ON_PAYMENT_UPDATE=Saldo=0,FechaPago=date,NRO_OPERACION=external_ref,ESTADO_DEUDA='PAGADO'
IDEMPOTENCY_CHECK=NRO_OPERACION_exists

TABLE=Clientes
PK=Codigo
UPDATE_FIELD=Email(optional_user_choice)

## API_CONTRACT_OUT
POST=http://localhost:3000/api/pagos
BODY={municipio_id,municipio_nombre,contribuyente:{nombre,email,dni},conceptos:[{id,descripcion,monto}],monto_total,callback_url,metadata:{conceptos_ids:[]}}
RESPONSE={payment_url,sandbox_url,external_reference}

## API_CONTRACT_IN
POST=/api/pagos/confirmacion
FROM=api-gateway-mp
BODY={external_reference,status,payment_id,transaction_amount,date_approved,metadata:{conceptos_ids:[]}}
RESPONSE={received:true}
ACTION_ON_approved=update_db_saldo_0
ACTION_ON_rejected=no_db_change
ACTION_ON_pending=no_db_change

## ENV_VARS_REQUIRED
PORT=4000
API_GATEWAY_URL=http://localhost:3000
MUNICIPIO_ID=manzano
FRONTEND_PUBLIC_URL=http://localhost:4000

## PHASES
1|config_base|.env,port_4000,ngrok_docs
2|service_gateway|paymentGateway.service.js+axios
3|controller_routes|payment.controller.js+payment.routes.js+app.js
4|views|views/pago/*.ejs
5|webhook_endpoint|POST_/api/pagos/confirmacion
6|db_update|pagos.service.js+Saldo=0
7|email_mgmt|input+checkbox+Cliente.Email_update
8|testing|e2e_flow_with_ngrok

## CURRENT_PAY_BUTTON
FILE=views/index.ejs
LINE=188
CURRENT=<a href="https://mercadopago.com.ar">
TARGET=<form action="/pago/iniciar" method="POST">+hidden_fields

## DATA_FLOW
1.user_clicks_pay→2.frontend_collects_conceptos_ids→3.POST_api_gateway→4.receive_payment_url→5.redirect_user_to_mp→6.user_pays→7.mp_redirects_to_/pago/exitoso→8.webhook_async_to_api→9.api_POST_/api/pagos/confirmacion→10.frontend_updates_db

## IDTRANS_HANDLING
STRATEGY=metadata_roundtrip
SEND=metadata.conceptos_ids=[IdTrans_array]
RECEIVE=same_in_webhook_response
USE=WHERE_IdTrans_IN(ids)

## DEV_SETUP
API_PORT=3000
FRONTEND_PORT=4000
NGROK_TUNNELS=2(one_each)
TEST_CARDS=5031755734530604(approved),4509953566233704(rejected)

## DOCS_REFERENCE
FULL_PLAN=docs/objetivos/PLAN_INTEGRACION_MERCADOPAGO.md
API_INSTRUCTIONS=docs/objetivos/instrucciones.md
STATUS=docs/ai/STATUS.md

## NEXT_ACTION
PHASE=1
TASK=update_.env.example+configure_.env+verify_port_4000

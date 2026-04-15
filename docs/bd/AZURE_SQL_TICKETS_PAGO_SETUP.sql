/*
AZURE_SQL_TICKETS_PAGO_SETUP.sql

Objetivo:
- Crear estructura de tracking de tickets de pago en Azure SQL (Microsoft SQL Server).
- Soportar idempotencia de webhook, conciliacion y purga controlada.

Politica operativa definida:
- El ticket se guarda al presionar "Ir a pagar".
- Vigencia operativa hasta las 23:59:59 del dia de emision (hora local definida por app/gateway).
- Retencion maxima de tickets no pagados: 45 dias corridos.
- Los tickets pagados (APROBADO) NO se purgan automaticamente.
- El redirect del usuario NO confirma pago.

Como ejecutar:
1) Conectarse a la BD existente (SSMS/Azure Data Studio/sqlcmd).
2) Ejecutar este script completo.
3) Programar ejecucion periodica de:
   - dbo.sp_TicketsPago_MarcarExpirados
   - dbo.sp_TicketsPago_PurgarNoPagados @DiasRetencionNoPagados = 45

Nota:
- En Azure SQL Database, la planificacion se hace con Azure Automation, Elastic Jobs o job externo.
*/

SET XACT_ABORT ON;
GO

/* =========================================================
   0) Modo opcional de recreacion total
   - Usar solo si una ejecucion previa quedo incompleta.
   - Cambiar @ForceRecreate = 1 para limpiar y recrear.
   ========================================================= */
DECLARE @ForceRecreate BIT = 0;

IF @ForceRecreate = 1
BEGIN
    IF OBJECT_ID('dbo.vw_TicketsPagoResumen', 'V') IS NOT NULL DROP VIEW dbo.vw_TicketsPagoResumen;
    IF OBJECT_ID('dbo.sp_TicketsPago_PurgarNoPagados', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_TicketsPago_PurgarNoPagados;
    IF OBJECT_ID('dbo.sp_TicketsPago_MarcarExpirados', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_TicketsPago_MarcarExpirados;
    IF OBJECT_ID('dbo.TR_TicketsPago_set_updated_at', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_TicketsPago_set_updated_at;
    IF OBJECT_ID('dbo.TicketPagoEventos', 'U') IS NOT NULL DROP TABLE dbo.TicketPagoEventos;
    IF OBJECT_ID('dbo.TicketsPago', 'U') IS NOT NULL DROP TABLE dbo.TicketsPago;
END;
GO

/* =========================================================
   1) TABLA PRINCIPAL: TicketsPago
   ========================================================= */
IF OBJECT_ID('dbo.TicketsPago', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TicketsPago
    (
        ticket_id BIGINT IDENTITY(1,1) NOT NULL,
        ticket_number NVARCHAR(64) NOT NULL,
        municipio_id NVARCHAR(50) NOT NULL,
        dni NVARCHAR(20) NOT NULL,

        external_reference NVARCHAR(120) NULL,
        gateway_provider NVARCHAR(30) NOT NULL,
        status NVARCHAR(20) NOT NULL,

        issued_at_utc DATETIME2(0) NOT NULL CONSTRAINT DF_TicketsPago_issued_at_utc DEFAULT SYSUTCDATETIME(),
        expires_at_utc DATETIME2(0) NOT NULL,
        retain_until_utc DATETIME2(0) NOT NULL,

        amount_total DECIMAL(18,2) NOT NULL,
        currency_code CHAR(3) NOT NULL CONSTRAINT DF_TicketsPago_currency_code DEFAULT 'ARS',

        id_operacion NVARCHAR(120) NULL,
        nro_operacion NVARCHAR(120) NULL,

        reconciliation_source NVARCHAR(30) NULL,
        retry_count INT NOT NULL CONSTRAINT DF_TicketsPago_retry_count DEFAULT 0,

        last_gateway_event_at_utc DATETIME2(0) NULL,
        paid_at_utc DATETIME2(0) NULL,

        payload_snapshot NVARCHAR(MAX) NULL,

        created_at_utc DATETIME2(0) NOT NULL CONSTRAINT DF_TicketsPago_created_at_utc DEFAULT SYSUTCDATETIME(),
        updated_at_utc DATETIME2(0) NOT NULL CONSTRAINT DF_TicketsPago_updated_at_utc DEFAULT SYSUTCDATETIME(),

        row_version ROWVERSION NOT NULL,

        CONSTRAINT PK_TicketsPago PRIMARY KEY CLUSTERED (ticket_id),
        CONSTRAINT CK_TicketsPago_status CHECK (status IN ('CREADO','PENDIENTE','APROBADO','RECHAZADO','EXPIRADO','CONCILIANDO')),
        CONSTRAINT CK_TicketsPago_gateway_provider CHECK (gateway_provider IN ('SIRO','PAGOTIC','MERCADOPAGO','ARGENPAGO','OTRO')),
        CONSTRAINT CK_TicketsPago_reconciliation_source CHECK (
            reconciliation_source IS NULL OR reconciliation_source IN ('WEBHOOK_INMEDIATO','CONCILIACION','MANUAL')
        ),
        CONSTRAINT CK_TicketsPago_amount_total CHECK (amount_total > 0),
        CONSTRAINT CK_TicketsPago_retain_until CHECK (retain_until_utc >= issued_at_utc)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_TicketsPago_ticket_number' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketsPago_ticket_number
        ON dbo.TicketsPago(ticket_number);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_TicketsPago_external_reference' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketsPago_external_reference
        ON dbo.TicketsPago(external_reference)
        WHERE external_reference IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_TicketsPago_id_operacion' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketsPago_id_operacion
        ON dbo.TicketsPago(id_operacion)
        WHERE id_operacion IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_TicketsPago_nro_operacion' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketsPago_nro_operacion
        ON dbo.TicketsPago(nro_operacion)
        WHERE nro_operacion IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_TicketsPago_status_expires' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TicketsPago_status_expires
        ON dbo.TicketsPago(status, expires_at_utc)
        INCLUDE (ticket_number, municipio_id, external_reference, amount_total);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_TicketsPago_retain_until' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TicketsPago_retain_until
        ON dbo.TicketsPago(retain_until_utc, status)
        INCLUDE (ticket_number, external_reference);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_TicketsPago_municipio_dni_status' AND object_id = OBJECT_ID('dbo.TicketsPago')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TicketsPago_municipio_dni_status
        ON dbo.TicketsPago(municipio_id, dni, status)
        INCLUDE (ticket_number, issued_at_utc, expires_at_utc, amount_total);
END;
GO

/* =========================================================
   2) TABLA DE EVENTOS: TicketPagoEventos
   ========================================================= */
IF OBJECT_ID('dbo.TicketPagoEventos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TicketPagoEventos
    (
        event_id BIGINT IDENTITY(1,1) NOT NULL,
        ticket_id BIGINT NOT NULL,

        event_type NVARCHAR(40) NOT NULL,
        event_source NVARCHAR(30) NOT NULL,
        idempotency_key NVARCHAR(180) NULL,

        external_event_id NVARCHAR(180) NULL,
        process_result NVARCHAR(20) NULL,
        error_message NVARCHAR(1000) NULL,

        payload_json NVARCHAR(MAX) NULL,

        received_at_utc DATETIME2(0) NOT NULL CONSTRAINT DF_TicketPagoEventos_received_at_utc DEFAULT SYSUTCDATETIME(),
        processed_at_utc DATETIME2(0) NULL,

        CONSTRAINT PK_TicketPagoEventos PRIMARY KEY CLUSTERED (event_id),
        CONSTRAINT FK_TicketPagoEventos_TicketsPago FOREIGN KEY (ticket_id) REFERENCES dbo.TicketsPago(ticket_id),
        CONSTRAINT CK_TicketPagoEventos_source CHECK (event_source IN ('GATEWAY_WEBHOOK','GATEWAY_CONCILIACION','PORTAL_MANUAL')),
        CONSTRAINT CK_TicketPagoEventos_result CHECK (
            process_result IS NULL OR process_result IN ('APLICADO','DUPLICADO','IGNORADO','ERROR')
        )
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_TicketPagoEventos_idempotency_key' AND object_id = OBJECT_ID('dbo.TicketPagoEventos')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketPagoEventos_idempotency_key
        ON dbo.TicketPagoEventos(idempotency_key)
        WHERE idempotency_key IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_TicketPagoEventos_ticket_received' AND object_id = OBJECT_ID('dbo.TicketPagoEventos')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TicketPagoEventos_ticket_received
        ON dbo.TicketPagoEventos(ticket_id, received_at_utc DESC)
        INCLUDE (event_type, event_source, process_result);
END;
GO

/* =========================================================
   3) Trigger updated_at_utc
   ========================================================= */
IF OBJECT_ID('dbo.TR_TicketsPago_set_updated_at', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER dbo.TR_TicketsPago_set_updated_at;
END;
GO

CREATE TRIGGER dbo.TR_TicketsPago_set_updated_at
ON dbo.TicketsPago
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE t
    SET updated_at_utc = SYSUTCDATETIME()
    FROM dbo.TicketsPago t
    INNER JOIN inserted i ON i.ticket_id = t.ticket_id;
END;
GO

/* =========================================================
   4) SP: Expirar tickets operativos vencidos (solo no pagados)
   ========================================================= */
IF OBJECT_ID('dbo.sp_TicketsPago_MarcarExpirados', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_TicketsPago_MarcarExpirados;
END;
GO

CREATE PROCEDURE dbo.sp_TicketsPago_MarcarExpirados
    @NowUtc DATETIME2(0) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @NowUtc IS NULL SET @NowUtc = SYSUTCDATETIME();

    UPDATE dbo.TicketsPago
    SET status = 'EXPIRADO'
    WHERE status IN ('CREADO', 'PENDIENTE', 'CONCILIANDO')
      AND status <> 'APROBADO'
      AND expires_at_utc < @NowUtc;

    SELECT @@ROWCOUNT AS tickets_expirados;
END;
GO

/* =========================================================
   5) SP: Purga segura de NO pagados (45 dias por defecto)
   ========================================================= */
IF OBJECT_ID('dbo.sp_TicketsPago_PurgarNoPagados', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_TicketsPago_PurgarNoPagados;
END;
GO

CREATE PROCEDURE dbo.sp_TicketsPago_PurgarNoPagados
    @DiasRetencionNoPagados INT = 45,
    @NowUtc DATETIME2(0) = NULL,
    @DryRun BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @NowUtc IS NULL SET @NowUtc = SYSUTCDATETIME();

    DECLARE @FechaCorte DATETIME2(0) = DATEADD(DAY, -@DiasRetencionNoPagados, @NowUtc);

    ;WITH PurgeCandidates AS
    (
        SELECT t.ticket_id
        FROM dbo.TicketsPago t
        WHERE t.created_at_utc < @FechaCorte
          AND t.status IN ('CREADO', 'PENDIENTE', 'RECHAZADO', 'EXPIRADO', 'CONCILIANDO')
          AND t.status <> 'APROBADO'
    )
    SELECT COUNT(1) AS candidate_tickets
    FROM PurgeCandidates;

    IF @DryRun = 1
    BEGIN
        RETURN;
    END;

    ;WITH PurgeCandidates AS
    (
        SELECT t.ticket_id
        FROM dbo.TicketsPago t
        WHERE t.created_at_utc < @FechaCorte
          AND t.status IN ('CREADO', 'PENDIENTE', 'RECHAZADO', 'EXPIRADO', 'CONCILIANDO')
          AND t.status <> 'APROBADO'
    )
    DELETE e
    FROM dbo.TicketPagoEventos e
    INNER JOIN PurgeCandidates c ON c.ticket_id = e.ticket_id;

    ;WITH PurgeCandidates AS
    (
        SELECT t.ticket_id
        FROM dbo.TicketsPago t
        WHERE t.created_at_utc < @FechaCorte
          AND t.status IN ('CREADO', 'PENDIENTE', 'RECHAZADO', 'EXPIRADO', 'CONCILIANDO')
          AND t.status <> 'APROBADO'
    )
    DELETE t
    FROM dbo.TicketsPago t
    INNER JOIN PurgeCandidates c ON c.ticket_id = t.ticket_id;

    SELECT @@ROWCOUNT AS deleted_tickets;
END;
GO

/* =========================================================
   6) Vista de seguimiento operativo
   ========================================================= */
IF OBJECT_ID('dbo.vw_TicketsPagoResumen', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_TicketsPagoResumen;
END;
GO

CREATE VIEW dbo.vw_TicketsPagoResumen
AS
SELECT
    t.ticket_id,
    t.ticket_number,
    t.municipio_id,
    t.dni,
    t.external_reference,
    t.gateway_provider,
    t.status,
    t.issued_at_utc,
    t.expires_at_utc,
    t.paid_at_utc,
    t.amount_total,
    t.currency_code,
    t.id_operacion,
    t.nro_operacion,
    t.reconciliation_source,
    t.retry_count,
    t.created_at_utc,
    t.updated_at_utc
FROM dbo.TicketsPago t;
GO

/* =========================================================
   7) Validacion estructural minima (fail-fast)
   ========================================================= */
IF OBJECT_ID('dbo.TicketsPago', 'U') IS NULL
    THROW 50001, 'ERROR: No existe dbo.TicketsPago luego del setup.', 1;

IF OBJECT_ID('dbo.TicketPagoEventos', 'U') IS NULL
    THROW 50002, 'ERROR: No existe dbo.TicketPagoEventos luego del setup.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'ticket_id') IS NULL
    THROW 50003, 'ERROR: Falta columna dbo.TicketsPago.ticket_id.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'ticket_number') IS NULL
    THROW 50004, 'ERROR: Falta columna dbo.TicketsPago.ticket_number.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'gateway_provider') IS NULL
    THROW 50005, 'ERROR: Falta columna dbo.TicketsPago.gateway_provider.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'status') IS NULL
    THROW 50006, 'ERROR: Falta columna dbo.TicketsPago.status.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'external_reference') IS NULL
    THROW 50007, 'ERROR: Falta columna dbo.TicketsPago.external_reference.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'id_operacion') IS NULL
    THROW 50008, 'ERROR: Falta columna dbo.TicketsPago.id_operacion.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'nro_operacion') IS NULL
    THROW 50009, 'ERROR: Falta columna dbo.TicketsPago.nro_operacion.', 1;

IF COL_LENGTH('dbo.TicketsPago', 'created_at_utc') IS NULL
    THROW 50010, 'ERROR: Falta columna dbo.TicketsPago.created_at_utc.', 1;

IF COL_LENGTH('dbo.TicketPagoEventos', 'event_id') IS NULL
    THROW 50011, 'ERROR: Falta columna dbo.TicketPagoEventos.event_id.', 1;

IF COL_LENGTH('dbo.TicketPagoEventos', 'ticket_id') IS NULL
    THROW 50012, 'ERROR: Falta columna dbo.TicketPagoEventos.ticket_id.', 1;

IF COL_LENGTH('dbo.TicketPagoEventos', 'idempotency_key') IS NULL
    THROW 50013, 'ERROR: Falta columna dbo.TicketPagoEventos.idempotency_key.', 1;

/* =========================================================
   8) Validacion rapida
   ========================================================= */
SELECT TOP (1) * FROM dbo.TicketsPago;
SELECT TOP (1) * FROM dbo.TicketPagoEventos;

/*
Uso recomendado post-deploy:

A) Expirar tickets vencidos (cada 10-15 min):
   EXEC dbo.sp_TicketsPago_MarcarExpirados;

B) Purga diaria (primero dry-run):
   EXEC dbo.sp_TicketsPago_PurgarNoPagados @DiasRetencionNoPagados = 45, @DryRun = 1;

C) Purga real:
   EXEC dbo.sp_TicketsPago_PurgarNoPagados @DiasRetencionNoPagados = 45, @DryRun = 0;
*/

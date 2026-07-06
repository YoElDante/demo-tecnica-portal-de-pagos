# Especificacion: Modal de Redireccion al Pago

## Objetivo

Definir el comportamiento del modal de overlay que se muestra al contribuyente al iniciar el flujo de pago, proporcionando retroalimentacion visual (spinner + mensaje) mientras se redirige a la plataforma de pago externa.

## Requisitos

### Requirement: Visualizacion del modal al iniciar pago

El sistema DEBE mostrar un modal centrado con spinner animado y mensaje de redireccion inmediatamente despues de que el contribuyente haga clic en el boton "Ir a Pagar" y antes de enviar el POST a `/pago/iniciar`.

#### Scenario: Ruta feliz — modal aparece antes del POST

- **GIVEN** un contribuyente con deudas seleccionadas en la vista principal
- **WHEN** hace clic en el boton "Ir a Pagar"
- **THEN** el modal se muestra con spinner CSS animado y mensaje "Redirigiendo a la pasarela de pago..."
- **AND** el POST a `/pago/iniciar` se ejecuta despues de mostrar el modal

#### Scenario: Botones deshabilitados durante el proceso

- **GIVEN** el modal esta visible tras clic en "Ir a Pagar"
- **WHEN** el modal esta activo
- **THEN** el boton "Ir a Pagar" queda deshabilitado para evitar doble envio

### Requirement: Backdrop oscurecedor no interactivo

El sistema DEBE renderizar un backdrop semi-opaco que cubra toda la ventana y bloquee la interaccion con el contenido subyacente.

#### Scenario: Backdrop bloquea clicks al fondo

- **GIVEN** el modal esta visible con su backdrop
- **WHEN** el usuario hace clic en cualquier elemento fuera del modal
- **THEN** el click no produce ninguna accion en el contenido subyacente

#### Scenario: Backdrop no cierra el modal

- **GIVEN** el modal esta visible
- **WHEN** el usuario hace clic en el area del backdrop
- **THEN** el modal permanece abierto (no es cancelable por el usuario)

### Requirement: Spinner CSS animado

El sistema DEBE incluir un spinner implementado exclusivamente con CSS (sin dependencias externas) que gire continuamente mientras el modal esta activo.

#### Scenario: Spinner visible y animado

- **GIVEN** el modal esta visible
- **WHEN** el contribuyente observa el modal
- **THEN** ve un spinner CSS con animacion de rotacion continua

### Requirement: Aviso de pasarela de pruebas

El sistema DEBE mostrar siempre un aviso indicando que la pasarela es de pruebas, en todos los municipios y todos los entornos (produccion, desarrollo, demo). Este comportamiento es temporario y se ajustara cuando las pasarelas pasen a produccion real.

#### Scenario: Aviso visible en cualquier entorno

- **GIVEN** cualquier municipio y cualquier valor de `NODE_ENV`
- **WHEN** el modal se renderiza
- **THEN** se muestra el texto "La pasarela de pago es de pruebas" dentro del modal

### Requirement: Accesibilidad basica del modal

El sistema DEBE incluir atributos ARIA que identifiquen el modal como dialogo y comuniquen su contenido a tecnologias de asistencia.

#### Scenario: Atributos de dialogo presentes

- **GIVEN** el modal renderizado en el DOM
- **WHEN** un lector de pantalla inspecciona el modal
- **THEN** el elemento contenedor tiene `role="dialog"` y `aria-modal="true"`

#### Scenario: Contenido anunciado dinamicamente

- **GIVEN** el modal visible
- **WHEN** el contenido del modal cambia (spinner, mensajes)
- **THEN** la region con `aria-live="polite"` anuncia los cambios al lector de pantalla

#### Scenario: Focus trap activo

- **GIVEN** el modal esta abierto
- **WHEN** el usuario navega con Tab o Shift+Tab
- **THEN** el foco permanece dentro del modal y no escapa al contenido subyacente

### Requirement: Cierre del modal solo en error

El sistema DEBE cerrar el modal y rehabilitar los botones unicamente cuando el POST a `/pago/iniciar` retorne un error. En caso de exito, el redirect del navegador reemplaza la pagina y el cierre es implicito.

#### Scenario: Cierre por error de red o servidor

- **GIVEN** el modal visible tras clic en "Ir a Pagar"
- **WHEN** el POST a `/pago/iniciar` responde con error (HTTP 4xx/5xx o fallo de red)
- **THEN** el modal se cierra, el backdrop desaparece y el boton "Ir a Pagar" se rehabilita

#### Scenario: Cierre por timeout de respaldo

- **GIVEN** el modal visible y el POST en curso
- **WHEN** transcurren mas de 30 segundos sin respuesta
- **THEN** el modal se cierra automaticamente y el boton se rehabilita

#### Scenario: No hay cierre por Escape

- **GIVEN** el modal visible
- **WHEN** el usuario presiona la tecla Escape
- **THEN** el modal permanece abierto (no es cancelable por teclado)

### Requirement: Compatibilidad multi-municipio

El sistema DEBE funcionar identicamente para todos los municipios sin hardcodear nombres, logos, colores ni textos especificos de un municipio en el markup del modal.

#### Scenario: Modal funciona en cualquier municipio

- **GIVEN** el portal configurado con cualquier municipio valido
- **WHEN** el contribuyente inicia un pago
- **THEN** el modal se muestra con estilos y textos genericos (sin branding del municipio)

### Requirement: Convivencia con qr-container

El sistema DEBE coexistir con el componente `qr-container` existente sin modificar su comportamiento ni su markup.

#### Scenario: qr-container sin cambios tras agregar modal

- **GIVEN** el `qr-container` funcional en la vista
- **WHEN** se agrega el modal de redireccion al codigo
- **THEN** el `qr-container` sigue renderizandose y funcionando sin modificaciones

## Fuentes

- `openspec/changes/payment-redirect-modal/proposal.md`
- `public/javascripts/modules/pago/init.js`
- `views/index.ejs`
- `public/stylesheets/styles.css`

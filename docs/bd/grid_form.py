import reflex as rx
import pyodbc
import os
from dotenv import load_dotenv
from contextlib import contextmanager
import json 
import asyncio
import httpx

load_dotenv()

# ----------------------------------------------------------
# Clases de Datos y Lógica de Procesamiento
# ----------------------------------------------------------
class ClienteData(rx.Base):
    Fecha: str
    Detalle: str
    Cuota: str
    Importe: float
    Descuento: float
    Total: float

class ProcesadorPagos:
    """Clase dedicada al manejo de pagos HTTP"""
    def __init__(self):
        self.json_pago: Optional[dict] = None
        self.resultado: Optional[str] = None
        self.error: Optional[str] = None

    async def enviar_pago(self) -> None:
        """Envía el pago a la API."""
        self.error = None
        self.resultado = None
        
        if not self.json_pago:
            self.error = "JSON de pago no generado"
            return

        print(self.json_pago)
        
        try:
            async with asyncio.timeout(10):
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url="TU_ENDPOINT_API_AQUI",
                        json=self.json_pago,
                        timeout=20.0
                    )
                    response.raise_for_status()
                    self.resultado = "Pago procesado exitosamente!"

        except TimeoutError:
            self.error = "Timeout: Operación excedió 10 segundos"
        except httpx.HTTPStatusError as e:
            self.error = f"Error HTTP {e.response.status_code}"
        except Exception as e:
            self.error = f"Error inesperado: {str(e)}"

# ----------------------------------------------------------
# Estado de la Aplicación
# ----------------------------------------------------------
class GridFormState(rx.State):
    codigo: str = ""
    nombre: str = ""
    apellido: str = ""
    data: list[ClienteData] = []
    resultado: str = ""
    error: str = ""
    selected_rows: set[int] = set()
    json_pago: str = ""

    async def enviar_pago(self):
        """Manejador del evento de envío de pago"""
        if not self.json_pago:
            self.error = "Genere primero el JSON de pago"
            return

        # Usa la clase ProcesadorPagos (ahora disponible globalmente)
        procesador = ProcesadorPagos()
        procesador.json_pago = json.loads(self.json_pago)

        try:
            await procesador.enviar_pago()
            self.resultado = procesador.resultado or ""
            self.error = procesador.error or ""
        except Exception as e:
            self.error = f"Error al procesar pago: {str(e)}"

    def generar_json_pago(self):
        """Genera el JSON a partir de filas seleccionadas"""
        if not self.selected_rows:
            self.error = "Seleccione al menos una cuota"
            return

        pagos = []
        for idx in self.selected_rows:
            if idx < len(self.data):
                registro = self.data[idx]
                pagos.append({
                    "Fecha": registro.Fecha,
                    "Detalle": registro.Detalle,
                    "Cuota": registro.Cuota,
                    "Importe": registro.Importe,
                    "Descuento": registro.Descuento,
                    "Total": registro.Total
                })
        
        self.json_pago = json.dumps({"pagos": pagos}, indent=2)
        self.error = ""
            
  
  


    class ProcesadorPagos:
        def __init__(self):
            self.json_pago: Optional[dict] = None
            self.resultado: Optional[str] = None
            self.error: Optional[str] = None

        async def enviar_pago(self) -> None:
            
            """Envía el pago a la API (sin manejar UI/State)."""
            """
            Envía un pago a través de una API REST utilizando timeout nativo de asyncio.
            
            Maneja diferentes tipos de errores:
            - Timeout de la operación
            - Errores HTTP
            - Errores generales
            """
            self.error = None
            self.resultado = None
            
            if not self.json_pago:
                self.error = "Genere primero el JSON de pago"
                return

            try:
                async with asyncio.timeout(10):  # Timeout nativo de Python 3.11
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            url="TU_ENDPOINT_API_AQUI",
                            json=self.json_pago,  # Asume que self.json_pago ya es un dict
                            timeout=20.0  # Timeout específico para la solicitud HTTP
                        )
                        response.raise_for_status()
                        self.resultado = "Pago procesado exitosamente!"

            except TimeoutError:
                self.error = "Timeout: La operación tardó más de 10 segundos"
                
            except httpx.HTTPStatusError as e:
                error_details = {
                    "status": e.response.status_code,
                    "message": json.loads(e.response.text).get("error", "Sin mensaje de error")
                }
                self.error = f"Error HTTP {error_details['status']}: {error_details['message']}"
                
            except json.JSONDecodeError as e:
                self.error = f"Error en formato JSON: {str(e)}"
                
            except Exception as e:
                self.error = f"Error inesperado: {str(e)}"
  
            
            
        

    def actualizar_datos_desde_db(self):
        if not self.codigo.strip():
            self.error = "Por favor ingrese un código"
            return
        cod = self.codigo.strip()
        
        if len(cod) == 8:
            try:
                with db_connection() as conn:
                    cursor = conn.cursor()
                    query = """
                        SELECT Codigo, Nombre, Apellido
                        FROM Clientes
                        WHERE DOCUMENTO = ?
                    """
                    cursor.execute(query, (cod))
                    row = cursor.fetchone()
                    
                    if row:
                        cod  = str(row[0].strip())  # Primera columna: Codigo
                        self.nombre = str(row[1]) if row[1] else ""
                        self.apellido = str(row[2]) if row[2] else ""
                    else:
                        self.codigo = ""
                        self.nombre = ""
                        self.apellido = ""
                        self.error = "Cliente no encontrado"
            
            except Exception as e:
                self.error = f"Error: {str(e)}"
                                                
       # print(cod,len(cod))
        if len(cod) == 7:
            if cod[:2] == '00':
                quebusca = "Codigo = ? "
            else:
                quebusca = "TIPO_BIEN = 'AUAU' and Dominio = ?"
        else:
            if len(cod) == 6:
                quebusca = "TIPO_BIEN = 'AUAU' and Dominio = ?"
                
        if not cod:
            self.error = "Por favor ingrese un código"
            return
            
        try:
            with db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        CONVERT(VARCHAR(10), Fecha, 120) as Fecha,
                        Detalle,Dominio,
                        CONVERT(VARCHAR, NRO_CUOTA) + CONVERT(VARCHAR, ANO_CUOTA) +  CONVERT(VARCHAR, ID_BIEN) as Cuota,
                        Importe,
                        Importe * 0.01 as Descuento,
                        Importe * 1.01 as Total
                    FROM Clientesctacte
                    WHERE {quebusca}  AND Saldo <> 0
                    ORDER BY Fecha DESC
                """
                
              #  print(query)
                cursor.execute(query, (cod))
                
                self.data = [
                    ClienteData(
                        Fecha=row.Fecha,
                        Detalle = f"{row.Detalle} {row.Dominio if row.Dominio is not None else ''}".strip(),
                        Cuota=row.Cuota or "",
                        Importe=float(row.Importe) if row.Importe else 0.0,
                        Descuento=float(row.Descuento) if row.Descuento else 0.0,
                        Total=float(row.Total) if row.Total else 0.0
                    ) for row in cursor.fetchall()
                ]
                
                self.resultado = f"Registros encontrados: {self.data_length}"
                self.error = ""
                self.selected_rows = set()

        except Exception as e:
            self.error = f"Error: {str(e)}"
            self.resultado = ""
    
    def toggle_row(self, index: int):
        new_set = set(self.selected_rows)
        if index in new_set:
            new_set.remove(index)
        else:
            new_set.add(index)
        self.selected_rows = new_set
    
    @rx.var
    def data_length(self) -> int:
        return len(self.data)
    
    @rx.var
    def selected_count(self) -> int:
        return len(self.selected_rows)
    
    @rx.var
    def total_importe(self) -> str:
        total = sum(row.Importe for i, row in enumerate(self.data) if i in self.selected_rows)
        return f"${total:,.2f}"
    
    @rx.var
    def total_descuento(self) -> str:
        total = sum(row.Descuento for i, row in enumerate(self.data) if i in self.selected_rows)
        return f"${total:,.2f}"
    
    @rx.var
    def total_general(self) -> str:
        total = sum(row.Total for i, row in enumerate(self.data) if i in self.selected_rows)
        return f"${total:,.2f}"
    
    def limpiar_tabla(self):
        self.codigo = ""
        self.data = []
        self.resultado = ""
        self.error = ""
        self.selected_rows = set()
        self.json_pago = ""
        self.nombre = ""
        self.apellido = ""
        
       


def GridForm() -> rx.Component:
    return rx.box(
        rx.box(
            rx.vstack(
                rx.hstack(
                    rx.input(
                        placeholder="Ingrese código (ej: 0000045)",
                        value=GridFormState.codigo,
                        on_change=GridFormState.set_codigo,
                        width="300px",
                        margin_right="1em"
                    ),
                    rx.button(
                        "Consultar Cuotas",
                        on_click=GridFormState.actualizar_datos_desde_db,
                        color_scheme="grass",
                        size="3",
                    ),
                    rx.button(
                        "Limpiar Búsqueda",
                        on_click=GridFormState.limpiar_tabla,
                        color_scheme="red",
                        size="3",
                    ),
                    rx.button(
                        "Confirmar Elección",
                        on_click=GridFormState.generar_json_pago,
                        color_scheme="purple",
                        size="3",
                        margin_left="auto",
                        margin_right="2em"
                    ),
                        rx.button(
                        "Enviar Pago",
                        on_click=GridFormState.enviar_pago,  # Ahora existe en el State
                        color_scheme="green",
                        size="3",
                        margin_left="1em"
                    ),
                    rx.image(src = "logomuni.png"),
                    align="center",
                    spacing="3",
                    padding="1em"
                ),
                rx.vstack(
                    rx.center(
                    rx.text("Aqui puede consultar y luego transferir a la Cuenta de Municipio/Comuna")
                ),
                ),
                rx.divider(),
                width="100%",
                background="white",
                box_shadow="lg"
            ),
            position="fixed",
            width="100%",
            top="0",
            z_index="1000",
            background="white"
        ),
            rx.cond(
                GridFormState.json_pago != "",
                rx.box(
                    rx.heading("Datos para el Pago:", size="5", margin_y="1em"),
                    rx.code_block(
                        GridFormState.json_pago,
                        language="json",
                        theme="dark",
                        width="100%",
                        margin_bottom="3em"
                    ),
                    padding_x="2em"
                )
            ),
        rx.box(
            # Titulo del cliente
            rx.cond(
                (GridFormState.nombre != "") | (GridFormState.apellido != ""),
                rx.heading(
                    rx.cond(
                        (GridFormState.nombre != "") & (GridFormState.apellido != ""),
                        f"{GridFormState.nombre} {GridFormState.apellido}",
                        rx.cond(
                            GridFormState.nombre != "",
                            GridFormState.nombre,
                            GridFormState.apellido
                        )
                    ),
                    size="4",
                    color="green.700",
                    margin_y="1em",
                    padding_x="2em"
                ),
            ),
            rx.vstack(
                rx.table.root(
                    rx.table.header(
                        rx.table.row(
                            rx.table.column_header_cell("✓", width="50px"),
                            rx.table.column_header_cell("Fecha", width="120px"),
                            rx.table.column_header_cell("Detalle", width="250px"),
                            rx.table.column_header_cell("Cuota", width="120px"),
                            rx.table.column_header_cell("Histórico", width="120px"),
                            rx.table.column_header_cell("Rec/Dto", width="120px"),
                            rx.table.column_header_cell("Total", width="120px"),
                        )
                    ),
                    rx.table.body(
                        rx.foreach(
                            GridFormState.data,
                            lambda row, idx: rx.table.row(
                                rx.table.cell(
                                    rx.checkbox(
                                        checked=GridFormState.selected_rows.contains(idx),
                                        on_change=lambda checked, index=idx: GridFormState.toggle_row(index)
                                    )
                                ),
                                rx.table.cell(row.Fecha),
                                rx.table.cell(row.Detalle),
                                rx.table.cell(row.Cuota),
                                rx.table.cell(f"${row.Importe:,.2f}"),
                                rx.table.cell(f"${row.Descuento:,.2f}"),
                                rx.table.cell(f"${row.Total:,.2f}"),
                            )
                        )
                    ),
                    variant="surface",
                    width="100%",
                ),
                rx.hstack(
                    rx.vstack(
                        rx.text(f"Registros: {GridFormState.data_length}"),
                        rx.text(f"Seleccionados: {GridFormState.selected_count}"),
                        spacing="2",
                    ),
                    rx.spacer(),
                    rx.vstack(
                        rx.text(f"Suma Importes: {GridFormState.total_importe}"),
                        rx.text(f"Suma Descuentos: {GridFormState.total_descuento}"),
                        rx.text(f"Total General: {GridFormState.total_general}", font_weight="bold"),
                        spacing="2",
                        align="end",
                    ),
                    width="100%",
                    padding_x="2em",
                    padding_bottom="2em",
                ),
                rx.cond(
                    GridFormState.error,
                    rx.alert_dialog.root(
                        rx.alert_dialog.content(
                            rx.alert_dialog.title("Error"),
                            rx.text(GridFormState.error),
                            rx.flex(
                                rx.button(
                                    "OK",
                                    on_click=GridFormState.set_error(""),
                                    color_scheme="blue",
                                ),
                                justify="end",
                                margin_top="1em",
                            )
                        )
                    ),
                ),
                width="100%",
                max_width="1400px",
                padding="2em",
            ),
            margin_top="120px",
            height="calc(100vh - 120px)",
            overflow_y="auto",
            padding_top="1em"
        )
    )

@contextmanager
def db_connection():
    config = {
        "server": os.getenv("DB_SERVER", "RF\\SQLEXPRESS"),
        "database": os.getenv("DB_DATABASE", "ELMANZANO3"),
        "username": os.getenv("DB_USER", "sa"),
        "password": os.getenv("DB_PASSWORD", "FALDAMLQD0431")
    }
    
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={config['server']};"
        f"DATABASE={config['database']};"
        f"UID={config['username']};"
        f"PWD={config['password']};"
        "Encrypt=yes;TrustServerCertificate=yes;"
        "Connection Timeout=30;"
    )
    
    conn = None
    try:
        conn = pyodbc.connect(connection_string)
        yield conn
    except Exception as e:
        raise RuntimeError(f"Error de conexión: {str(e)}")
    finally:
        if conn:
            
            conn.close()
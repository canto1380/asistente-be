# Colección Postman - Asistente API (Gastos, Tareas, Eventos)

## Cómo usar

1. **Importar en Postman**  
   Archivo → Import → seleccionar `Asistente_API_Gastos.postman_collection.json`.

2. **Variables de colección**  
   - `base_url`: por defecto `http://localhost:3000`. Cámbialo si tu API corre en otro puerto/host.  
   - `token`: se rellena automáticamente al ejecutar **Login** (en Tests se guarda `access_token`).  
   - El resto (`categoria_*_id`, `lista_tarea_id`, `tarea_id`, `evento_id`, `gasto_id`) se rellenan al ejecutar las peticiones que crean recursos (si tienen script de test).

3. **Orden recomendado para probar**
   - **0. Auth → Login** (poner tu `email` y `password` en el body).  
   - **1. CategoriaGasto** → Crear las 4 (Supermercado, Medicos, Servicios, Deporte). Los IDs quedan en las variables.  
   - **2. Listas Tareas** → Crear lista.  
   - **3. Tareas** → Probar los 4 casos (en lista con/sin gasto, fuera de lista con/sin gasto).  
   - **4. Eventos** → Con gasto y sin gasto.  
   - **5. Gastos** → GET todos / GET uno para ver los gastos generados.

## Resumen de casos

| Recurso        | Caso                          | Qué probar |
|----------------|-------------------------------|------------|
| CategoriaGasto | Supermercado, Medicos, Servicios, Deporte | 4 POST con nombre/descripción |
| Lista Tarea    | Una lista                     | POST y luego GET |
| Tarea          | En lista CON gasto            | `listaTareaId` + `gasto` + `categoriaGastoId` → genera Gasto agregado |
| Tarea          | En lista SIN gasto            | Sin `gasto` ni `categoriaGastoId` |
| Tarea          | Fuera de lista CON gasto      | Sin `listaTareaId`, con `gasto` (no crea Gasto, solo guarda en Tarea) |
| Tarea          | Fuera de lista SIN gasto      | Solo titulo/prioridad |
| Evento         | CON gasto                     | `gastoTotal` + `categoriaGastoId` → crea Gasto |
| Evento         | SIN gasto                     | Sin esos campos |
| Gastos         | Solo lectura                  | GET / GET:id (no hay POST) |

Asegúrate de que el backend esté levantado (`npm run start:dev`) y de tener un usuario con rol ADMIN o ADMINEMPRESA para que el JWT sea aceptado.

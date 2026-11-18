# API inicial

URL de desarrollo `http://127.0.0.1:5080`. La web puede acceder al contrato público mediante la ruta relativa `/api/v1/platform` en el mismo origen.

| Método y ruta | Resultado esperado |
| --- | --- |
| `GET /api/v1/platform` | `200 application/json`. Nombre, versión y equipo del proyecto. |
| `GET /health/live` | `200 text/plain` con `Healthy` mientras el proceso responde. |
| `GET /health/ready` | `200 text/plain` con `Healthy` si PostgreSQL responde y la migración está aplicada. Devuelve `503` con `Unhealthy` si la base no responde, la conexión falta o quedan migraciones pendientes. |

```json
{"name":"Huellitas de Luz","version":"2.0","team":"Patitas Tech"}
```

Los tres endpoints son públicos. Las comprobaciones de salud exponen el estado general y registran los detalles técnicos en el servidor. La configuración actual usa el proxy local de Vite para las peticiones de la web. Puedes ajustar su destino con la variable de proceso `HUELLITAS_API_URL` antes de ejecutar `npm run dev`.

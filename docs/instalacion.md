# Instalación local

Ejecuta los comandos desde la raíz del repositorio. La web puede funcionar por sí sola para revisar la portada. Para verificar la API y la persistencia, prepara también PostgreSQL.

## Descargar dependencias

```powershell
npm ci
dotnet restore Huellitas.slnx
dotnet tool restore
```

## Crear y migrar la base

Si todavía no tienes un archivo `.env`, copia el ejemplo y configúralo con una contraseña local. `.env` está excluido de Git. Puedes ajustar `POSTGRES_PORT` si ya tienes un servidor en el puerto `5432`.

```powershell
Copy-Item .env.example .env
```

Después de configurar el archivo, inicia PostgreSQL y prepara la conexión para .NET en esa terminal. Docker Compose lee `.env` de la raíz y .NET consume `ConnectionStrings__Huellitas` de la terminal.

```powershell
docker compose up -d --wait db
$postgresConfig = ConvertFrom-StringData (Get-Content -LiteralPath '.env' -Raw)
$env:ConnectionStrings__Huellitas = "Host=127.0.0.1;Port=$($postgresConfig.POSTGRES_PORT);Database=$($postgresConfig.POSTGRES_DB);Username=$($postgresConfig.POSTGRES_USER);Password=$($postgresConfig.POSTGRES_PASSWORD)"
dotnet ef database update --project apps/api
```

Para usar el fragmento tal como aparece, conserva los nombres del ejemplo y selecciona una contraseña alfanumérica. Para credenciales con caracteres especiales, configura la cadena de conexión según las reglas de Npgsql.

## Arrancar la API y la web

Arranca la API en la terminal que contiene la variable de conexión.

```powershell
dotnet run --project apps/api
```

Abre otra terminal para iniciar la web.

```powershell
npm run dev
```

| URL | Uso |
| --- | --- |
| `http://127.0.0.1:5173` | Portada de desarrollo. |
| `http://127.0.0.1:5173/creador` | Personalización y vista previa de mascotas. |
| `http://127.0.0.1:5173/api/v1/platform` | Contrato público servido a través del proxy de Vite. |
| `http://127.0.0.1:5080/health/live` | Estado del proceso de API. |
| `http://127.0.0.1:5080/health/ready` | Conexión con PostgreSQL y estado de las migraciones. |

La base escucha en la interfaz local. `docker compose stop db` detiene el contenedor y conserva su volumen. Las compilaciones de producción se pueden comprobar con `npm run build` y `dotnet publish apps/api -c Release`. El servicio de Railway y las tareas de producción se prepararán en la Fase 7.

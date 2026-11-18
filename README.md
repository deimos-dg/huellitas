# Huellitas de Luz 2.0

Proyecto de **Patitas Tech** para acercar a las personas a refugios autorizados, promover la adopción responsable y convertir cada donación confirmada en una mascota para su jardín virtual.

## Fase 1 · Fundamentos

El monorepo incluye una portada adaptable en español, una API HTTP, PostgreSQL con la migración inicial de cuentas y roles, y pruebas de integración y navegador. La portada presenta el propósito del proyecto y enlaza a las secciones informativas sobre adopciones, refugios y el jardín.

## Fase 2 · Creador de mascotas

Abre `/creador` desde la navegación principal. El creador permite elegir entre 18 variantes animadas, asignar un nombre, cambiar el tono y el collar, y revisar la selección. Cada variante ofrece entre 12 y 14 movimientos según las poses de su lámina. El creador mantiene la selección en la página mientras editas y revisas. La colección y las donaciones corresponden a las fases siguientes.

| Ruta | Contenido |
| --- | --- |
| `apps/web` | React, TypeScript, Vite, Tailwind CSS, Lucide, portada y creador. |
| `apps/api` | ASP.NET Core Web API, EF Core y migraciones de PostgreSQL. |
| `tests/Huellitas.Api.Tests` | Pruebas HTTP y persistencia con xUnit. |
| `tests/e2e` | Pruebas de portada, creador, navegación adaptable y teclado con Playwright. |
| `Imagenes` | Láminas originales, fotogramas y retrato fuente del Sphynx. |
| `scripts/pets` | Preparación reproducible de atlas y máscaras de color. |

## Inicio local

Necesitas **Node.js 22.12+ de la serie 22 o Node.js 24+**, **.NET SDK 10** y **Docker con Compose**. La web abre en `http://127.0.0.1:5173` y la API en `http://127.0.0.1:5080`. La guía incluye la configuración de PostgreSQL y el comando para aplicar la migración.

- [Instalación y ejecución](docs/instalacion.md)
- [Arquitectura, modelo de datos y fases](docs/arquitectura.md)
- [Contrato inicial de la API](docs/api.md)
- [Recursos gráficos](docs/recursos-graficos.md)
- [Pruebas y resultados](docs/pruebas.md)

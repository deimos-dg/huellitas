# Arquitectura y modelo inicial

## Componentes

| Componente | Responsabilidad |
| --- | --- |
| React, Vite, TypeScript y Tailwind | Interfaz en español, composición por páginas, navegación adaptable, iconos de Lucide y tokens visuales. |
| ASP.NET Core 10 | Contratos HTTP versionados, comprobaciones de salud y gestión de errores de la API. |
| EF Core 10 y Npgsql | Mapeos, migraciones y persistencia en PostgreSQL 17. |
| ASP.NET Core Identity para EF | Esquema inicial de usuarios y roles. El registro, la autenticación y la gestión de sesión todavía no tienen endpoints. |
| xUnit y Playwright | Verificación de HTTP, PostgreSQL y navegación en el navegador. |

El creador vive en `apps/web/src/features/pets`. La vista previa carga el atlas WebP de la variante seleccionada y aplica una máscara alfa para el collar. El manifiesto declara las dimensiones y el rango de fotogramas de cada secuencia. `motion.ts` define los tiempos de cada pose, los ciclos, el aterrizaje de los saltos y la respiración. El reloj del navegador actualiza la posición entre fotogramas y mantiene la pose al pausar. La revisión trabaja sobre el borrador en memoria de React. La aplicación de juego podrá reutilizar los fotogramas y el manifiesto cuando se incorporen las escenas.

Se eligió un monolito modular para empezar. `Controllers` contiene los contratos HTTP, `Domain` las reglas compartidas, `Persistence` el contexto y las migraciones, e `Infrastructure` la comprobación de disponibilidad. Cada módulo nuevo podrá incorporar sus casos de uso y mantener las operaciones transaccionales en la misma base.

En desarrollo, Vite reenvía `/api` a ASP.NET Core mediante su proxy. La API conserva la responsabilidad de autorizar las operaciones que se agreguen y de validar los cambios de estado. Para producción se propone publicar web y API bajo el mismo origen mediante un proxy y habilitar una lista explícita de orígenes si el despliegue requiere separarlos.

## Datos que existen en PostgreSQL

| Tabla | Relaciones y restricciones |
| --- | --- |
| `Users` | Clave UUID, nombre visible, correo normalizado obligatorio y único, nombre de usuario normalizado único y fecha de creación con zona horaria. Identity reserva los campos para credenciales y estado de la cuenta. |
| `Roles` | Clave UUID y nombre normalizado único. La migración crea `Usuario`, `Administrador` y `RefugioAutorizado`. |
| `UserRoles` | Relación muchos a muchos mediante clave primaria compuesta y claves foráneas a usuarios y roles. |
| `UserClaims`, `RoleClaims`, `UserLogins`, `UserTokens` | Tablas auxiliares de Identity con claves foráneas. La migración inicial no crea cuentas ni asigna roles a personas. |

## Entidades previstas

| Área | Entidades y relaciones previstas |
| --- | --- |
| Creador y jardín | `PetAppearances` para la configuración visual, `VirtualPets` vinculada a `Users` y a su donación, `UserGardens` por usuario, `GardenDecorations` y `PetCareActivities` vinculadas al jardín o mascota que corresponda. |
| Donaciones | `DonationOrders` por usuario y refugio, `PaymentEvents` con clave de proveedor e identificador externo únicos y `Donations` con una orden única. El importe y moneda se compararán en el backend con la confirmación autenticada. |
| Refugios y adopciones | `Shelters`, `AdoptionPets`, `AdoptionPetImages` y `AdoptionRequests`. El estado de verificación del refugio limitará qué información puede publicarse. |

La confirmación prevista guardará la donación y su mascota en una sola transacción. Una clave foránea obligatoria y un índice único en `VirtualPets.DonationId` limitarán la relación a una mascota por donación. La transacción garantizará la creación conjunta y el procesamiento idempotente hará que varias entregas del evento conserven la misma mascota.

## Desarrollo por fases

| Fase | Entrega |
| --- | --- |
| 1 · Fundamentos | Monorepo, identidad visual, navegación, API, modelo inicial de cuentas, migración y pruebas básicas. |
| 2 · Mascotas | Selector, variantes reconocibles, vista previa y animaciones básicas. |
| 3 · Mundo virtual | Evaluación de Phaser 3, jardín, escenas e interacciones. Autenticación y sesiones antes de habilitar persistencia ligada a cuentas. |
| 4 · Donaciones | Verificación de documentación oficial y credenciales de pey/CoDi, adaptador de pruebas si corresponde, órdenes y confirmación transaccional. SignalR se reserva para notificar eventos confirmados. |
| 5 · Adopciones | Galería con fotografías autorizadas, solicitudes y gestión de refugios. |
| 6 · Habitaciones | Cocina, baño, sala, parque y enfermería virtual. |
| 7 · Administración y producción | Paneles, pruebas completas, configuración de producción y Railway. |

# Roles del sistema

| Rol | Qué puede hacer | Qué NO puede hacer |
| --- | --- | --- |
| **ADMIN** | Accede a todo el panel (`/admin/**`), crea/edita/elimina vacantes, gestiona documentos requeridos, ve y descarga postulaciones (PDF/ZIP individual o general), cambia estados (Pendiente, Revisado, Completo, Descartado), configura reglas globales (p. ej. `PERMITIR_MULTIPLES_VACANTES`), gestiona usuarios internos. | Nada. Es superusuario. |
| **RRHH** | Entra al panel de Recursos Humanos, consulta vacantes y postulantes, actualiza estados y notas internas, descarga expedientes (PDF/ZIP por postulante o por vacante). | No puede crear/editar/eliminar vacantes, no gestiona usuarios ni configuraciones globales. |
| **Postulante (sin rol)** | Consulta vacantes públicas, ve detalle y envía postulaciones/documentos sin autenticarse. | No accede al panel `/admin/**`, no tiene cuenta ni puede gestionar vacantes. |

## Detalle por rol

### ADMIN
- Acceso completo al panel (`/admin/vacantes`, `/admin/vacantes/[id]/postulaciones`, `/admin/postulaciones/[id]`).
- CRUD de vacantes: crear, editar fechas/requisitos/beneficios/documentos, eliminar.
- Gestión total de postulantes: ver listados, detalle, descargas PDF/ZIP individuales y generales.
- Cambia estados de postulaciones (Pendiente, Revisado, Completo, Descartado).
- Puede administrar usuarios internos (crear RRHH, desactivar, cambiar roles) si la UI lo expone.
- Configura reglas globales como `PERMITIR_MULTIPLES_VACANTES` o rutas de subida.
- Ve todas las opciones del menú (Vacantes, Recursos Humanos y futuras opciones avanzadas).

### RRHH
- Acceso operativo a `/admin/vacantes`, `/admin/vacantes/[id]/postulaciones`, `/admin/postulaciones/[id]`.
- Gestiona postulantes: lista, detalle, notas internas, cambio de estados, descargas PDF/ZIP individuales o generales.
- No puede crear/editar/eliminar vacantes ni administrar usuarios ni configuraciones globales.
- Solo ve las opciones de menú necesarias (Vacantes y Recursos Humanos).

### Postulantes
- No requieren cuenta ni rol.
- Solo consumen la parte pública: listan vacantes, ven detalle y completan el formulario con sus documentos.
- No acceden a `/admin/**`; las rutas están protegidas por middleware y control de rol.

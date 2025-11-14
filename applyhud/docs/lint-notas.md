# Notas sobre ESLint y linting

## Por que se configuro ahora
- `next lint` pedia elegir una configuracion cada vez porque no existia un `.eslintrc.*` en la raiz del proyecto.
- Agregamos `.eslintrc.json` con `{"extends":"next/core-web-vitals"}` para fijar una configuracion base y evitar el asistente interactivo.
- Con ese archivo en la raiz, el comando `npm run lint` usa la configuracion local sin preguntas adicionales.

## Que es lint a nivel practico
- ESLint analiza el codigo estaticamente, antes de compilar o ejecutar, y avisa sobre errores comunes, malos olores o patrones que pueden romper SSR/CSR.
- Permite mantener un estilo consistente (imports ordenados, variables usadas, reglas de seguridad) sin depender solo de revisiones manuales.
- Al ejecutarlo en CI/antes de commits se detectan problemas temprano, reduciendo bugs en produccion.

## Como correrlo
1. Asegurate de estar en `c:\personal\iad\app\ApplyHub\applyhud`.
2. Ejecuta `npm run lint`. (Internamente llama a `next lint`.)
3. Si necesitas usar la version local sin scripts, `npx next lint` tambien funciona.

## Advertencia sobre TypeScript
- ESLint mostro: "SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.5.0" pero el proyecto usa TypeScript 5.5.4.
- Mientras no aparezcan errores reales se puede ignorar, pero si el warning molesta instala una version de TypeScript <5.5 (por ejemplo 5.4.x) o espera a que `@typescript-eslint` actualice su soporte.

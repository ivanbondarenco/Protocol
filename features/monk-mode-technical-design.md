# Protocol Application - Diseño Técnico del "Monk Mode"

## 1. Justificación: Eliminación Radical de Distracciones

El "Monk Mode" es una característica central de "Protocol" diseñada para eliminar radicalmente las distracciones, permitiendo al usuario alcanzar estados de enfoque profundo. Su implementación debe ser robusta, difícil de eludir y personalizable, reflejando la estética "Cyberpunk" y la intensidad competitiva de la aplicación.

## 2. Enfoque Híbrido de Implementación

Dado que el bloqueo efectivo requiere interacción a múltiples niveles del sistema operativo y del navegador, se propone un enfoque híbrido:

### A. Extensión del Navegador (Control Primario)
-   **Mecanismo:** Una extensión de navegador dedicada para Chrome/Firefox que intercepta las solicitudes de navegación.
-   **Funcionalidad:**
    -   **Lista Negra (Blacklist):** Configurable por el usuario, permite añadir URLs o dominios a bloquear (e.g., redes sociales, sitios de entretenimiento).
    -   **Redirección:** Al intentar acceder a un sitio bloqueado, la extensión redirigirá al usuario a una página de "Protocol" con un mensaje de "Modo Monje Activo" y el tiempo restante.
    -   **Bloqueo de Elementos:** Opcionalmente, la extensión podría ocultar elementos de páginas permitidas que son inherentemente distractores (e.g., feeds de noticias en LinkedIn, videos recomendados en YouTube).
    -   **Protección Anti-Desactivación:** Implementar mecanismos para dificultar la desactivación accidental o intencionada de la extensión durante el Modo Monje (e.g., requerir la contraseña de "Protocol" para desactivar o modificar la lista negra).
-   **Comunicación con Backend:** La extensión se comunicará con el Backend de "Protocol" para:
    -   Sincronizar la lista negra del usuario.
    -   Obtener el estado actual del "Monk Mode" (activo/inactivo, duración restante).
    -   Registrar intentos de acceso a sitios bloqueados (para estadísticas del usuario).

### B. Modificación de Archivo Hosts (Refuerzo a Nivel de Sistema Operativo)
-   **Mecanismo:** Para un bloqueo más robusto, especialmente en entornos de escritorio, se podría ofrecer una utilidad opcional que modifique el archivo `hosts` del sistema operativo.
-   **Funcionalidad:**
    -   Redirige dominios bloqueados a `127.0.0.1` (localhost) o `0.0.0.0`.
    -   **Activación/Desactivación:** Controlada por una aplicación de escritorio ligera o a través de la interfaz web de "Protocol", que llamaría a comandos con privilegios elevados en el sistema operativo del usuario.
    -   **Advertencia:** Este método requiere permisos de administrador y debe ser manejado con extrema cautela y comunicación clara al usuario sobre sus implicaciones.
-   **Limitaciones:** Menos flexible que una extensión, ya que bloquea el dominio por completo y no permite redirecciones personalizadas.

### C. Aplicación de Escritorio Ligera (Orquestación)
-   **Mecanismo:** Una aplicación de escritorio (`Electron` o similar) que actuaría como un orquestador.
-   **Funcionalidad:**
    -   Controla la activación/desactivación del "Monk Mode" a nivel del sistema operativo.
    -   Interactúa con el archivo `hosts` (con permisos de administrador).
    -   Monitoriza procesos o aplicaciones (opcionalmente) para detectar y cerrar distracciones.
    -   Proporciona una interfaz para gestionar la configuración del "Monk Mode" sin depender del navegador principal.

## 3. Características Clave del "Monk Mode"

-   **Temporizador:** Definir una duración específica para el Modo Monje (e.g., 25 minutos, 1 hora, hasta el final del día).
-   **Lista Blanca (Whitelist):** Opcional, permitir solo sitios específicos durante el Modo Monje (en lugar de bloquear una lista negra).
-   **Notificaciones Visuales/Auditivas:** Feedback claro cuando el Modo Monje está activo y cuando se intenta romperlo.
-   **"Panic Button" (Botón de Pánico):** Un mecanismo de emergencia para desactivar el Modo Monje. Debería ser visible pero requerir una confirmación o una acción deliberada para evitar desactivaciones accidentales.
-   **Registro de Quiebres:** Registrar cada vez que el usuario desactiva el Modo Monje prematuramente o intenta acceder a sitios bloqueados (para estadísticas personales).

## 4. Integración con el Backend (Servicio "Monk Mode")

Se creará un microservicio específico para el "Monk Mode" que gestionará:
-   La configuración del "Monk Mode" por usuario (listas negra/blanca, duración).
-   El estado activo/inactivo del "Monk Mode" para cada usuario.
-   El registro de quiebres y estadísticas.
-   La comunicación con las extensiones del navegador y las aplicaciones de escritorio.

## 5. Consideraciones de Seguridad y Privacidad

-   **Transparencia:** Informar claramente al usuario sobre cómo funciona el Modo Monje y qué permisos requiere (especialmente para la modificación del archivo `hosts`).
-   **Reversibilidad:** Asegurar que todos los cambios realizados por el aplicación sean completamente reversibles cuando el Modo Monje se desactive.
-   **Almacenamiento Seguro:** Almacenar las listas de bloqueo de forma segura en el backend.
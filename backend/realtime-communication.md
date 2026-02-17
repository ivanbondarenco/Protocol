# Protocol Application - Diseño de Comunicación en Tiempo Real

## 1. Justificación: Gamificación Instantánea y Conectividad Social

La esencia de la metodología "Protocol" reside en la inmediatez de la retroalimentación (rachas, notificaciones) y la presión social. Para lograr una experiencia de usuario que genere adicción y compromiso, la comunicación en tiempo real es fundamental. Evitar la latencia en las actualizaciones de estado (🔥, 💀, ⏳) es crítico.

## 2. Tecnología Propuesta: WebSockets

La implementación se basará en **WebSockets** para establecer conexiones bidireccionales y persistentes entre el cliente (frontend) y el servidor (backend). Esto permite que el servidor "empuje" actualizaciones a los clientes en cuanto ocurran, sin necesidad de que el cliente realice encuestas constantes.

### Framework/Librería Sugerida:
-   **Backend (Node.js/Express):** `Socket.IO` o `ws`.
    -   `Socket.IO` ofrece abstracciones útiles para reconexión, fallbacks y salas de mensajes, facilitando la gestión de la complejidad.
    -   `ws` es una implementación más ligera y de bajo nivel si se busca mayor control y se maneja la lógica de reconexión/mensajería manualmente.
-   **Frontend (React):** Cliente de `Socket.IO` o una implementación directa de WebSocket.

## 3. Arquitectura de WebSockets

### A. Servicio Dedicado de Notificaciones y Eventos (Microservicio)
-   Se creará un microservicio específico para manejar todas las conexiones WebSocket. Este servicio escuchará eventos internos del sistema (ver Sección 4 del `api-microservices.md`) y los retransmitirá a los clientes conectados.
-   **Comunicación Interna:** Este servicio se suscribirá a eventos de los otros microservicios (Hábitos, Usuarios, etc.) a través del bus de eventos (e.g., Kafka/RabbitMQ).

### B. Canales de Eventos (Rooms/Topics)
Los eventos se organizarán en "canales" (o "salas" en `Socket.IO`) para garantizar que los usuarios solo reciban las actualizaciones relevantes para ellos.

-   **Canales por Usuario:**
    -   `user:{userId}`: Para notificaciones directas al usuario (e.g., "Tu racha está en peligro").
    -   `habit:{habitId}`: Para actualizaciones específicas de un hábito (e.g., "Hábito 'Cold Shower' completado").
-   **Canales Sociales (Amigos/Aliados):**
    -   `social:{userId}`: Un canal donde los amigos del usuario pueden suscribirse para ver sus actualizaciones de racha y estado.
    -   `global-streaks`: Un canal opcional para un leaderboard global de rachas en tiempo real.

## 4. Tipos de Eventos en Tiempo Real

### A. Eventos de Hábitos
-   `habit:updated`: Cuando un hábito se marca como completado/fallido, actualizando la racha.
    -   Payload: `{ habitId, userId, newStreak, status (🔥/💀/⏳), message }`
-   `habit:nudge_received`: Cuando un aliado envía un "Nudge".
    -   Payload: `{ senderId, senderName, habitId, habitTitle }`

### B. Eventos de Usuarios/Social
-   `user:status_update`: Cuando el estado de un usuario cambia (online/offline).
    -   Payload: `{ userId, status }`
-   `ally:streak_update`: Actualización de racha de un aliado visible en el Dashboard Social.
    -   Payload: `{ allyId, allyName, habitId, habitTitle, newStreak, status }`

### C. Otros Eventos (consideraciones futuras)
-   `training:workout_completed`: Notificación de sesión de entrenamiento terminada.
-   `nutrition:macro_target_alert`: Alerta si los macros están por debajo/encima del objetivo.

## 5. Integración con el Frontend

-   El cliente de React se conectará al servicio de WebSockets al iniciar la sesión.
-   Se suscribirá a los canales relevantes para el usuario (`user:{userId}` y `social:{userId}`).
-   Los componentes de UI (Hero Streak, Matrix Grid, Social/Allies) se actualizarán dináneos al recibir estos eventos.

## 6. Consideraciones de Escalabilidad y Confiabilidad

-   **Balanceo de Carga:** El microservicio de WebSockets deberá ser escalable horizontalmente. Un balanceador de carga compatible con WebSockets (e.g., Nginx, un balanceador de carga en la nube) será esencial.
-   **Persistencia de Sesión (Sticky Sessions):** Para `Socket.IO`, puede ser beneficioso configurar sticky sessions en el balanceador de carga para mantener una conexión con la misma instancia de servidor.
-   **Manejo de Desconexiones:** Implementar lógica de reconexión automática en el cliente y manejo de sesiones en el servidor para reconectar usuarios sin perder contexto.
-   **Autenticación:** El establecimiento de la conexión WebSocket debe estar autenticado (e.g., pasando el JWT en el handshake o como parámetro de query).
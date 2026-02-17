# Protocol Application - Backend API & Microservices Design

## 1. Architectural Approach: Microservices

To achieve divine scalability, fault tolerance, and development velocity, the Protocol backend will adopt a microservices architecture. Each core module will be an independent service, communicating via well-defined APIs.

### Benefits:
-   **Decoupling:** Independent deployment and scaling of services.
-   **Resilience:** Failure in one service does not cripple the entire system.
-   **Technology Flexibility:** Each service can use the best tools for its specific task.
-   **Maintainability:** Smaller, focused codebases.

## 2. API Design Philosophy: RESTful with GraphQL Considerations

The primary API interface for client-side consumption will be RESTful for simplicity and broad compatibility. However, GraphQL will be considered for specific endpoints where client-driven data fetching (e.g., complex dashboard queries) provides significant performance or development advantages.

## 3. Core Microservices Breakdown

### A. User & Authentication Service
-   **Purpose:** Manages user registration, login, profiles, and authentication tokens.
-   **Endpoints (RESTful):**
    -   `POST /auth/register`: User registration.
    -   `POST /auth/login`: User login, returns JWT.
    -   `GET /users/me`: Get current user profile.
    -   `PUT /users/me/profile`: Update user profile (BioMetrics, Avatar).
    -   `GET /users/{id}`: Get public user profile (for social features).
-   **Data Model (Prisma):** `User`

### B. Habits Service
-   **Purpose:** Manages habit creation, tracking, streaks, and gamification logic.
-   **Endpoints (RESTful):**
    -   `POST /habits`: Create a new habit.
    -   `GET /habits`: Get all user habits.
    -   `GET /habits/{id}`: Get a specific habit with logs and streak data.
    -   `PUT /habits/{id}`: Update habit details.
    -   `DELETE /habits/{id}`: Delete a habit.
    -   `POST /habits/{id}/check-in`: Log habit completion for today. (Triggers streak update)
    -   `GET /habits/matrix`: Get 30-day habit matrix data.
    -   `GET /habits/streak-leaderboard`: Get global or friend streak leaderboard.
-   **Data Model (Prisma):** `Habit`, `HabitLog`

### C. Training Service
-   **Purpose:** Manages workout logging, exercise tracking, and progress visualization.
-   **Endpoints (RESTful):**
    -   `POST /workouts`: Create a new workout session.
    -   `GET /workouts`: Get all user workouts.
    -   `GET /workouts/{id}`: Get a specific workout with sets.
    -   `PUT /workouts/{id}`: Update workout details.
    -   `DELETE /workouts/{id}`: Delete a workout.
    -   `POST /workouts/{workoutId}/sets`: Add sets to a workout.
    -   `PUT /workouts/sets/{setId}`: Update a specific set.
    -   `GET /exercises`: Get list of exercises.
    -   `POST /exercises`: Create a custom exercise.
-   **Data Model (Prisma):** `Workout`, `WorkoutSet`, `Exercise`

### D. Nutrition Service
-   **Purpose:** Manages calorie/macro tracking, recipe suggestions, and hydration.
-   **Endpoints (RESTful):**
    -   `POST /nutrition/log`: Log daily nutrition (calories, macros).
    -   `GET /nutrition/log/{date}`: Get nutrition log for a specific date.
    -   `PUT /nutrition/log/{logId}`: Update a nutrition log entry.
    -   `GET /nutrition/targets`: Get computed macro targets for current user.
    -   `GET /recipes`: Search and get recipes (Scavenger).
    -   `GET /recipes/{id}`: Get detailed recipe blueprint.
    -   `POST /recipes/suggest`: Get AI-powered recipe suggestions (Smart Chef).
    -   `POST /hydration`: Log water intake.
    -   `GET /hydration/today`: Get today's hydration status.
-   **Data Model (Prisma):** `NutritionLog`, `Recipe`

### E. Vault Service
-   **Purpose:** Manages knowledge tracking (books, links, notes).
-   **Endpoints (RESTful):**
    -   `POST /vault/books`: Add a new book.
    -   `GET /vault/books`: Get user's book library.
    -   `PUT /vault/books/{id}`: Update book status/pages.
    -   `POST /vault/links`: Save a new URL.
    -   `GET /vault/links`: Get user's saved links.
    -   `POST /vault/notes`: Create a new note.
    -   `GET /vault/notes`: Get user's notes.
-   **Data Model (Prisma):** `Book` (needs `Link` and `Note` models if not using generic `Book` for everything)

## 4. Internal Communication & Data Flow

-   Services will communicate primarily via **event-driven architecture** (e.g., Kafka, RabbitMQ) for asynchronous operations (e.g., streak updates triggering social notifications, BioMetrics changes recalculating macro targets).
-   Direct synchronous calls will be used sparingly for immediate data retrieval.

## 5. Gateway API (BFF - Backend For Frontend)

A single API Gateway will sit in front of the microservices to handle:
-   Authentication & Authorization (JWT validation).
-   Request Routing.
-   Rate Limiting.
-   Response Aggregation (e.g., for Dashboard loading data from Habits, User, and Nutrition services).

## Next Steps:
-   Refine API endpoints with detailed request/response schemas (OpenAPI/Swagger).
-   Select specific message broker for event-driven communication.
-   Begin implementing core services (User & Auth, Habits) in Node.js/Express with Prisma.

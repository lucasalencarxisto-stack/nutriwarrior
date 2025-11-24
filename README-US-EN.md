Overview

NutriWarrior is an API to track meals, foods, water, workouts, and to generate weekly reports (kcal, macros, hydration, PRs). It’s portfolio‑oriented, showcasing clean code, tests, security (JWT) and DevOps.

Current status (Sprint 0): API up with /health and project setup (Gradle + Spring Boot). Next sprints add Postgres + Flyway + Auth.

Key Features (roadmap)

- ✅ /health (Hello API)

- 🔜 Users & Goals: registration/login with BCrypt and JWT

- 🔜 Foods & Meals: CRUD + automatic macro calculations

- 🔜 Water/Workouts/Weight: daily logs + weekly analytics /analytics/weekly

- 🔜 CSV Import/Export, Caffeine cache, observability (Actuator + Micrometer)

Tech Stack

- Java 21, Spring Boot 3 (Web, Validation, Security, Data JPA)

- PostgreSQL + Flyway (migrations)

- Gradle 8.9 (Kotlin DSL) + JUnit 5 tests

- Docker Compose (database), Swagger/OpenAPI (docs)

Requirements

- JDK 21

- Docker + Docker Compose (for DB)

- (Optional) GitHub CLI (gh) to create the repo

Quickstart (dev)

# Start DB (once Sprint 1 is applied)
docker compose up -d db


# Run API (default profile)
./gradlew bootRun
# Smoke test
curl http://localhost:8080/health

Configuration

src/main/resources/application.yaml

server:
port: 8080
spring:
application:
name: nutriwarrior

In dev you can enable lazy‑init and DevTools with --spring.profiles.active=dev.

Project Structure:

Nutri-Warrior/
├─ build.gradle.kts
├─ settings.gradle.kts
├─ docker-compose.yml (Sprint 1)
├─ src/
│ ├─ main/java/com/lucas/nutriwarrior/
│ │ ├─ NutriWarriorApplication.java
│ │ └─ HealthController.java
│ └─ main/resources/
│ └─ application.yaml
└─ test/java/com/lucas/nutriwarrior/
└─ HealthControllerTest.java

Endpoints (partial)

GET /health → application status

Coming soon: POST /api/auth/register, POST /api/auth/login, GET /api/foods, etc.

Handy Scripts:

./gradlew clean test # run tests
./gradlew bootRun # start local server
./gradlew tasks # list tasks

Short Roadmap

- Sprint 1: Postgres + Flyway V1 (users/goals) + base Security

- Sprint 2: Auth (BCrypt + JWT) + RBAC + tests

- Sprint 3: Foods/Meals + macro calculation + tests

- Sprint 4: Logs (water/workout/weight) + analytics

- Sprint 5: Import/Export + cache + observability + CI

Contributing

- Conventional Commits

- Small PRs with clear descriptions

- Tests along with new features

License

MIT
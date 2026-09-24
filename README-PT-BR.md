NutriWarrior — Nutrition & Workout Tracker (Java 21 / Spring Boot 3)

Visão Geral

NutriWarrior é uma API para registrar refeições, alimentos, água, treinos e gerar relatórios semanais (kcal, P/C/G, hidratação, PRs). O projeto é voltado para portfólio com foco em boas práticas, testes, segurança (JWT) e DevOps.

Status atual (Sprint 0): API online com endpoint /health e configuração de projeto (Gradle + Spring Boot). Próximas sprints adicionam Postgres + Flyway + Auth.

Principais Recursos (roadmap)

- ✅ /health (Hello API)

- 🔜 Usuários + Metas: registro/login com BCrypt e JWT

- 🔜 Alimentos & Refeições: CRUD e cálculo automático de macros

- 🔜 Hidratação/Treinos/Peso: logs diários e analytics semanal /analytics/weekly

- 🔜 Import/Export CSV, cache Caffeine, observabilidade (Actuator + Micrometer)

Stack Técnica

- Java 21, Spring Boot 3 (Web, Validation, Security, Data JPA)

- PostgreSQL + Flyway (migrações)

- Gradle 8.9 (Kotlin DSL) + testes com JUnit 5

- Docker Compose (serviço de banco), Swagger/OpenAPI (docs)

Requisitos

- JDK 21

- Docker + Docker Compose (para banco)

- (Opcional) GitHub CLI (gh) para criar repo

Comece Agora (dev)

# Subir banco (quando a Sprint 1 estiver aplicada)
docker compose up -d db


# Rodar API (perfil padrão)
./gradlew bootRun
# Testar
curl http://localhost:8080/health

Configuração

src/main/resources/application.yaml

server:
port: 8080
spring:
application:
name: nutriwarrior

Em dev, você pode ativar lazy-init e DevTools com --spring.profiles.active=dev.


Estrutura do Projeto

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

Endpoints (parciais)

- GET /health → status da aplicação

- Em breve: POST /api/auth/register, POST /api/auth/login, GET /api/foods, etc.

Scripts úteis

./gradlew clean test # roda testes
./gradlew bootRun # sobe servidor local
./gradlew tasks # lista tarefas

Roadmap (curto)

- Sprint 1: Postgres + Flyway V1 (users/goals) + Security base

- Sprint 2: Auth (BCrypt + JWT) + RBAC + testes

- Sprint 3: Foods/Meals + cálculo de macros + testes

- Sprint 4: Logs (água/treino/peso) + analytics

- Sprint 5: Import/Export + cache + observabilidade + CI

- Contribuindo

Commits no padrão Conventional Commits

- PRs curtos com descrição clara

- Testes acompanhando novas features

Core API MVP implementada

- CRUD de clientes, alimentos, dias, refeições e itens de refeição.
- Cálculo nutricional por quantidade, com snapshot no item consumido.
- Resumo diário em `GET /clientes/{clienteId}/dias/{data}/resumo`.
- Peso e água no dia por `POST` ou `PUT /clientes/{clienteId}/dias/{data}`.
- Metas em `GET` e `PUT /clientes/{clienteId}/metas`.
- Erros padronizados em JSON por `@RestControllerAdvice`.
- Swagger UI em `/swagger-ui.html` e OpenAPI em `/v3/api-docs`.

Para usar PostgreSQL localmente:

```bash
docker compose up -d db
DB_URL=jdbc:postgresql://localhost:5432/nutriwarrior \
DB_USERNAME=nutriwarrior DB_PASSWORD=nutriwarrior_dev \
./gradlew bootRun --args='--spring.profiles.active=prod'
```

No Windows PowerShell, use `$env:DB_URL`, `$env:DB_USERNAME` e `$env:DB_PASSWORD` antes de executar `gradlew.bat bootRun`. O desenvolvimento padrão continua usando H2.

Licença

MIT
# NutriWarrior Backend Sprint Report

## 1. Estado inicial encontrado

O projeto já possuía Java 21, Spring Boot 3.3.2, Gradle Kotlin DSL, JPA, Flyway, H2, PostgreSQL e CRUDs para Cliente, FoodItem, DiaRegistro, Refeicao e ItemRefeicao. O fluxo de ItemRefeicao já calculava nutrientes e persistia snapshot. O `docker-compose.yml` estava vazio e não havia resumo diário, metas, peso/água, advice global ou OpenAPI.

Também havia alterações locais pré-existentes em testes de ItemRefeicao/Refeicao e um teste de Cliente removido. Essas alterações foram preservadas.

## 2. Arquivos adicionados

- `V7__add_daily_metrics_and_goals.sql`
- Entidade/repositório/DTOs/controllers/services de metas.
- DTO de resumo e controller/service do resumo diário.
- `ApiErrorResponse`, `GlobalExceptionHandler` e `OpenApiConfig`.
- `CoreApiMvpControllerTest`.

## 3. Arquivos modificados

- `build.gradle.kts`: dependência springdoc OpenAPI 2.6.0.
- Entidade, DTO, service e controller de `DiaRegistro`: peso, água e atualização.
- `ItemRefeicaoRepository`: consulta dos itens de todas as refeições do dia.
- `docker-compose.yml`: PostgreSQL 16 local.
- `README-PT-BR.md`: operação e endpoints do MVP.

## 4. Migrations adicionadas

A V7 adiciona `peso_kg` e `agua_ml` em `dia_registro` e cria `meta_nutricional`, com relação única por cliente. V1-V6 não foram alteradas.

## 5. Novos endpoints

- `GET /clientes/{clienteId}/dias/{data}/resumo`
- `PUT /clientes/{clienteId}/dias/{data}`
- `GET /clientes/{clienteId}/metas`
- `PUT /clientes/{clienteId}/metas`
- Swagger UI: `/swagger-ui.html`
- OpenAPI JSON: `/v3/api-docs`

## 6. Regras de negócio implementadas

Itens usam quantidade em gramas e nutrientes por 100 g. Os valores derivados são `BigDecimal`, arredondados para duas casas com HALF_UP. O item salva alimento, quantidade e nutrientes calculados como snapshot. O restante de uma meta é `meta - consumo`; valores negativos significam excesso. Peso exige valor maior que zero e água aceita zero ou mais.

## 7. Arquitetura atual

Controllers recebem DTOs e delegam aos Services. Services validam relacionamentos e regras, Repositories encapsulam acesso JPA, Entities representam o domínio e Flyway versiona o schema. O resumo é calculado sob demanda a partir dos itens persistidos e não é armazenado.

## 8. Resultado dos testes

Foi executado o baseline solicitado antes das alterações. Durante a implementação, a primeira execução encontrou incompatibilidade do H2 com dois `ADD COLUMN` na mesma instrução da V7; a migration foi corrigida para instruções separadas. O teste focado `CoreApiMvpControllerTest` terminou com 2 testes e 0 falhas. O runner desta sessão encerrou as execuções completas do Gradle antes de devolver o código final, portanto o `clean test` completo permanece pendente de confirmação.

## 9. Comando usado para validar o build

```powershell
.\gradlew.bat clean test
```

## 10. Problemas encontrados durante a implementação

- H2 não aceitou a forma compacta de `ALTER TABLE`; V7 foi tornada compatível com H2 e PostgreSQL.
- O diretório continha alterações locais prévias; elas não foram revertidas.
- O terminal apresentou saída parcial e encerrou workers Gradle antes de devolver o código final; por isso o resultado completo não foi declarado verde.

## 11. Decisões técnicas tomadas

- Metas são uma relação única atual por cliente, sem histórico nesta sprint.
- Peso e água pertencem ao `DiaRegistro`.
- Resumo é derivado, evitando inconsistência entre totais e itens.
- `springdoc-openapi-starter-webmvc-ui:2.6.0` é usado com Spring Boot 3.3.x.
- O Compose usa defaults locais não secretos e permite sobrescrita por variáveis.

## 12. Dívidas técnicas restantes

FoodItem ainda usa `Double` na origem, embora derivados sejam `BigDecimal`. Faltam testes contra PostgreSQL real, concorrência no cadastro de dias, paginação, autenticação/autorização e observabilidade.

## 13. Fora do escopo

Frontend, PWA, aplicativos móveis, chatbot, LLM, RAG, machine learning, fotos, JWT, e-mails e dashboards gráficos não foram implementados.

## 14. Recomendações para a próxima sprint

Adicionar autenticação/autorização, migrar os valores nutricionais de origem para `BigDecimal`, incluir Testcontainers PostgreSQL no CI e ampliar documentação de contratos com exemplos.

## Próxima Sprint Recomendada

Priorizar identidade e autorização por cliente, depois fortalecer a matriz de testes com PostgreSQL real e contratos OpenAPI automatizados. Essas recomendações não fazem parte desta sprint.
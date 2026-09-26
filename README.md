# NutriWarrior

- ��🇷 **Português:** [README-PT-BR.md](README-PT-BR.md)
- 🇺🇸 **English:**   [README-US-EN.md](README-US-EN.md)

## NutriWarrior Assistant

- `POST /assistant/chat`: Bearer JWT e JSON `{"message":"Bebi 500 ml de agua","clienteId":1}`. Para pacientes, `clienteId` é opcional e só pode indicar o próprio perfil; nutricionistas devem informar um cliente vinculado.
- Escritas exigem confirmação via `POST /assistant/execute` com `{"confirmationId":"UUID retornado pelo chat"}` e o mesmo usuário autenticado. A permissão é revalidada na execução.
- Confirmações duram 10 minutos e são de uso único, persistidas por JPA na tabela `assistant_pending_action` (Flyway V9). Instâncias que usam o mesmo banco compartilham as pendências. PostgreSQL preserva as ações após reiniciar; H2 em memória, usado em desenvolvimento/testes, não sobrevive ao encerramento do processo.
- O consumo usa bloqueio de linha (`PESSIMISTIC_WRITE`) em transação independente (`REQUIRES_NEW`). A operação de negócio mantém sua própria transação: uma execução que falha exige nova confirmação, mesmo após rollback dos dados. Uma interrupção entre o consumo e a escrita também exige nova confirmação; não há retry automático.
- Payloads são JSON internos, validados por intent como `WaterCommand`, `WeightCommand` ou `MealCommand`. O frontend envia somente `confirmationId` na confirmação. A implementação em memória existe apenas em `src/test`.
- Registros expirados/consumidos permanecem na tabela; política de retenção e limpeza ficam para manutenção futura. Excluir o usuário/cliente remove suas pendências por FK com cascade. Os relógios das instâncias devem estar sincronizados para aplicar o TTL.
- Ollama: `OLLAMA_BASE_URL` (default `http://localhost:11434`), `OLLAMA_MODEL` (`qwen2.5:1.5b`), `OLLAMA_TIMEOUT_SECONDS` (`60`, conexão/leitura) e `OLLAMA_KEEP_ALIVE` (`10m`). Indisponibilidade retorna HTTP 503.
- Prompts em `src/main/resources/prompts`; endpoints documentados em `/v3/api-docs` e `/swagger-ui.html` com Bearer JWT.

### Teste manual de persistência após restart

Use PostgreSQL com o profile `prod`, banco/volume persistente e as variáveis `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET` configuradas. Não use H2 em memória para este teste.

1. Inicie a aplicação com `.\gradlew.bat bootRun --args="--spring.profiles.active=prod"`.
2. Autentique um usuário existente em `POST /auth/login` e use o Bearer JWT retornado.
3. Chame `POST /assistant/chat` com `{"message":"Bebi 500 ml de agua"}`; nutricionistas também devem informar um `clienteId` autorizado.
4. Copie o `confirmationId` retornado, sem executar a ação ainda.
5. Pare a aplicação, preservando o banco.
6. Inicie novamente com o mesmo profile e banco.
7. Autentique novamente o mesmo usuário.
8. Antes de completar 10 minutos da criação, chame `POST /assistant/execute` com `{"confirmationId":"UUID copiado"}`.
9. Confirme o sucesso e o registro de 500 ml uma única vez; repetir o execute deve retornar 409. Se o TTL tiver terminado, a ação é rejeitada com 400 e deve ser recriada pelo chat.

O teste automatizado usa H2 no profile `test`, stores independentes e conexões/transações concorrentes; o restart de processo com PostgreSQL é uma validação manual.

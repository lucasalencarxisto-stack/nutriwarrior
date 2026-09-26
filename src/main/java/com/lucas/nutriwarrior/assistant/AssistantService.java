package com.lucas.nutriwarrior.assistant;

import com.lucas.nutriwarrior.assistant.command.MealCommand;
import com.lucas.nutriwarrior.assistant.command.WaterCommand;
import com.lucas.nutriwarrior.assistant.command.WeightCommand;
import com.lucas.nutriwarrior.assistant.extractor.MealCommandExtractor;
import com.lucas.nutriwarrior.assistant.extractor.WaterCommandExtractor;
import com.lucas.nutriwarrior.assistant.extractor.WeightCommandExtractor;
import com.lucas.nutriwarrior.model.FoodItem;
import com.lucas.nutriwarrior.model.dto.RefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.ItemRefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.ResumoNutricionalResponse;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import com.lucas.nutriwarrior.repository.FoodItemRepository;
import com.lucas.nutriwarrior.service.ClienteAccessService;
import com.lucas.nutriwarrior.service.ItemRefeicaoService;
import com.lucas.nutriwarrior.service.MetaNutricionalService;
import com.lucas.nutriwarrior.service.RefeicaoService;
import com.lucas.nutriwarrior.service.ResumoNutricionalService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AssistantService {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    private final AssistantIntentClassifier classifier;
    private final WaterCommandExtractor waterExtractor;
    private final WeightCommandExtractor weightExtractor;
    private final MealCommandExtractor mealExtractor;
    private final PendingActionStore pendingActionStore;
    private final ClienteAccessService accessService;
    private final ClienteRepository clienteRepository;
    private final DiaRegistroRepository diaRegistroRepository;
    private final FoodItemRepository foodItemRepository;
    private final RefeicaoService refeicaoService;
    private final ItemRefeicaoService itemRefeicaoService;
    private final ResumoNutricionalService resumoNutricionalService;
    private final MetaNutricionalService metaNutricionalService;
    private final PromptLoader promptLoader;
    private final LlmClient llmClient;

    public AssistantService(
            AssistantIntentClassifier classifier,
            WaterCommandExtractor waterExtractor,
            WeightCommandExtractor weightExtractor,
            MealCommandExtractor mealExtractor,
            PendingActionStore pendingActionStore,
            ClienteAccessService accessService,
            ClienteRepository clienteRepository,
            DiaRegistroRepository diaRegistroRepository,
            FoodItemRepository foodItemRepository,
            RefeicaoService refeicaoService,
            ItemRefeicaoService itemRefeicaoService,
            ResumoNutricionalService resumoNutricionalService,
            MetaNutricionalService metaNutricionalService,
            PromptLoader promptLoader,
            LlmClient llmClient) {
        this.classifier = classifier;
        this.waterExtractor = waterExtractor;
        this.weightExtractor = weightExtractor;
        this.mealExtractor = mealExtractor;
        this.pendingActionStore = pendingActionStore;
        this.accessService = accessService;
        this.clienteRepository = clienteRepository;
        this.diaRegistroRepository = diaRegistroRepository;
        this.foodItemRepository = foodItemRepository;
        this.refeicaoService = refeicaoService;
        this.itemRefeicaoService = itemRefeicaoService;
        this.resumoNutricionalService = resumoNutricionalService;
        this.metaNutricionalService = metaNutricionalService;
        this.promptLoader = promptLoader;
        this.llmClient = llmClient;
    }

    public AssistantChatResponse chat(String message, Long requestedClienteId, Usuario usuario) {
        Long clienteId = resolveClienteId(usuario, requestedClienteId);
        AssistantIntent intent = classifier.classify(message);

        switch (intent) {
            case REGISTRAR_AGUA -> {
                WaterCommand command = waterExtractor.extract(message);
                if (!command.isValid()) {
                    return new AssistantChatResponse(
                        "Qual foi a quantidade de água?",
                        AssistantIntent.CLARIFY,
                        false,
                        null,
                        null
                    );
                }
                Map<String, Object> payload = new HashMap<>();
                payload.put("quantidadeMl", command.quantidadeMl());
                PendingAction pending = pendingActionStore.create(new PendingAction(
                    null,
                    usuario.id,
                    clienteId,
                    AssistantIntent.REGISTRAR_AGUA,
                    payload,
                    null,
                    null,
                    false
                ));
                return new AssistantChatResponse(
                    "Entendi. Deseja registrar " + command.quantidadeMl() + " ml de água?",
                    AssistantIntent.REGISTRAR_AGUA,
                    true,
                    pending.id(),
                    null
                );
            }
            case REGISTRAR_PESO -> {
                WeightCommand command = weightExtractor.extract(message);
                if (!command.isValid()) {
                    return new AssistantChatResponse(
                        "Qual foi o peso em kg?",
                        AssistantIntent.CLARIFY,
                        false,
                        null,
                        null
                    );
                }
                Map<String, Object> payload = new HashMap<>();
                payload.put("pesoKg", command.pesoKg());
                PendingAction pending = pendingActionStore.create(new PendingAction(
                    null,
                    usuario.id,
                    clienteId,
                    AssistantIntent.REGISTRAR_PESO,
                    payload,
                    null,
                    null,
                    false
                ));
                return new AssistantChatResponse(
                    "Entendi. Deseja registrar " + command.pesoKg() + " kg como peso do dia?",
                    AssistantIntent.REGISTRAR_PESO,
                    true,
                    pending.id(),
                    null
                );
            }
            case REGISTRAR_REFEICAO -> {
                MealCommand command = mealExtractor.extract(message);
                if (!command.isValid()) {
                    return new AssistantChatResponse(
                        "Qual foi a quantidade de arroz e de frango?",
                        AssistantIntent.CLARIFY,
                        false,
                        null,
                        null
                    );
                }
                Map<String, Object> payload = new HashMap<>();
                payload.put("tipoRefeicao", command.tipoRefeicao());
                payload.put("itens", command.itens());
                PendingAction pending = pendingActionStore.create(new PendingAction(
                    null,
                    usuario.id,
                    clienteId,
                    AssistantIntent.REGISTRAR_REFEICAO,
                    payload,
                    null,
                    null,
                    false
                ));
                return new AssistantChatResponse(
                    "Entendi. Deseja registrar essa refeição?",
                    AssistantIntent.REGISTRAR_REFEICAO,
                    true,
                    pending.id(),
                    null
                );
            }
            case CONSULTAR_RESUMO -> {
                ResumoNutricionalResponse response = resumoNutricionalService.buscar(clienteId, hoje());
                return new AssistantChatResponse(
                    resumoToText(response),
                    AssistantIntent.CONSULTAR_RESUMO,
                    false,
                    null,
                    null
                );
            }
            case CONSULTAR_METAS -> {
                var meta = metaNutricionalService.buscar(clienteId);
                return new AssistantChatResponse(
                    "Meta diária: " + meta.calorias + " kcal, " + meta.proteinasGramas + " g proteína, "
                        + meta.carboidratosGramas + " g carboidratos, " + meta.gordurasGramas + " g gordura, "
                        + meta.aguaMl + " ml de água.",
                    AssistantIntent.CONSULTAR_METAS,
                    false,
                    null,
                    null
                );
            }
            case LISTAR_REFEICOES -> {
                var refeicoes = refeicaoService.listar(clienteId, hoje());
                if (refeicoes.isEmpty()) {
                    return new AssistantChatResponse(
                        "Hoje ainda não há refeições registradas.",
                        AssistantIntent.LISTAR_REFEICOES,
                        false,
                        null,
                        null
                    );
                }
                return new AssistantChatResponse(
                    "Refeições hoje: " + refeicoes.size(),
                    AssistantIntent.LISTAR_REFEICOES,
                    false,
                    null,
                    null
                );
            }
            case GENERAL_NUTRITION -> {
                String reply = llmClient.chat(promptLoader.load("general-nutrition.txt"), message);
                return new AssistantChatResponse(reply, AssistantIntent.GENERAL_NUTRITION, false, null, null);
            }
            case OUT_OF_SCOPE -> {
                return new AssistantChatResponse(
                    "Posso ajudar com alimentação, acompanhamento nutricional e recursos do NutriWarrior.",
                    AssistantIntent.OUT_OF_SCOPE,
                    false,
                    null,
                    null
                );
            }
            case CLARIFY -> {
                return new AssistantChatResponse(
                    "Preciso de mais detalhes para registrar isso.",
                    AssistantIntent.CLARIFY,
                    false,
                    null,
                    null
                );
            }
            default -> {
                return new AssistantChatResponse(
                    "Posso ajudar com alimentação, acompanhamento nutricional e recursos do NutriWarrior.",
                    AssistantIntent.OUT_OF_SCOPE,
                    false,
                    null,
                    null
                );
            }
        }
    }

    @Transactional
    public AssistantChatExecuteResponse execute(String confirmationId, Usuario usuario) {
        PendingAction action = pendingActionStore.require(confirmationId);
        if (!Objects.equals(action.userId(), usuario.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acao nao pertence ao usuario autenticado");
        }
        Long clienteId = resolveClienteId(usuario, action.clienteId());
        pendingActionStore.consume(confirmationId, usuario.id);

        switch (action.intent()) {
            case REGISTRAR_AGUA -> {
                int quantidadeMl = ((Number) action.payload().getOrDefault("quantidadeMl", 0)).intValue();
                aplicarAgua(clienteId, quantidadeMl);
                return new AssistantChatExecuteResponse(
                    "Água registrada com sucesso.",
                    AssistantIntent.REGISTRAR_AGUA,
                    true
                );
            }
            case REGISTRAR_PESO -> {
                BigDecimal pesoKg = (BigDecimal) action.payload().get("pesoKg");
                aplicarPeso(clienteId, pesoKg);
                return new AssistantChatExecuteResponse(
                    "Peso registrado com sucesso.",
                    AssistantIntent.REGISTRAR_PESO,
                    true
                );
            }
            case REGISTRAR_REFEICAO -> {
                registrarRefeicao(clienteId, action.payload());
                return new AssistantChatExecuteResponse(
                    "Refeição registrada com sucesso.",
                    AssistantIntent.REGISTRAR_REFEICAO,
                    true
                );
            }
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Ação pendente inválida"
            );
        }
    }

    private Long resolveClienteId(Usuario usuario, Long requestedClienteId) {
        if (usuario.role == Role.PACIENTE) {
            Cliente cliente = clienteRepository.findByUsuario_Id(usuario.id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Paciente sem cliente associado"));
            if (requestedClienteId != null && !Objects.equals(requestedClienteId, cliente.id)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Paciente nao pode acessar outro cliente");
            }
            return cliente.id;
        }
        if (requestedClienteId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o clienteId para esta operação");
        }
        accessService.exigirAcesso(requestedClienteId);
        return requestedClienteId;
    }

    private LocalDate hoje() {
        return LocalDate.now(SAO_PAULO);
    }

    private String resumoToText(ResumoNutricionalResponse resumo) {
        return "Resumo de " + resumo.data + ": " + resumo.calorias + " kcal, " + resumo.proteinasGramas + " g proteína, "
            + resumo.carboidratosGramas + " g carboidratos, " + resumo.gordurasGramas + " g gordura, "
            + resumo.aguaMl + " ml de água e peso de " + resumo.pesoKg + " kg.";
    }

    private void aplicarAgua(Long clienteId, int quantidadeMl) {
        LocalDate hoje = hoje();
        DiaRegistro dia = diaRegistroRepository.findByCliente_IdAndData(clienteId, hoje)
            .orElseGet(() -> {
                Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado"));
                DiaRegistro novo = new DiaRegistro();
                novo.cliente = cliente;
                novo.data = hoje;
                novo.aguaMl = 0;
                novo.pesoKg = null;
                return diaRegistroRepository.save(novo);
            });
        try {
            dia.aguaMl = Math.addExact(dia.aguaMl == null ? 0 : dia.aguaMl, quantidadeMl);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade de agua excede o limite suportado");
        }
        diaRegistroRepository.save(dia);
    }

    private void aplicarPeso(Long clienteId, BigDecimal pesoKg) {
        LocalDate hoje = hoje();
        DiaRegistro dia = diaRegistroRepository.findByCliente_IdAndData(clienteId, hoje)
            .orElseGet(() -> {
                Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado"));
                DiaRegistro novo = new DiaRegistro();
                novo.cliente = cliente;
                novo.data = hoje;
                novo.aguaMl = 0;
                novo.pesoKg = null;
                return diaRegistroRepository.save(novo);
            });
        dia.pesoKg = pesoKg;
        diaRegistroRepository.save(dia);
    }

    private void registrarRefeicao(Long clienteId, Map<String, Object> payload) {
        LocalDate hoje = hoje();
        var tipo = (com.lucas.nutriwarrior.model.entity.TipoRefeicao) payload.get("tipoRefeicao");
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo da refeição não informado");
        }
        RefeicaoRequest refeicaoRequest = new RefeicaoRequest();
        refeicaoRequest.tipo = tipo;
        refeicaoRequest.horario = LocalTime.now(SAO_PAULO);
        var refeicaoResponse = refeicaoService.criar(clienteId, hoje, refeicaoRequest);

        @SuppressWarnings("unchecked")
        List<MealCommand.Item> itens = (List<MealCommand.Item>) payload.get("itens");
        for (MealCommand.Item item : itens) {
            FoodItem food = localizarAlimento(item.alimento());
            ItemRefeicaoRequest itemRequest = new ItemRefeicaoRequest();
            itemRequest.foodItemId = food.getId();
            itemRequest.quantidadeGramas = item.quantidadeGramas();
            itemRefeicaoService.criar(clienteId, hoje, refeicaoResponse.id, itemRequest);
        }
    }

    private FoodItem localizarAlimento(String nome) {
        String busca = nome == null ? "" : nome.trim();
        if (busca.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alimento nao informado");
        }
        return foodItemRepository.findByNameIgnoreCase(busca)
            .or(() -> foodItemRepository.findAllByNameContainingIgnoreCase(busca).stream().findFirst())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Alimento nao encontrado no catalogo: " + busca));
    }
}

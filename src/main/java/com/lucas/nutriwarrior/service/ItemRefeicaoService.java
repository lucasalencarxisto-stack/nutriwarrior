package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.FoodItem;
import com.lucas.nutriwarrior.model.dto.ItemRefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.ItemRefeicaoResponse;
import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import com.lucas.nutriwarrior.model.entity.ItemRefeicao;
import com.lucas.nutriwarrior.model.entity.Refeicao;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import com.lucas.nutriwarrior.repository.FoodItemRepository;
import com.lucas.nutriwarrior.repository.ItemRefeicaoRepository;
import com.lucas.nutriwarrior.repository.RefeicaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class ItemRefeicaoService {

    private static final BigDecimal CEM =
        new BigDecimal("100");

    private final ItemRefeicaoRepository itemRepository;
    private final RefeicaoRepository refeicaoRepository;
    private final DiaRegistroRepository diaRepository;
    private final FoodItemRepository foodRepository;

    public ItemRefeicaoService(
            ItemRefeicaoRepository itemRepository,
            RefeicaoRepository refeicaoRepository,
            DiaRegistroRepository diaRepository,
            FoodItemRepository foodRepository) {

        this.itemRepository = itemRepository;
        this.refeicaoRepository = refeicaoRepository;
        this.diaRepository = diaRepository;
        this.foodRepository = foodRepository;
    }

    public ItemRefeicaoResponse criar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId,
            ItemRefeicaoRequest request) {

        Refeicao refeicao =
            buscarRefeicao(clienteId, data, refeicaoId);

        FoodItem food = buscarFood(request.foodItemId);

        ItemRefeicao item = new ItemRefeicao();
        item.refeicao = refeicao;

        aplicarDados(item, food, request.quantidadeGramas);

        return ItemRefeicaoResponse.fromEntity(
            itemRepository.save(item)
        );
    }

    public List<ItemRefeicaoResponse> listar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId) {

        Refeicao refeicao =
            buscarRefeicao(clienteId, data, refeicaoId);

        return itemRepository
            .findAllByRefeicao_IdOrderByIdAsc(refeicao.id)
            .stream()
            .map(ItemRefeicaoResponse::fromEntity)
            .toList();
    }

    public ItemRefeicaoResponse buscarPorId(
            Long clienteId,
            LocalDate data,
            Long refeicaoId,
            Long itemId) {

        Refeicao refeicao =
            buscarRefeicao(clienteId, data, refeicaoId);

        return ItemRefeicaoResponse.fromEntity(
            buscarItem(itemId, refeicao.id)
        );
    }

    public ItemRefeicaoResponse atualizar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId,
            Long itemId,
            ItemRefeicaoRequest request) {

        Refeicao refeicao =
            buscarRefeicao(clienteId, data, refeicaoId);

        ItemRefeicao item =
            buscarItem(itemId, refeicao.id);

        FoodItem food =
            buscarFood(request.foodItemId);

        aplicarDados(
            item,
            food,
            request.quantidadeGramas
        );

        return ItemRefeicaoResponse.fromEntity(
            itemRepository.save(item)
        );
    }

    public void deletar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId,
            Long itemId) {

        Refeicao refeicao =
            buscarRefeicao(clienteId, data, refeicaoId);

        itemRepository.delete(
            buscarItem(itemId, refeicao.id)
        );
    }

    private void aplicarDados(
            ItemRefeicao item,
            FoodItem food,
            BigDecimal quantidade) {

        BigDecimal fator =
            quantidade.divide(
                CEM,
                6,
                RoundingMode.HALF_UP
            );

        item.foodItem = food;
        item.alimento = food.getName();
        item.quantidadeGramas =
            quantidade.setScale(2, RoundingMode.HALF_UP);

        item.kcal =
            calcular(food.getCalories(), fator);

        item.proteinasGramas =
            calcular(food.getProtein(), fator);

        item.carboidratosGramas =
            calcular(food.getCarbs(), fator);

        item.gordurasGramas =
            calcular(food.getFat(), fator);
    }

    private BigDecimal calcular(
            Double valorPorCem,
            BigDecimal fator) {

        if (valorPorCem == null) {
            return BigDecimal.ZERO.setScale(2);
        }

        return BigDecimal
            .valueOf(valorPorCem)
            .multiply(fator)
            .setScale(2, RoundingMode.HALF_UP);
    }

    private FoodItem buscarFood(Long foodItemId) {
        return foodRepository.findById(foodItemId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Alimento nao encontrado"
            ));
    }

    private Refeicao buscarRefeicao(
            Long clienteId,
            LocalDate data,
            Long refeicaoId) {

        DiaRegistro dia = diaRepository
            .findByCliente_IdAndData(clienteId, data)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Registro diario nao encontrado"
            ));

        return refeicaoRepository
            .findByIdAndDiaRegistro_Id(
                refeicaoId,
                dia.id
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Refeicao nao encontrada"
            ));
    }

    private ItemRefeicao buscarItem(
            Long itemId,
            Long refeicaoId) {

        return itemRepository
            .findByIdAndRefeicao_Id(
                itemId,
                refeicaoId
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Item da refeicao nao encontrado"
            ));
    }
}
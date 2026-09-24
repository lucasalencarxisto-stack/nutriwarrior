package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.ResumoNutricionalResponse;
import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import com.lucas.nutriwarrior.model.entity.ItemRefeicao;
import com.lucas.nutriwarrior.model.entity.MetaNutricional;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import com.lucas.nutriwarrior.repository.ItemRefeicaoRepository;
import com.lucas.nutriwarrior.repository.MetaNutricionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class ResumoNutricionalService {
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private final DiaRegistroRepository diaRepository;
    private final ItemRefeicaoRepository itemRepository;
    private final MetaNutricionalRepository metaRepository;
    private final ClienteAccessService accessService;

    public ResumoNutricionalService(DiaRegistroRepository diaRepository,
            ItemRefeicaoRepository itemRepository,
            MetaNutricionalRepository metaRepository,
            ClienteAccessService accessService) {
        this.diaRepository = diaRepository;
        this.itemRepository = itemRepository;
        this.metaRepository = metaRepository;
        this.accessService = accessService;
    }

    public ResumoNutricionalResponse buscar(Long clienteId, LocalDate data) {
        accessService.exigirAcesso(clienteId);
        DiaRegistro dia = diaRepository.findByCliente_IdAndData(clienteId, data)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Registro diario nao encontrado"));
        List<ItemRefeicao> itens = itemRepository
            .findAllByRefeicao_DiaRegistro_Id(dia.id);
        ResumoNutricionalResponse response = new ResumoNutricionalResponse();
        response.clienteId = clienteId;
        response.data = data;
        response.calorias = soma(itens, "kcal");
        response.proteinasGramas = soma(itens, "proteinas");
        response.carboidratosGramas = soma(itens, "carboidratos");
        response.gordurasGramas = soma(itens, "gorduras");
        response.quantidadeItens = itens.size();
        response.quantidadeRefeicoes = itens.stream()
            .map(item -> item.refeicao.id).distinct().toList().size();
        response.pesoKg = dia.pesoKg;
        response.aguaMl = dia.aguaMl;
        metaRepository.findByCliente_Id(clienteId)
            .ifPresent(meta -> aplicarMetas(response, meta));
        return response;
    }

    private BigDecimal soma(List<ItemRefeicao> itens, String campo) {
        return itens.stream().map(item -> switch (campo) {
            case "kcal" -> item.kcal;
            case "proteinas" -> item.proteinasGramas;
            case "carboidratos" -> item.carboidratosGramas;
            default -> item.gordurasGramas;
        }).reduce(ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private void aplicarMetas(ResumoNutricionalResponse r, MetaNutricional m) {
        r.metaCalorias = m.calorias;
        r.caloriasRestantes = restante(m.calorias, r.calorias);
        r.metaProteina = m.proteinasGramas;
        r.proteinaRestante = restante(m.proteinasGramas, r.proteinasGramas);
        r.metaCarboidratos = m.carboidratosGramas;
        r.carboidratosRestantes = restante(m.carboidratosGramas, r.carboidratosGramas);
        r.metaGordura = m.gordurasGramas;
        r.gorduraRestante = restante(m.gordurasGramas, r.gordurasGramas);
        r.metaAguaMl = m.aguaMl;
        r.aguaRestanteMl = m.aguaMl == null || r.aguaMl == null
            ? null : m.aguaMl - r.aguaMl;
    }

    private BigDecimal restante(BigDecimal meta, BigDecimal consumo) {
        return meta == null ? null : meta.subtract(consumo).setScale(2, RoundingMode.HALF_UP);
    }
}
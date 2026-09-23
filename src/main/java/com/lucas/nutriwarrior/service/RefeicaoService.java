package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.RefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.RefeicaoResponse;
import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import com.lucas.nutriwarrior.model.entity.Refeicao;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import com.lucas.nutriwarrior.repository.RefeicaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class RefeicaoService {

    private final RefeicaoRepository refeicaoRepository;
    private final DiaRegistroRepository diaRepository;

    public RefeicaoService(
            RefeicaoRepository refeicaoRepository,
            DiaRegistroRepository diaRepository) {

        this.refeicaoRepository = refeicaoRepository;
        this.diaRepository = diaRepository;
    }

    public RefeicaoResponse criar(
            Long clienteId,
            LocalDate data,
            RefeicaoRequest request) {

        DiaRegistro dia = buscarDia(clienteId, data);

        Refeicao refeicao = new Refeicao();
        refeicao.diaRegistro = dia;
        aplicarDados(refeicao, request);

        return RefeicaoResponse.fromEntity(
            refeicaoRepository.save(refeicao)
        );
    }

    public List<RefeicaoResponse> listar(
            Long clienteId,
            LocalDate data) {

        DiaRegistro dia = buscarDia(clienteId, data);

        return refeicaoRepository
            .findAllByDiaRegistro_IdOrderByHorarioAsc(dia.id)
            .stream()
            .map(RefeicaoResponse::fromEntity)
            .toList();
    }

    public RefeicaoResponse buscarPorId(
            Long clienteId,
            LocalDate data,
            Long refeicaoId) {

        DiaRegistro dia = buscarDia(clienteId, data);

        return RefeicaoResponse.fromEntity(
            buscarRefeicao(refeicaoId, dia.id)
        );
    }

    public RefeicaoResponse atualizar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId,
            RefeicaoRequest request) {

        DiaRegistro dia = buscarDia(clienteId, data);
        Refeicao refeicao =
            buscarRefeicao(refeicaoId, dia.id);

        aplicarDados(refeicao, request);

        return RefeicaoResponse.fromEntity(
            refeicaoRepository.save(refeicao)
        );
    }

    public void deletar(
            Long clienteId,
            LocalDate data,
            Long refeicaoId) {

        DiaRegistro dia = buscarDia(clienteId, data);

        refeicaoRepository.delete(
            buscarRefeicao(refeicaoId, dia.id)
        );
    }

    private DiaRegistro buscarDia(
            Long clienteId,
            LocalDate data) {

        return diaRepository
            .findByCliente_IdAndData(clienteId, data)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Registro diario nao encontrado"
            ));
    }

    private Refeicao buscarRefeicao(
            Long refeicaoId,
            Long diaRegistroId) {

        return refeicaoRepository
            .findByIdAndDiaRegistro_Id(
                refeicaoId,
                diaRegistroId
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Refeicao nao encontrada"
            ));
    }

    private void aplicarDados(
            Refeicao refeicao,
            RefeicaoRequest request) {

        refeicao.tipo = request.tipo;
        refeicao.horario = request.horario;
    }
}
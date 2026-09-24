package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "usuario", uniqueConstraints = @UniqueConstraint(
    name = "uk_usuario_email", columnNames = "email"))
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String nome;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(name = "senha_hash", nullable = false)
    public String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Role role;

    @Column(nullable = false)
    public boolean ativo = true;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;
}
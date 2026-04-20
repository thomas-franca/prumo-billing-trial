# Backend

Esqueleto Rails API-only para o SaaS financeiro.

## Geracao recomendada quando Ruby/Rails estiverem disponiveis

```bash
rails new backend --api --database=postgresql
```

Depois, copie os arquivos deste diretorio para a aplicacao Rails gerada ou use-os como referencia para completar o projeto.

## Modulos iniciais

- Produtos
- Cupons
- Metodos de pagamento
- Assinaturas
- Faturas
- Notas fiscais
- Documentos

## Automacoes

- Geracao mensal de faturas.
- Emissao automatica de nota fiscal apos pagamento.
- Cancelamentos agendados.
- Controle de inadimplencia.
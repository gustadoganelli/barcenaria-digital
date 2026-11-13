# Pedidos — Barcenaria Digital

Registro corrido dos pedidos do Gustavo e do estado de cada um.

## Em andamento
- 2026-11-12 — Cena de rolagem focada no ofício da casa: serrote cortando a madeira na abertura, revelando a
  primeira imagem, e os nomes dos pratos saindo do corte ao rolar. Especificação em `docs/cena-serrote.md`.
  Modelo e modo pedidos: Fable 5.2, esforço alto, ultracode (autorização direta: "todos rodem no 5.2 do Fable com
  um empenho alto e ultra code").

- 2026-11-12, retorno do Gustavo sobre a primeira versão (serrote desenhado em SVG, não publicada): "tá muito de
  brinquedo, não leva um ar sério [...] pegue exemplos de vídeos reais, como se fosse uma serra de verdade, não um
  emoji". Decisão: trocar o serrote e a tábua desenhados por **filmagem real** de serrote cortando madeira,
  avançada quadro a quadro pela rolagem (sequência de quadros em canvas), nas duas cenas.
  - Vídeo: Mixkit descartado (MDF, luva, marca de ferramenta à vista). Escolhidos no Pexels (licença Pexels: uso
    comercial sem atribuição): 5972630 (abertura: mãos serrando a ripa, o toco cai) e 5973239 (bancada: serrote de
    costas). Origem e licença em `referencias/fontes-serra.md`.
  - Painel de desenho (3 propostas, sonnet) concluído em 12/11; aproveitado: corte em quatro tempos com pausa, luz
    correndo pela divisão, câmera fechando devagar.

- 2026-11-13 — "continuar, os créditos voltaram, manda pras outras sessões". Estado:
  - Versão com filmagem real pronta e conferida no servidor local em 5 tamanhos de tela (ver critérios de aceite
    em `docs/cena-serrote.md`). Ajustes do dia: costura na linha de divisão removida; bancada reorganizada para
    caber entre o cabeçalho e a barra inferior em celular real (≈390×664); filme da bancada refeito em 800×500;
    abertura estável quando a barra do navegador recolhe; sem piscar ao recarregar no meio; foco por teclado abre
    a cena.
  - Revisão por agentes (4 lentes, sonnet) com verificação (haiku): 7 achados, 7 confirmados, 7 corrigidos:
    quadro defasado enquanto o filme carrega; reprodução automática antes de os quadros chegarem; cabeçalho
    escondido e barra inferior aparecendo ao fim da abertura (duas lentes apontaram); bancada cortada em tela
    muito baixa; "pular para o conteúdo" voltando ao filme; entrada do título do início escondida sob o filme.
    Correções conferidas por teste automático (roteiros em `docs/cena-serrote.md`, critérios de aceite).
  - Sessões do Pecatto e da C41: receberam o pedido completo, o aviso de realismo e o aviso de continuar; as duas
    estavam em execução em 13/11.

### Plano de despacho (ultracode, autorizado diretamente)
| Estágio | Objetivo | Agentes | Modelo · esforço | Ferramentas | Parada |
|---|---|---|---|---|---|
| Desenho | 3 propostas independentes para aumentar o impacto das duas cenas (cinema, robustez no celular, fidelidade à marca) | ×3 | sonnet · high | leitura | uma rodada — feito em 12/11 |
| Revisão | achar defeitos na implementação por lente (movimento, desempenho no celular, acessibilidade e CSP, regressão) | ×4 | sonnet · medium | leitura | uma rodada — 13/11, até 2 achados por lente |
| Verificação | tentar refutar cada achado da revisão | 1 por achado, teto 8 | haiku · low | leitura | um voto — 13/11 |

Implementação, julgamento final, commit, push e publicação: sessão principal.

## Pendências que dependem da casa
- Gravar o serrote na própria Barcenaria para trocar a filmagem de banco de imagens (10 s, celular em tripé).
- Fotos oficiais e recortes: só após o aceite.

## Feito
- (ver `CHANGELOG.md` para as entregas anteriores a este registro)

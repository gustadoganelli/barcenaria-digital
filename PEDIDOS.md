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

- 2026-11-13, retorno do Gustavo sobre a versão publicada com filmagem real (commit 02b301c): "até ficou bom, mais
  preciso de algo mais animado, acho que exageramos quando falamos pra ser realista e ele está muito travado
  também". Decisão: filme real como base, animação por cima, e fluidez medida. Feito na mesma data:
  - Animação: placa caindo e balançando, serragem do corte pela velocidade da rolagem, palavras da casa carimbadas
    por serrada, estouro de serragem no corte, metades saindo inclinadas; peças da bancada com queda, achatamento,
    poeira e número carimbado. Filme com 20 quadros por segundo (eram 10) e cor mais quente e clara.
  - Fluidez: cinco causas do travamento encontradas por medição e corrigidas (lista e números em
    `docs/cena-serrote.md`, seção "Fluidez"). A principal estava no site original: a barra de progresso gravada
    como variável CSS na raiz do documento.
  - O mesmo retorno foi repassado às sessões do Pecatto e da C41 como régua de qualidade.

- 2026-11-13, retorno do Gustavo sobre a versão animada (commit 740d4e9): "ficou péssimo, não gostei". Perguntado,
  marcou os quatro problemas (efeitos por cima do filme, continua travando, o vídeo de serrote em si, demora para
  chegar ao site), escolheu o caminho "abertura curta, automática" e pediu para o site no ar voltar ao de antes.
  - Feito em 13/11: produção republicada a partir do commit de 04/11 (37edb52), sem abertura.
  - Feito em 13/11 (local, sem commit): vinheta de 2,7 s só em CSS e seção "Cada corte, um prato." sem prender a
    tela; quadros do filme, script de extração e registro de licença removidos; correção da barra de progresso
    mantida. Especificação reescrita em `docs/cena-serrote.md`.
  - Dois visuais gravados lado a lado (`docs/prints/vinheta-*-A-e-B.mp4`): A, madeira e serrote de aço; B, verde e
    dourado com serrote em traço.
- 2026-11-13, escolha do Gustavo: "Agora sim ficou mais interessante. Eu gostei do modelo que o fundo é verde e o
  serrote ele é dourado." Feito: o visual B virou o único, o A saiu do projeto, e a vinheta foi publicada (ver
  `CHANGELOG.md`).

- 2026-11-13, pedido do Gustavo depois de ver a vinheta no ar: "após a animação do serrote dá um efeito [...] no
  nosso projeto do C41 [...] ao entrar tem um efeito intro behind the scenes como o da Apple, podemos aplicar assim
  como no C41, tá no nosso git, pode usar de referência com o logo do Barcenaria".
  - Feito (local, sem commit): segundo tempo da vinheta em WebGL (`public/assets/js/vidro.js`, adaptado de
    `vidro.js` do repositório da C41): quando a tela se abre depois do serrote, a placa da casa aparece em vidro
    verde com a arte dourada em relevo, um feixe de luz varre e a câmera recua; depois o site entra. A vinheta
    passa de 2,7 s para cerca de 4,1 s. Sem WebGL, ou se não ficar pronto a tempo, vale o final simples.
  - Mostrado em vídeo (`docs/prints/vinheta-vidro-celular.mp4` e `vinheta-vidro-computador.mp4`).
- 2026-11-13, retorno do Gustavo: "ficou ótimo, mas o logo aparece e vai lá pra cima no canto alto esquerdo, aonde
  já está hoje no site". Feito: no fim do vidro o palco se dissolve, o site aparece por trás e a placa encolhe e
  voa até pousar sobre o logo do cabeçalho. Revisão por agentes (2 lentes) antes de publicar; publicado (ver
  `CHANGELOG.md`).

### Plano de despacho (ultracode, autorizado diretamente)
| Estágio | Objetivo | Agentes | Modelo · esforço | Ferramentas | Parada |
|---|---|---|---|---|---|
| Desenho | 3 propostas independentes para aumentar o impacto das duas cenas (cinema, robustez no celular, fidelidade à marca) | ×3 | sonnet · high | leitura | uma rodada — feito em 12/11 |
| Revisão | achar defeitos na implementação por lente (movimento, desempenho no celular, acessibilidade e CSP, regressão) | ×4 | sonnet · medium | leitura | uma rodada — 13/11, até 2 achados por lente |
| Verificação | tentar refutar cada achado da revisão | 1 por achado, teto 8 | haiku · low | leitura | um voto — 13/11 |

| Revisão 2 | achar defeitos na versão animada (laço e filme, navegadores de celular, regressão e acessibilidade) | ×3 | sonnet · medium | leitura | uma rodada — 13/11, até 2 achados por lente |
| Verificação 2 | tentar refutar cada achado | 1 por achado, teto 6 | haiku · low | leitura | um voto — 13/11 |

| Revisão 3 | achar defeitos no segundo tempo em WebGL (ciclo de vida e falhas; navegadores e layout) | ×2 | sonnet · medium | leitura | uma rodada — 13/11, até 2 achados por lente |
| Verificação 3 | tentar refutar cada achado | 1 por achado, teto 4 | haiku · low | leitura | um voto — 13/11 |

Implementação, julgamento final, commit, push e publicação: sessão principal.

## Pendências que dependem da casa
- Gravar o serrote na própria Barcenaria para trocar a filmagem de banco de imagens (10 s, celular em tripé).
- Fotos oficiais e recortes: só após o aceite.

## Feito
- (ver `CHANGELOG.md` para as entregas anteriores a este registro)

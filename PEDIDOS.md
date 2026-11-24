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

- 2026-11-16, pedido do Gustavo: "tira esse cada corte um prato". Feito e publicado: a seção saiu da página inicial,
  com os estilos, a textura das peças e o script que a gerava. A vinheta de abertura não mudou.

- 2026-11-17, pedido do Gustavo depois de ver o reel do @_marsdesigner (site conceito do Café Pilão): levar para
  as nossas páginas a tipografia gigante atrás do produto, os blocos de cor e os soltos em paralaxe, sem prender a
  rolagem; "bolar o roteiro elaborado pro Barcenaria inicialmente como teste".
  - Feito: roteiro em `docs/roteiro-vitrine.md` e teste com dois blocos (Fita Métrica e Serragem) numa página à
    parte, só no computador (`public/vitrine/`, `vitrine.css`, `vitrine.js`, recortes por
    `scripts/build-recortes.mjs`). Esses arquivos ficam fora do git e fora do ar até o aceite.
  - **Aguardando o Gustavo:** aprovar a direção pelos vídeos `docs/prints/vitrine-teste-*.mp4` e decidir se a
    vitrine substitui "Os mais pedidos da casa" ou fica junto.
- 2026-11-17, pedido do Gustavo: "coloca a animação no desenvolvido por assim como no Pecatto e nos outros".
  Feito e publicado em 23/11 na página inicial (o rodapé do cardápio digital não foi mexido).
- 2026-11-23, pedido do Gustavo: "eles lançaram um novo cardápio, confere no Instagram e atualiza".
  - Fonte: carrossel de 18/11/2026 (https://www.instagram.com/p/Df5fFo8mENN/, capa e quatro páginas) e reel de
    20/11/2026 (https://www.instagram.com/reel/Df9r_FUvWCg/). A publicação traz só comidas.
  - Feito e publicado em 23/11: comidas do cardápio digital trocadas pelas 35 novas (porções, lanches, espetos,
    pratos, sobremesas); glossário da página inicial restrito aos drinks; "Os mais pedidos" e a grade do Instagram
    com os itens novos; destaque do torresmo com nome e preço novos; harmonização dos vinhos só com pratos que
    continuam; marca de vegetariano em seis itens novos pelo mesmo critério de antes (sem carne nem peixe na
    descrição).
  - **A confirmar com a casa:** carta de bebidas (os drinks com nome de ferramenta), almoço executivo e feijoada,
    que não aparecem na publicação nova e ficaram como estavam. O destaque "Nosso Cardápio" do Instagram exige
    login. Enquanto isso o cardápio digital mostra a faixa "Cardápio em atualização" (`status: parcial`).
  - **Efeito no teste da vitrine (17/11):** Fita Métrica e Serragem, os dois pratos do teste, saíram do cardápio.
    Se a direção for aprovada, o roteiro (`docs/roteiro-vitrine.md`) precisa ser refeito com itens novos.
  - Sobraram sem uso, sem apagar: imagens `cardapio/serragem-tartare`, `cardapio/guarda-roupa-porpetas`,
    `cardapio/fita-metrica-linguini`, `cardapio/sarrafo-fraldinha`, `cardapio/compensado-burrata`,
    `pratos/linguica-artesanal`, `pratos/fraldinha-na-chapa`, `promos/fraldinha`, `promos/linguica` e
    `promos/bucha-torresmo`.
- 2026-11-23, pedido do Gustavo: "tira os preços da página inicial". Feito e publicado: glossário, "Os mais
  pedidos" e cartões de promoção sem valor; resumo da feijoada sem os preços; arte do Resina Jorge Amado trocada
  pela foto na grade do Instagram. Cardápio digital, comanda e painel seguem com preço.
- 2026-11-23/24, pedido do Gustavo: "refaz o roteiro da vitrine com os itens novos" (e, em 24/11, "vamos retomar
  isso"). Feito, só no computador:
  - `docs/roteiro-vitrine.md` reescrito: a palavra gigante passa a ser o nome do prato, a ferramenta em traço fica
    como marca da casa, e os blocos são Burger, Parmegiana, Torresmo e BarcenaIPA.
  - Teste refeito com os blocos 1 e 2 (Burger Barcenaria em verde, Parmegiana de Filé Mignon em dourado), com os
    pratos recortados dos quadros do reel de 20/11 (`scripts/build-recortes.mjs`).
  - Vídeos novos: `docs/prints/vitrine-cardapio-novo-celular.mp4` e `vitrine-cardapio-novo-computador.mp4`.
    Os de 17/11 (`vitrine-teste-*.mp4`) e os recortes `fita-metrica.webp` e `serragem.webp` ficaram sem uso, sem
    apagar.
  - 2026-11-24, retorno do Gustavo: "gostei, faz os blocos do torresmo e da barcenaipa". Feito, só no
    computador: bloco 3 (Torresmo de Rolo, tijolo escuro, machadinha em traço) e bloco 4 (BarcenaIPA, verde-noite,
    lúpulo e tampinha em traço), com a tábua e a garrafa com a taça recortadas por contorno à mão. Os dois vídeos
    foram regravados com os quatro blocos.
  - 2026-11-24, decisão do Gustavo: "substitui os mais pedidos pela vitrine". Feito no computador, sem commit e
    sem publicar: a vitrine entrou na seção Nº 03 da página inicial no lugar dos nove cartões (saem da página o
    chopp, os três drinks e a feijoada, que seguem no cardápio digital); cada bloco ganhou o atalho "Ver no
    cardápio"; fecho com "Ver o cardápio completo" e "Reservar mesa"; código e estilos dos cartões removidos; a
    página de teste `/vitrine` e o `vitrine.js` foram apagados (a entrada dos blocos passou para o `site.js`).
    Cadência medida com a GPU (números em `docs/roteiro-vitrine.md`).
  - 2026-11-24, depois de ver os vídeos da página inicial: "pode publicar". Publicado (ver `CHANGELOG.md`).

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

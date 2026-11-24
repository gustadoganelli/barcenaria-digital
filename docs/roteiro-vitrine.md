# Roteiro — "vitrine" da página inicial da Barcenaria (teste)

Pedido do Gustavo em 2026-11-17, depois de ver o reel do @_marsdesigner com um site conceito para o Café Pilão:
"iniciar pelo passo 1, mas bolar o roteiro elaborado pro Barcenaria inicialmente como teste". O passo 1 é levar
para as nossas páginas três ingredientes daquele site, **sem prender a rolagem**:

1. tipografia gigante atrás do produto, que cobre parte das letras;
2. cor de fundo chapada que troca a cada bloco;
3. elementos soltos em paralaxe leve.

O quarto ingrediente do reel (um objeto preso no centro que se transforma com a rolagem) fica de fora: é a cena
presa que já foi recusada aqui em 13/11.

**Refeito em 2026-11-24** ("refaz o roteiro da vitrine com os itens novos"): a casa trocou o cardápio de comidas em
18/11 e os dois pratos do primeiro teste (Fita Métrica e Serragem) saíram. Este roteiro usa só itens do cardápio
atual.

## O que mudou com o cardápio novo
- **As comidas não têm mais nome de ferramenta.** A palavra gigante deixa de ser o nome da peça de marcenaria e
  passa a ser o próprio nome do prato (BURGER, PARMEGIANA, TORRESMO).
- **A ferramenta em traço continua, como marca da casa**, não como legenda do prato: é o mesmo traço dourado do
  serrote da vinheta, e a casa segue sendo "bar + marcenaria".
- **As fotos são outras.** Dos itens novos, a casa só publicou foto limpa de três: o Burger Barcenaria e a
  Parmegiana de Filé Mignon (reel de 20/11) e o torresmo de rolo (posts de agosto e setembro). Lanche Barcenaria e
  Tay Chicken aparecem no reel com o letreiro "PEÇA JÁ!" por cima.

## O que não muda
- A vinheta de abertura (serrote dourado, placa em vidro pousando no logo): aprovada, não se mexe.
- O início com o vídeo da casa, o letreiro, o glossário dos drinks, "A casa", promoções, eventos, Instagram e
  "Visite".
- Regras da casa: rolagem livre; nada de filmagem de banco de imagens; nada de 3D ou vídeo de IA do prato; só fotos
  reais da Barcenaria; sem preço na página; nada vai ao ar antes de o Gustavo ver em vídeo.

## Onde entra
No lugar da seção Nº 03, "Os mais pedidos da casa" (hoje nove cartões com foto: três comidas, chopp, quatro drinks
e a feijoada). A vitrine mostra menos itens, um por bloco, com muito mais presença. **Decisão do Gustavo:**
substituir a fileira de cartões ou manter as duas. No teste nada é substituído: a vitrine fica numa página à
parte, só no computador.

## Direção de arte
- **Cores, todas da marca** (já estão em `tokens.css`): verde-placa `#1a3103`, dourado `#c9ae6a`, tijolo `#b0583a`,
  papel `#ede2c8`, verde-noite `#0b1207`. Um bloco, uma cor chapada. A troca de cor é o ritmo da seção.
- **Palavra gigante**: o nome do prato em Barlow Condensed 700, caixa alta, ocupando a largura da tela. No celular
  a palavra comprida quebra em duas linhas em volta do prato (PARME / GIANA); no computador vai em uma linha de
  ponta a ponta.
- **O prato na frente**: foto real da casa recortada (o prato inteiro, sem o fundo), com sombra projetada, cobrindo
  parte das letras. É o que dá a profundidade do reel.
- **A ferramenta em traço**: a trena aberta ou o serrote da vinheta cruzando o bloco, na cor da palavra.
- **Soltos em paralaxe**: lascas e cavacos em três profundidades (os de trás menores e mais apagados).
- **Texto de apoio**, pequeno, num canto: o selo "Cardápio novo" com o número do bloco, o nome completo, a categoria
  e a descrição. Nenhum texto inventado: nome e descrição vêm de `public/data/cardapio.json`.

## Movimento
- **Ao entrar na tela** (uma vez): a palavra desliza de lado e assenta; o prato sobe com um leve giro e passa um
  pouco do ponto antes de parar; a ferramenta se desenha; o texto de apoio entra por último, em cascata de 80 ms.
  O prato que entra pela borda da tela (Burger) desliza de lado, sem passar do ponto.
- **Com a rolagem** (sem prender nada): a palavra anda mais devagar que o prato, e os soltos andam cada um na sua
  velocidade. Feito com animação ligada à rolagem do próprio CSS, que roda fora da thread principal; onde o
  navegador não tem o recurso, fica só a entrada.
- **Em repouso**: o prato flutua 6 px num ciclo lento.
- Com "reduzir movimento": tudo parado, no lugar final.

## Blocos (ordem e conteúdo)

| Nº | Palavra | Fundo → palavra | Prato (foto) | Texto de apoio (do cardápio) | Ferramenta em traço | Recorte |
|---|---|---|---|---|---|---|
| 1 | BURGER | verde-placa → dourado | reel de 20/11 | Burger Barcenaria. Lanche. Pão de brioche, maionese de cebolinha, blend 150 g, queijo coalho, carne seca salteada na manteiga de garrafa e cebola roxa. | trena aberta atravessando a tela | pronto |
| 2 | PARMEGIANA | dourado → verde-placa | reel de 20/11 | Parmegiana de Filé Mignon. Lanche. Pão ciabatta, parmegiana de filé mignon com molho de tomate da casa, mussarela fior de latte, finalizado com pesto de manjericão. | o serrote da vinheta, em verde | pronto |
| 3 | TORRESMO | tijolo → papel | `pratos/torresmo-na-mesa` (original com 3.072 px de largura) | Torresmo de Rolo. Porção. Nosso torresmo de rolo, supercrocante e suculento, finalizado com raspas de limão. Selo "Sucesso da casa". | machadinha (a arte da casa mostra o torresmo com uma) | por fazer |
| 4 | BARCENAIPA | verde-noite → dourado | `bar/barcenaipa` | A cerveja da casa. BarcenaIPA by Dr. Ewam, 500 ml. | lúpulo e tampinha | por fazer |

Fecho da seção: faixa fina com "Ver o cardápio completo" e "Reservar mesa".

**Blocos que dependem de foto nova da casa** (entram quando houver foto limpa): Lanche Barcenaria (tilápia
empanada no ciabatta), Tay Chicken, Tábua de Espetos. Um bloco de drink com nome de ferramenta (Martelo Mojito,
Serrote Spritz) fecharia bem a ligação com a marcenaria, mas a carta de bebidas ainda não foi confirmada depois do
cardápio novo e não há foto desses drinks.

### Como cada bloco se arruma
- **Celular**: bloco de cerca de 85% da altura da tela, e mais alto quando a palavra e o texto pedem. Selo no alto;
  a palavra gigante em cima; o prato por cima dela; texto de apoio embaixo.
  - Burger: palavra em uma linha, o prato entra pela borda esquerda da tela e cobre a metade de baixo das letras.
  - Parmegiana: palavra em duas linhas, o prato no vão entre elas.
- **Computador**: faixa da largura inteira, cerca de 84% da altura. A palavra em uma linha de ponta a ponta; o
  prato baixo, cobrindo só a metade de baixo de algumas letras, para a palavra continuar legível; a ferramenta
  cruzando por trás do prato.
  - Burger: prato na borda esquerda, texto embaixo à direita. Parmegiana: prato no centro para a direita, texto
    embaixo à esquerda. Os blocos alternam o lado, para a seção não parecer uma lista.

## Limites conhecidos
- **Fotos de vídeo**: Burger e Parmegiana são quadros do reel (vídeo de 720 px de largura, com o filtro de cor
  forte da publicação). Seguram bem até uns 560 px na tela. As fotos oficiais, combinadas para depois do aceite da
  casa, resolvem tamanho e cor.
- **Prato do Burger cortado pela foto**: a borda esquerda do prato está fora do quadro, então ele entra pela
  borda esquerda da tela e não pode ir para o centro. Com foto oficial isso some.
- **Contorno do Burger**: fica um fio escuro (o sofá de couro ao fundo) em volta do pão e da carne seca. No bloco
  verde ele se confunde com a sombra; num bloco claro apareceria.
- **Recorte**: o projeto não tem ferramenta de recorte de fundo. `scripts/build-recortes.mjs` tira o prato por
  contraste e o que fica acima do prato por um polígono marcado à mão sobre a foto. Torresmo (prato escuro sobre
  mesa de madeira) e BarcenaIPA (garrafa e taça) pedem um polígono inteiro à mão.
- **Comprimento**: quatro blocos somam pouco mais de três telas de rolagem no celular, contra uma tela e meia da
  fileira de cartões. Se pesar, ficam os três de comida.

## Etapas
1. **Teste (feito em 24/11)**: página à parte (`/vitrine`, só no computador, fora do git), com os blocos 1 e 2.
   Vídeos em `docs/prints/vitrine-cardapio-novo-celular.mp4` e `vitrine-cardapio-novo-computador.mp4` para o
   Gustavo aprovar ou ajustar a direção.
2. Aprovada a direção: blocos 3 e 4, com os recortes que faltam.
3. Decisão sobre substituir ou manter "Os mais pedidos da casa"; entra na página inicial.
4. Vídeo final, aceite e publicação.

## Critérios de aceite do teste
- Rolagem livre do começo ao fim, sem nada preso.
- 390×664, 390×844 e 1440×900 sem estouro lateral, sem texto por cima do prato e com o console sem erro
  (conferido em 24/11).
- Nenhum preço e nenhum texto fora do cardápio.
- Com "reduzir movimento", os blocos aparecem parados e completos (conferido em 24/11).
- Cadência de quadros medida com a GPU, como nas outras cenas: sem tarefa longa ao rolar. **Não medida nesta
  rodada**; medir antes de levar para a página inicial.

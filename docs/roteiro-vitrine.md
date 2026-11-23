# Roteiro — "vitrine" da página inicial da Barcenaria (teste)

Pedido do Gustavo em 2026-11-17, depois de ver o reel do @_marsdesigner com um site conceito para o Café Pilão:
"iniciar pelo passo 1, mas bolar o roteiro elaborado pro Barcenaria inicialmente como teste". O passo 1 é levar
para as nossas páginas três ingredientes daquele site, **sem prender a rolagem**:

1. tipografia gigante atrás do produto, que cobre parte das letras;
2. cor de fundo chapada que troca a cada bloco;
3. elementos soltos em paralaxe leve.

O quarto ingrediente do reel (um objeto preso no centro que se transforma com a rolagem) fica de fora: é a cena
presa que já foi recusada aqui em 13/11.

## O que não muda
- A vinheta de abertura (serrote dourado, placa em vidro pousando no logo): aprovada, não se mexe.
- O início com o vídeo da casa, o letreiro, o glossário, "A casa", promoções, eventos, Instagram e "Visite".
- Regras da casa: rolagem livre; nada de filmagem de banco de imagens; nada de 3D ou vídeo de IA do prato; só fotos
  reais da Barcenaria; sem preço na página; nada vai ao ar antes de o Gustavo ver em vídeo.

## Onde entra
No lugar da seção Nº 03, "Os mais pedidos da casa" (hoje uma fileira de cartões com foto). A vitrine mostra os
mesmos itens, um por bloco, com muito mais presença. **Decisão do Gustavo:** substituir a fileira de cartões ou
manter as duas. No teste nada é substituído: a vitrine é montada numa página à parte, só no computador.

## Direção de arte
- **Cores, todas da marca** (já estão em `tokens.css`): verde-placa `#1a3103`, dourado `#c9ae6a`, tijolo `#b0583a`,
  papel `#ede2c8`, verde-noite `#0b1207`. Um bloco, uma cor chapada. A troca de cor é o ritmo da seção.
- **Palavra gigante**: o nome da peça (é o nome do prato no cardápio) em Barlow Condensed 700, caixa alta, ocupando
  a largura da tela (cerca de 30% da largura por letra no celular, quebrando em duas linhas quando precisa). Fica
  atrás do prato, em cor forte contra o fundo.
- **O prato na frente**: foto real da casa recortada (o prato inteiro, sem o fundo), com sombra projetada, cobrindo
  parte das letras. É o que dá a profundidade do reel.
- **A ferramenta em traço dourado**: cada peça tem a sua ferramenta desenhada no mesmo traço do serrote da vinheta,
  cruzando o bloco (a trena medindo o prato da Fita Métrica, por exemplo). É o elo com a marcenaria.
- **Soltos em paralaxe**: lascas, cavacos e parafusos em três profundidades (os de trás menores e mais apagados).
- **Texto de apoio**, pequeno, num canto: número da peça, o que chega à mesa e a descrição do cardápio. Nenhum texto
  inventado: nome, prato e descrição vêm de `public/data/cardapio.json`.

## Movimento
- **Ao entrar na tela** (uma vez): a palavra desliza de lado e assenta; o prato sobe com um leve giro e passa um
  pouco do ponto antes de parar; a ferramenta se desenha; o texto de apoio entra por último, em cascata de 80 ms.
- **Com a rolagem** (sem prender nada): a palavra anda mais devagar que o prato, e os soltos andam cada um na sua
  velocidade. Feito com animação ligada à rolagem do próprio CSS, que roda fora da thread principal; onde o
  navegador não tem o recurso, fica só a entrada.
- **Em repouso**: o prato flutua 6 px num ciclo lento.
- Com "reduzir movimento": tudo parado, no lugar final.

## Blocos (ordem e conteúdo)

| Nº | Palavra | Fundo → palavra | Prato (foto) | Texto de apoio (do cardápio) | Ferramenta em traço |
|---|---|---|---|---|---|
| 1 | FITA MÉTRICA | verde-placa → dourado | `cardapio/fita-metrica-linguini` | Linguini grano duro. Ao molho pesto de rúcula, tomate confitado e burrata cremosa. | trena aberta atravessando a tela, com as marcas |
| 2 | COMPENSADO | dourado → verde-placa | `cardapio/compensado-burrata` | Burrata fresca cremosa. Rúcula, presunto parma, tomate confitado e pesto de manjericão. | três lâminas de madeira sobrepostas |
| 3 | BUCHA | tijolo → papel | `pratos/bucha-torresmo-de-rolo` | Panceta em rolo. Pururucada perfeitamente crocante, temperada com raspas de limão-siciliano e acompanhada de geleia de pimenta. Selo "Sucesso da casa". | parafuso e bucha |
| 4 | SARRAFO | papel → tijolo | `cardapio/sarrafo-fraldinha` | Fraldinha na chapa. Acompanhada de farofa e vinagrete. | o serrote da vinheta, em verde |
| 5 | BARCENAIPA | verde-noite → dourado | `bar/barcenaipa` | A cerveja da casa. "O marceneiro também sabe fazer cerveja." | lúpulo e tampinha |

Fecho da seção: faixa fina com "Ver o cardápio completo" e "Reservar mesa".

### Como cada bloco se arruma
- **Celular**: bloco de cerca de 85% da altura da tela. Número e nome pequeno no alto; a palavra gigante no meio,
  em uma ou duas linhas; o prato centralizado por cima dela; texto de apoio embaixo.
- **Computador**: faixa da largura inteira, cerca de 80% da altura. A palavra em uma linha de ponta a ponta; o
  prato no centro, um pouco para a direita; texto de apoio embaixo à esquerda; a ferramenta cruzando por trás do
  prato e na frente da palavra.
- Blocos pares e ímpares alternam o lado do texto, para a seção não parecer uma lista.

## Limites conhecidos
- **Recorte dos pratos**: o projeto não tem ferramenta de recorte de fundo. Nos pratos brancos (Fita Métrica,
  Compensado) o recorte sai por contraste, com qualidade boa. Na Bucha (tábua de madeira sobre mesa de madeira, com
  o machado para fora), no Sarrafo e na BarcenaIPA o recorte precisa ser feito à mão ou com ferramenta própria.
- **Tamanho das fotos**: as fotos atuais vêm do Instagram e têm de 440 a 750 px de largura. Dá para o prato ocupar
  até uns 420 px na tela sem ficar mole; para ficar maior no computador, é preciso a foto original (as fotos
  oficiais estão combinadas só para depois do aceite da casa).
- **Comprimento**: cinco blocos somam cerca de quatro telas de rolagem no celular, contra uma tela e meia da fileira
  de cartões. Se pesar, corta-se para três blocos.

## Etapas
1. **Teste (esta rodada)**: página à parte, só no computador, com os blocos 1 e 2, que são os de recorte limpo.
   Vídeo no celular e no computador para o Gustavo aprovar ou ajustar a direção.
2. Aprovada a direção: blocos 3, 4 e 5, com os recortes que faltam.
3. Decisão sobre substituir ou manter "Os mais pedidos da casa"; entra na página inicial.
4. Vídeo final, aceite e publicação.

## Critérios de aceite do teste
- Rolagem livre do começo ao fim, sem nada preso.
- 390×664 e 1440×900 sem estouro lateral e com o console sem erro.
- Nenhum preço e nenhum texto fora do cardápio.
- Com "reduzir movimento", os blocos aparecem parados e completos.
- Cadência de quadros medida com a GPU, como nas outras cenas: sem tarefa longa ao rolar.

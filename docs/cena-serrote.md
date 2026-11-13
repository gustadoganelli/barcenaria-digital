# Cena de rolagem "do serrote ao cardápio" — especificação

Pedido do Gustavo em 2026-11-12: "um efeito maior focado na causa deles [...] inicia de uma marcenaria cortando
uma madeira, um serrote cortando uma madeira, em uma animação com scroll. E aí aparece aquela primeira imagem lá
do Barcenaria, e quando a gente desce, ele passa para essa animação e aí apresenta o nome dos pratos que tem".
Autorização direta para esta tarefa: "todos rodem no 5.2 do Fable com um empenho alto e ultra code".

Retorno do Gustavo em 2026-11-12 sobre a primeira versão (serrote e tábua desenhados em SVG, nunca publicada):
"tá muito de brinquedo, não leva um ar sério [...] pegue exemplos de vídeos reais, como se fosse uma serra de
verdade". Decisão: **filmagem real**, avançada quadro a quadro pela rolagem. Nada de serrote desenhado.

## Roteiro

### Cena 1 — "O corte" (abertura, primeira tela)
- A página abre num filme de um serrote cortando uma ripa de madeira, em tela cheia, com a placa da Barcenaria,
  o lema "aqui, a cozinha é oficina" e a dica "Role para serrar".
- A rolagem é o projetor: cada trecho rolado avança o filme (o serrote vai e vem, a serragem cai, o toco se solta
  e cai). A câmera fecha devagar (7%) durante o corte. Rolar para cima volta o filme.
- Quatro tempos: serrar (0–70% do trecho), uma linha de luz corre pela divisão (70–78%), as duas metades da imagem
  se apertam um instante (78–82%) e se afastam, uma para cima e outra para baixo (82–100%), revelando a primeira
  imagem do site, que já existia (vídeo e título).
- Parado 3,5 s no topo sem tocar em nada, o filme roda sozinho (a rolagem é conduzida com easing, 6,5 s);
  qualquer toque, roda do mouse ou tecla cancela. Tocar na tela também roda (5,2 s).

### Cena 2 — "A bancada" (entre o letreiro e o glossário)
- Palco preso na tela: título "Cada corte, um prato.", um segundo filme (serrote de costas na bancada) que avança
  com a rolagem e, a cada trecho, uma peça de madeira pousa na pilha com o nome do item e o prato que chega à mesa:
  Viga (picanha na chapa), Sarrafo (fraldinha na chapa), Serragem (tartare de salmão), Fita Métrica (linguini
  grano duro), Guarda-Roupa (8 porpetas caseiras). Dados de `public/data/cardapio.json`.
- A peça cai 64 px com giro de 5° e assenta com um passo além do ponto final (overshoot).
- No fim, link para o cardápio completo; em seguida vem o glossário interativo que já existia.

## Técnica
- Sequência de quadros WebP desenhada em `<canvas>` (o mesmo método das páginas de produto que "rodam" um vídeo
  com a rolagem). Um `<video>` com `currentTime` trava no celular; quadros soltos não.
- Três conjuntos em `public/video/serra/`, descritos em `serra.json`:
  `p` (720×1280, celular em pé), `l` (1280×720, telas largas) e `b` (800×500, bancada).
  A página escolhe `p` ou `l` pela proporção da janela e só carrega um deles; `b` só começa a carregar quando a
  bancada está a uma tela de distância.
- O primeiro quadro é pré-carregado no `<head>`; os demais chegam 4 por vez. Se um quadro ainda não chegou, a tela
  mostra o anterior mais próximo (o filme nunca fica em branco).
- A abertura são duas metades (`.corte__cima`, `.corte__baixo`), cada uma com um canvas do tamanho da tela inteira,
  que juntas mostram uma imagem só; a abertura é o `translateY` de cada metade.
- A posição da rolagem é a única fonte de verdade: um `requestAnimationFrame` por evento de rolagem calcula quadro,
  `transform` e `opacity`. A reprodução automática apenas conduz a rolagem.
- Geração dos quadros: `node scripts/build-serra.mjs` (ffmpeg). Origem e licença dos vídeos:
  `referencias/fontes-serra.md` (Pexels, uso comercial sem atribuição). Os `.mp4` originais ficam fora do git.

## Regras
- Sem preço na página do site. Nomes e descrições só do `cardapio.json`.
- O texto fica no HTML. Sem JS ou com `prefers-reduced-motion`: a abertura não é renderizada e a bancada vira uma
  lista simples e visível. Tudo da cena vive sob `html.corte-on`, ligada por `corte-boot.js` antes da primeira
  pintura; se `corte.js` não chegar em 4 s, a classe sai e a página aparece normal.
- Só `transform` e `opacity` nos elementos animados.
- CSP: sem `style=""` no HTML, sem `data:` em imagem; scripts, estilos, quadros e o manifesto só de origem própria.
- A abertura usa `vh` (janela grande) em tudo, de propósito: o palco, a linha de divisão e os dois canvases mantêm
  um tamanho só enquanto a barra do navegador do celular aparece e some. A bancada usa `svh` e reserva o espaço do
  cabeçalho fixo e da barra inferior, para a 5ª peça nunca ficar escondida.
- Teclado: foco em qualquer elemento sob o filme abre a cena na hora.

## Critérios de aceite (conferidos em 2026-11-13, servidor local)
- 375×553, 390×664, 390×844, 1024×768 e 1440×900: rolar do topo ao fim da cena 2 e voltar, sem estouro lateral e
  com o console sem erro; as 5 peças visíveis acima da barra inferior.
- Abrir em `/#oficina` ou recarregar no meio da página: o filme não fica na frente do conteúdo.
- Reprodução automática termina com o filme fora da tela; "reduzir movimento" mostra a lista simples.
- Girar o aparelho troca o conjunto de quadros. Tab no topo abre a cena.
- Página inicial sem nenhum preço novo; o que já existia continua funcionando (vídeo, menu, glossário, promoções).

## Arquivos
- `public/assets/js/corte-boot.js` (liga a cena antes da primeira pintura), `public/assets/js/corte.js`,
  `public/assets/css/corte.css`, marcação em `public/index.html` (`#corte`, `.corte-espaco`, `#bancada`).
- `public/video/serra/` (quadros e `serra.json`), `public/images/brand/madeira-clara.webp` (textura das peças).
- `scripts/build-serra.mjs`, `scripts/build-madeira.mjs`, `referencias/fontes-serra.md`.

## Próximo passo sugerido
Trocar a filmagem de banco de imagens por uma gravação feita na casa (serrote de verdade na bancada da Barcenaria,
celular em tripé, 10 s): basta substituir os arquivos em `referencias/serra/` e rodar o script.

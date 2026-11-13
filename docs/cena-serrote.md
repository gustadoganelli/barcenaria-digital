# Cena de rolagem "do serrote ao cardápio" — especificação

Pedido do Gustavo em 2026-11-12: "um efeito maior focado na causa deles [...] inicia de uma marcenaria cortando
uma madeira, um serrote cortando uma madeira, em uma animação com scroll. E aí aparece aquela primeira imagem lá
do Barcenaria, e quando a gente desce, ele passa para essa animação e aí apresenta o nome dos pratos que tem".
Autorização direta para esta tarefa: "todos rodem no 5.2 do Fable com um empenho alto e ultra code".

Dois retornos calibraram a cena:
- 2026-11-12, sobre a primeira versão (serrote e tábua desenhados em SVG, nunca publicada): "tá muito de
  brinquedo, não leva um ar sério [...] pegue exemplos de vídeos reais". Decisão: filmagem real como base.
- 2026-11-13, sobre a versão publicada só com a filmagem: "até ficou bom, mas preciso de algo mais animado, acho
  que exageramos quando falamos pra ser realista e ele está muito travado também". Decisão: **filme real como
  base, animação por cima**, e a fluidez tratada como requisito medido (seção "Fluidez").

## Roteiro

### Cena 1 — "O corte" (abertura, primeira tela)
- A página abre num filme de um serrote cortando uma ripa, em tela cheia. A placa da Barcenaria cai como uma
  placa pendurada, balança e fica num vaivém lento; o lema "aqui, a cozinha é oficina" e a dica "Role para
  serrar" sobem em seguida.
- A rolagem é o projetor: avança o filme (o serrote vai e vem, o toco se solta e cai), com a câmera fechando 8%.
  A imagem segue a rolagem com uma pequena inércia, então desliza em vez de pular a cada passo da roda do mouse.
- Por cima do filme, enquanto o serrote trabalha:
  - serragem voa do ponto do corte, tanto quanto a rolagem estiver andando;
  - as palavras da casa entram uma por serrada, carimbadas com overshoot: "Boa comida", "Boa música", "Boas
    histórias" (a frase que já está no início do site).
- O corte passa: uma linha de luz corre pela divisão, a serragem estoura ao longo dela, as duas metades se
  apertam um instante e se afastam com uma leve inclinação, como duas tábuas se soltando, revelando o início do
  site (que já estava pronto por trás). O título do início faz a entrada palavra por palavra nesse momento.
- Parado 3,5 s no topo sem tocar em nada, o filme roda sozinho (6,5 s), desde que 75% dos quadros já tenham
  chegado; qualquer toque, roda do mouse ou tecla cancela. Tocar na tela também roda (5,2 s). Rolar para cima
  volta o filme.

### Cena 2 — "A bancada" (entre o letreiro e o glossário)
- Palco preso na tela: título "Cada corte, um prato.", um segundo filme (serrote de costas na bancada) que avança
  com a rolagem e, a cada trecho, uma peça de madeira cai na pilha com o nome do item e o prato que chega à mesa:
  Viga (picanha na chapa), Sarrafo (fraldinha na chapa), Serragem (tartare de salmão), Fita Métrica (linguini
  grano duro), Guarda-Roupa (8 porpetas caseiras). Dados de `public/data/cardapio.json`.
- A peça cai de 170 px com gravidade (começa devagar, chega rápido) e 9° de giro, achata ao bater, assenta, levanta
  poeira nas duas pontas e recebe o número carimbado.
- No fim, link para o cardápio completo; em seguida vem o glossário interativo que já existia.

## Técnica
- **Filme**: quadros WebP (20 por segundo de filmagem na abertura, 12 na bancada) em `public/video/serra/`,
  descritos em `serra.json`: `p` (720×1280, celular em pé), `l` (1280×720, telas largas), `b` (800×500, bancada).
  A página escolhe `p` ou `l` pela proporção da janela; `b` só carrega quando a bancada está a uma tela de
  distância. O tratamento de cor (mais quente, um pouco mais claro e contrastado) é aplicado na geração.
- **Desenho**: os quadros chegam como blob e uma janela em volta da posição atual (14 à frente, 4 atrás) fica
  decodificada como `ImageBitmap`, o que o navegador faz fora da thread principal. Desenhar um quadro é uma cópia
  no canvas, que tem a resolução do próprio filme; o navegador faz a escala (`object-fit: cover`) e o zoom é
  `transform`.
- **Laço**: um único `requestAnimationFrame` para tudo, que só roda enquanto algo se move. Ele aproxima uma
  "rolagem suavizada" da rolagem real (constante de 110 ms; salta direto em pulos de mais de 3 telas) e entrega a
  cada cena a posição, a velocidade e o tempo do quadro. Só `transform` e `opacity` são escritos.
- **Abertura**: duas metades (`.corte__cima`, `.corte__baixo`), cada uma com um canvas do tamanho da tela, que
  juntas mostram uma imagem só. O início do site fica preso (`position: sticky`) dentro de `.corte-pista`, com o
  espaçador `.corte-espaco` (220svh) depois dele: o filme tem a sua rolagem e o início já está pintado por trás.
- **Serragem e poeira**: partículas simples em canvas transparente (`.corte__po`, `.bancada__po`).
- Geração dos quadros: `node scripts/build-serra.mjs` (ffmpeg). Origem e licença dos vídeos:
  `referencias/fontes-serra.md` (Pexels, uso comercial sem atribuição). Os `.mp4` originais ficam fora do git.

## Fluidez (medida em 2026-11-13, Chrome com GPU Intel UHD, rolagem em passos de roda do mouse)
Causas do travamento da primeira versão publicada, em ordem de peso, e o que resolveu cada uma:
1. `site.js` gravava a barra de progresso como variável CSS no `<html>` a cada rolagem, o que recalculava o estilo
   da página inteira (tarefas de 50–150 ms). Agora a variável vai só nos dois elementos que a usam.
2. Cada quadro do filme era decodificado na hora de desenhar. Agora há a janela de quadros já decodificados.
3. O início do site e as seções seguintes eram pintados no meio do filme, quando chegavam perto por baixo dele.
   Agora o início fica preso e pintado desde o carregamento, e as seções depois dele ficam com
   `visibility: hidden` até a abertura terminar, quando são liberadas uma a uma (classe `.corte-visto`), ou todas
   de uma vez na primeira tecla.
4. A abertura totalmente opaca deixava o navegador não compor o que estava atrás, e a primeira mexida das metades
   custava um engasgo. A abertura tem `opacity: 0.999` de propósito.
5. 10 quadros por segundo de filme davam passos visíveis; agora são 20, com a rolagem suavizada.

Resultado (quadros acima de 34 ms numa passada pela cena; antes → depois): abertura no computador 26 → 11, com o
pior quadro de 283 ms → 100 ms; bancada no computador 33 → 3; abertura no celular 23 → 10; bancada no celular
24 → 1. Nenhuma tarefa longa na thread principal durante o filme.

## Regras
- Sem preço na página do site. Nomes e descrições só do `cardapio.json`; as palavras da abertura são a frase que
  já está no início do site.
- O texto fica no HTML. Sem JS ou com `prefers-reduced-motion`: a abertura não é renderizada e a bancada vira uma
  lista simples e visível. Tudo da cena vive sob `html.corte-on`, ligada por `corte-boot.js` antes da primeira
  pintura; se `corte.js` não chegar em 4 s, ou o navegador não tiver `createImageBitmap`, a classe sai e a página
  aparece normal.
- CSP: sem `style=""` no HTML, sem `data:` nem `blob:` em imagem; scripts, estilos, quadros e o manifesto só de
  origem própria (os quadros entram por `fetch`, coberto por `connect-src 'self'`).
- A abertura usa `vh` (janela grande) em tudo, de propósito: o palco, a linha de divisão e os dois canvases mantêm
  um tamanho só enquanto a barra do navegador do celular aparece e some. A bancada usa `svh` e reserva o espaço do
  cabeçalho fixo e da barra inferior, para a 5ª peça nunca ficar escondida. Abaixo de 34,5rem de altura (celular
  deitado, zoom alto) a bancada vira seção simples.
- Teclado: a primeira tecla libera a página inteira; foco em qualquer elemento sob o filme abre a cena.

## Critérios de aceite
- 375×553, 390×664, 390×844, 1024×768 e 1440×900: rolar do topo ao fim da cena 2 e voltar, sem estouro lateral e
  com o console sem erro; as 5 peças visíveis acima da barra inferior.
- Abrir em `/#oficina` ou recarregar no meio da página: o filme não fica na frente e as seções estão visíveis.
- Reprodução automática termina com o filme fora da tela; "reduzir movimento" mostra a página simples.
- "Pular para o conteúdo", o logo e "voltar ao topo" levam ao início do site, não ao filme.
- Girar o aparelho troca o conjunto de quadros. Tab no topo abre a cena.
- Fluidez: medir de novo com os mesmos passos antes de publicar mudança grande na cena.

## Arquivos
- `public/assets/js/corte-boot.js` (liga a cena antes da primeira pintura), `public/assets/js/corte.js`,
  `public/assets/css/corte.css`, marcação em `public/index.html` (`#corte`, `.corte-pista`, `.corte-espaco`,
  `#bancada`); ajustes em `public/assets/js/site.js` (`initChrome`).
- `public/video/serra/` (quadros e `serra.json`), `public/images/brand/madeira-clara.webp` (textura das peças).
- `scripts/build-serra.mjs`, `scripts/build-madeira.mjs`, `referencias/fontes-serra.md`.

## Próximo passo sugerido
Trocar a filmagem de banco de imagens por uma gravação feita na casa (serrote de verdade na bancada da Barcenaria,
celular em tripé, 10 s): basta substituir os arquivos em `referencias/serra/` e rodar o script.

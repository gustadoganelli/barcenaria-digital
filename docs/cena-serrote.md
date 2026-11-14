# Abertura "o corte" e seção "Cada corte, um prato." — especificação

Pedido do Gustavo em 2026-11-12: um efeito "focado na causa deles", com um serrote cortando madeira na abertura e
os nomes dos pratos em seguida. Três tentativas foram recusadas antes do formato atual:

| Data | Tentativa | Retorno do Gustavo |
|---|---|---|
| 12/11 | Serrote e tábua desenhados em SVG, guiados pela rolagem (não publicada) | "muito de brinquedo, não leva um ar sério" |
| 13/11 | Filmagem real de serrote (banco de imagens) avançada pela rolagem (publicada, commit 02b301c) | "preciso de algo mais animado [...] está muito travado" |
| 13/11 | A mesma filmagem com animação por cima: palavras, serragem, placa (publicada, commit 740d4e9) | "ficou péssimo, não gostei" — errou em tudo: efeitos por cima, travamento, o vídeo de banco de imagens em si e a demora para chegar ao site |

Decisão de 13/11, escolhida por ele: **abertura curta e automática**, sem depender da rolagem. O site no ar voltou
para a versão de 04/11 até a nova ser aprovada.

## Formato atual: vinheta de 2,7 s

- Toca sozinha ao carregar a página inicial, por cima do site, que carrega por trás.
- Visual no desenho da placa da casa: fundo verde-escuro com moldura dourada de fio duplo, e tudo o que se move
  em dourado.
- Roteiro: a placa da Barcenaria aparece (0,1–0,8 s); um serrote em traço dourado entra pela esquerda, corta em
  dois golpes e sai pela direita, deixando a linha do corte e uma dúzia de lascas (0,5–1,5 s); as duas metades se
  apertam um instante e se afastam (1,6–2,7 s); o título do início do site entra palavra por palavra.
- Não bloqueia a página (`pointer-events: none`) e qualquer toque, rolagem ou tecla a dispensa na hora.
- Não toca com "reduzir movimento", sem JavaScript, em link direto para uma seção (`/#oficina`) nem ao voltar pelo
  botão do navegador.
- Só CSS: nenhuma filmagem, nenhuma sequência de quadros, nenhum laço de JavaScript. Só `transform` e `opacity`
  são animados. Peso: o desenho do serrote (SVG, 2 KB); o fundo é gradiente.

### Escolha do visual (13/11)
Foram gravados dois visuais lado a lado: A, parede de pranchas escuras com serrote de aço; B, verde e dourado no
desenho da placa. O Gustavo escolheu o B: "Agora sim ficou mais interessante. Eu gostei do modelo que o fundo é
verde e o serrote ele é dourado." O A saiu do projeto. A comparação ficou em
`docs/prints/vinheta-celular-A-e-B.mp4` e `vinheta-computador-A-e-B.mp4`.

## Seção "Cada corte, um prato."
- Seção comum, entre o letreiro e o glossário; não prende a tela.
- Cinco peças de madeira com o nome do item e o prato que chega à mesa: Viga (picanha na chapa), Sarrafo
  (fraldinha na chapa), Serragem (tartare de salmão), Fita Métrica (linguini grano duro), Guarda-Roupa (8 porpetas
  caseiras). Dados de `public/data/cardapio.json`. Sem preço.
- As peças entram com a revelação que o site já tinha (`.reveal` de `site.js`), só que pousando de cima com uma
  leve inclinação.

## O que ficou das tentativas anteriores
- `site.js` gravava a barra de progresso como variável CSS no `<html>` a cada rolagem, o que recalculava o estilo
  da página inteira (tarefas de 50–150 ms, medidas em 13/11). Agora a variável vai só nos dois elementos que a
  usam. Vale para o site todo, com ou sem abertura.
- Nada mais: quadros do filme, script de extração e registro de licença foram removidos do projeto. Os dois vídeos
  originais continuam em `referencias/serra/` na máquina, fora do git.

## Regras
- CSP: sem `style=""` no HTML; imagens e estilos só de origem própria.
- A vinheta usa `vh` (janela grande) em tudo, para as duas metades manterem um tamanho só enquanto a barra do
  navegador do celular aparece e some.
- Mudança visual na vinheta só vai ao ar depois de o Gustavo ver em vídeo.

## Arquivos
- `public/assets/js/corte-boot.js` (decide antes da primeira pintura se a vinheta toca; dispensa ao toque),
  `public/assets/css/corte.css` (vinheta e seção), marcação em `public/index.html` (`.corte`, `#bancada`).
- `public/images/brand/serrote-traco.svg` (serrote), `madeira-clara.webp` (textura das peças, gerada por
  `scripts/build-madeira.mjs`).

## Como gravar a vinheta para conferência
Os roteiros de captura ficam fora do projeto. O método: abrir a página num Chromium sem janela, pausar todas as
animações (`document.getAnimations()`), avançar `currentTime` de 40 em 40 ms tirando um print por passo (removendo
a classe `corte-pula` a cada passo, porque a captura é mais lenta que o tempo real) e juntar os prints a 25 quadros
por segundo com o ffmpeg.

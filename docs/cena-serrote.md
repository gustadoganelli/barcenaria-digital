# Abertura "o corte" (vinheta da página inicial) — especificação

Pedido do Gustavo em 2026-11-12: um efeito "focado na causa deles", com um serrote cortando madeira na abertura e
os nomes dos pratos em seguida. Três tentativas foram recusadas antes do formato atual:

| Data | Tentativa | Retorno do Gustavo |
|---|---|---|
| 12/11 | Serrote e tábua desenhados em SVG, guiados pela rolagem (não publicada) | "muito de brinquedo, não leva um ar sério" |
| 13/11 | Filmagem real de serrote (banco de imagens) avançada pela rolagem (publicada, commit 02b301c) | "preciso de algo mais animado [...] está muito travado" |
| 13/11 | A mesma filmagem com animação por cima: palavras, serragem, placa (publicada, commit 740d4e9) | "ficou péssimo, não gostei" — errou em tudo: efeitos por cima, travamento, o vídeo de banco de imagens em si e a demora para chegar ao site |

Decisão de 13/11, escolhida por ele: **abertura curta e automática**, sem depender da rolagem. O site no ar voltou
para a versão de 04/11 até a nova ser aprovada.

## Formato atual: vinheta curta e automática (2,7 s; cerca de 4,2 s com o segundo tempo)

- Toca sozinha ao carregar a página inicial, por cima do site, que carrega por trás.
- Visual no desenho da placa da casa: fundo verde-escuro com moldura dourada de fio duplo, e tudo o que se move
  em dourado.
- Roteiro: a placa da Barcenaria aparece (0,1–0,8 s); um serrote em traço dourado entra pela esquerda, corta em
  dois golpes e sai pela direita, deixando a linha do corte e uma dúzia de lascas (0,5–1,5 s); as duas metades se
  apertam um instante e se afastam (1,6–2,7 s); o título do início do site entra palavra por palavra.
- Não bloqueia a página (`pointer-events: none`) e qualquer toque, rolagem ou tecla a dispensa na hora.
- Não toca com "reduzir movimento", sem JavaScript, em link direto para uma seção (`/#oficina`) nem ao voltar pelo
  botão do navegador.
- O primeiro tempo é só CSS: nenhuma filmagem, nenhuma sequência de quadros, nenhum laço de JavaScript; só
  `transform` e `opacity` são animados. Peso: o desenho do serrote (SVG, 2 KB); o fundo é gradiente.

### Escolha do visual (13/11)
Foram gravados dois visuais lado a lado: A, parede de pranchas escuras com serrote de aço; B, verde e dourado no
desenho da placa. O Gustavo escolheu o B: "Agora sim ficou mais interessante. Eu gostei do modelo que o fundo é
verde e o serrote ele é dourado." O A saiu do projeto. A comparação ficou em
`docs/prints/vinheta-celular-A-e-B.mp4` e `vinheta-computador-A-e-B.mp4`.

### Segundo tempo: a placa em vidro (pedido e aprovação de 13/11)
Pedido do Gustavo: aplicar depois do serrote o efeito da abertura do site da C41 ("intro behind the scenes como o
da Apple"), com o logo da Barcenaria. Visto em vídeo, ele aprovou ("ficou ótimo") e pediu o final: "o logo aparece
e vai lá pra cima no canto alto esquerdo, aonde já está hoje no site".
- Quando a tela se abre, em vez de mostrar o site direto, mostra a placa da casa como uma chapa de vidro verde na
  frente de luz quente: refração com um pouco de dispersão, chanfros acesos, a arte dourada em relevo, um feixe de
  luz que varre da esquerda para a direita e a câmera recuando (1,2–3,2 s).
- A partir de 3,2 s o palco se dissolve dentro do próprio canvas (o site aparece por trás, com o título entrando)
  e a placa encolhe e voa até pousar exatamente sobre o logo do cabeçalho (4,0 s); a camada some em seguida.
  Duração total: cerca de 4,2 s.
- Técnica: um shader de fragmento em WebGL (`public/assets/js/vidro.js`), adaptado do `vidro.js` do site da C41,
  com a paleta da casa e saída com alfa pré-multiplicado. A máscara da placa (`logo-vidro.webp`, 1024 × 1024, com
  contorno, relevo e arte dourada em três canais) é gerada por `scripts/build-vidro.mjs` a partir de
  `referencias/brand/logo-placa.png`; o quadrado em potência de dois permite mipmaps, para a placa ficar limpa
  quando pequena.
- O relógio do shader é a própria animação CSS da metade de cima da tela, então os dois tempos andam juntos. O
  destino do voo é lido do `getBoundingClientRect()` do `.brand__logo`.
- Só entra se estiver pronto antes de a tela se abrir (1,45 s). Sem WebGL, com carregamento lento ou se o visitante
  dispensar a vinheta, vale o final simples (a tela se abre direto para o site).
- Vídeos: `docs/prints/vinheta-vidro-celular.mp4` e `vinheta-vidro-computador.mp4`.

## Seção "Cada corte, um prato." (retirada em 16/11)
A seção com as cinco peças de madeira e os nomes dos pratos (Viga, Sarrafo, Serragem, Fita Métrica, Guarda-Roupa)
ficou no ar de 13 a 16/11. O Gustavo pediu para tirar em 16/11: "tira esse cada corte um prato". Saíram a
marcação, os estilos, a textura `madeira-clara.webp` e o `scripts/build-madeira.mjs`.

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
  `public/assets/css/corte.css` (vinheta), `public/assets/js/vidro.js` (segundo tempo, WebGL), marcação em
  `public/index.html` (`.corte`).
- `public/images/brand/serrote-traco.svg` (serrote), `logo-vidro.webp` (máscara da placa, gerada por
  `scripts/build-vidro.mjs`).

## Como gravar a vinheta para conferência
Os roteiros de captura ficam fora do projeto. O método: abrir a página num Chromium sem janela, pausar todas as
animações (`document.getAnimations()`), avançar `currentTime` de 40 em 40 ms tirando um print por passo (removendo
a classe `corte-pula` a cada passo, porque a captura é mais lenta que o tempo real) e juntar os prints a 25 quadros
por segundo com o ffmpeg. O segundo tempo acompanha porque lê o relógio da animação CSS; para ele a captura
precisa de um Chrome com WebGL e de `--corte-vidro-t` zerada.

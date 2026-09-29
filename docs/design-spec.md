# Barcenaria Digital — especificação de design e construção (fase 1)

Data: 2026-09-29 · Autor: Gustavo Doganelli (com Claude) · Status: aprovado para construção

Protótipo de apresentação para a visita de 2026-10-02. Dois entregáveis estáticos, sem build step,
servidos pela Vercel a partir de `public/`:

1. **Site** one-page — `public/index.html`
2. **Cardápio digital** (acesso via QR na mesa) — `public/cardapio/index.html`
   + página imprimível de QR — `public/cardapio/qr/index.html`

Rodar local: `npm run dev` → http://127.0.0.1:4180 (servidor em `scripts/serve.mjs`, imita `cleanUrls`).

---

## 1. Direção de arte

**Conceito: "Taverna de bairro, placa de madeira e letreiro dourado."** A marca é uma placa verde
escura com filetes e letras douradas, caneca de chopp e arabescos vintage (ver
`public/images/brand/logo-placa-*.webp`, PNG transparente). As artes da casa no Instagram usam preto +
dourado, serifa romana em caixa alta (estilo Trajan), script manuscrito para frases de efeito e, na
arte da Bucha, um layout de **jornal antigo em papel kraft** ("A tradição que vira notícia",
"Edição especial"). O site traduz isso em:

- Fundo verde-quase-preto (`--bg`), superfícies em verde da placa, **dourado como único acento**.
- Tipografia: **Cinzel** (display, caixa alta, títulos curtos), **Barlow / Barlow Semi Condensed**
  (corpo e UI), **Yellowtail** (script, usar no máximo 1 vez por seção, frases curtas).
- Ornamentos finos: filetes dourados de 1px, losango central (◆ desenhado em SVG/CSS, não emoji),
  cantos com moldura dupla como as artes da casa. Arco no topo (`--radius-arch`) ecoando o formato
  da placa — usar em 1–2 molduras de destaque (ex.: vídeo do hero), não em tudo.
- Um bloco "editorial em papel kraft" (`--paper`) para quebrar o escuro: usar na seção de Eventos
  ou no destaque do "sucesso da casa". Tipografia escura sobre kraft.
- Fotos reais da casa (quadros dos reels + fotos do feed). Nada de banco de imagens.

**Dials** (design-director): Site = Variância 6 · Motion 7 · Densidade 3.
Cardápio = Variância 3 · Motion 3 · Densidade 6.

**Preset base:** Editorial + Warm Organic, em versão escura, com os tokens da marca sobrepostos.

### Tokens
Todos em `public/assets/css/tokens.css` (já existe — **não duplicar valores**; importar este arquivo
primeiro em cada página e usar `var(--…)`). Proibido hex/px de espaçamento soltos fora do `:root`,
exceto 1px de borda e micro-transforms. Se faltar token, adicionar em `tokens.css` (comentado).

Fontes (Google Fonts, `display=swap`, com `preconnect`):
`Cinzel:wght@500;600;700`, `Barlow:wght@400;500;600`, `Barlow+Semi+Condensed:wght@500;600;700`,
`Yellowtail`.

Ícones: **SVG inline monocromático, um único estilo** (traço 1.75, cantos arredondados, 24px, estilo
Lucide desenhado à mão no próprio HTML/JS). Nunca emoji como ícone. Ícones necessários: menu,
fechar, WhatsApp, Instagram, mapa/pin, navegação (seta), relógio, calendário, caneca, busca, sol/lua
(tema), compartilhar, copiar, impressora, seta para cima.

---

## 2. Dados (fonte única — não copiar conteúdo para o HTML além do essencial)

- `public/data/casa.json` — nome, endereço, links de mapa, horários por dia (`dia` = `Date.getDay()`,
  `abre`/`fecha` "HH:MM" ou `null`), WhatsApp (`whatsapp_link`; `whatsapp_numero` hoje `null`),
  Instagram, bloco `prototipo`.
- `public/data/cardapio.json` — categorias → itens (`preco` pode ser `null` → exibir "Consulte";
  `selos` → rótulos em `selos`; `dias` opcional; `imagem` = id no manifesto). `status: "parcial"`.
- `public/data/promocoes.json` — promoções/destaques por dia da semana (`dias` = getDay()).
- `public/data/imagens.json` — manifesto `id → { widths, ratio }`. Arquivo real:
  `/images/{id}-{width}.webp`. Montar `srcset` com todas as larguras + `sizes` coerente +
  `width/height` (via ratio) para evitar CLS. `loading="lazy"` e `decoding="async"` fora da 1ª dobra.

Regras de conteúdo (**não inventar fatos**):
- Horário de fechamento é desconhecido: **nunca** exibir hora de fechar nem "aberto até". O status
  permitido é: "Aberto hoje a partir das 16h" / "Abre hoje às 12h" / "Hoje fechado — voltamos quarta,
  16h" (seg/ter), calculado em `America/Sao_Paulo`. Após o horário de abertura: "Aberto desde as 16h".
- Preço `null` → "Consulte". Nunca inventar preço, prato, telefone, avaliação, depoimento ou número
  de clientes. Sem seção de depoimentos (não temos depoimentos reais).
- Endereço/horários: exibir e, discretamente, "Informações sujeitas a confirmação" enquanto
  `endereco.confirmar` for `true`.
- Textos de UI em pt-BR, tom próximo e caloroso de bar de bairro ("Chama a galera", "Vem pra
  Barcenaria"), sem exageros. Copy base já está nos JSONs (tirada das legendas oficiais).

WhatsApp: se `whatsapp_numero` existir → `https://wa.me/{numero}?text={mensagem}`. Se `null` →
copiar a mensagem para a área de transferência (Clipboard API com fallback `execCommand`), mostrar
aviso "Mensagem copiada — é só colar na conversa" e abrir `whatsapp_link` em nova aba.

---

## 3. Site (`public/index.html`, `public/assets/css/site.css`, `public/assets/js/site.js`)

Uma página, rolagem com seções âncora. Mobile-first (375px) e desktop (1440px). HTML semântico
(`header`, `nav`, `main`, `section[aria-labelledby]`, `footer`). O conteúdo essencial (nome,
slogan, endereço, horários, links) deve estar **no HTML estático** (funciona sem JS); JS enriquece
(status aberto/fechado, promoções do dia, destaques do cardápio, galeria).

`<head>`: `<meta name="robots" content="noindex, nofollow">`, description, `theme-color` = `--bg`,
Open Graph (`/images/brand/og-image.jpg`), `favicon.svg` + `apple-touch-icon.png`, JSON-LD
`BarOrPub` com nome, endereço e `openingHoursSpecification` (só abertura; sem `closes` inventado —
omitir a propriedade), `sameAs` Instagram.

### 3.1 Header fixo
- Esquerda: logo pequeno (`logo-placa-160.webp`, ~44px de altura) + "BARCENARIA" em Cinzel.
- Links: A Casa · Comidas · Promoções · Eventos · Visite (âncoras) + **Cardápio** (link para
  `/cardapio`) + botão dourado "Reservar" (WhatsApp).
- Transparente sobre o hero; ao rolar >40px ganha fundo `--bg` com blur e filete dourado inferior.
  Some ao rolar para baixo e volta ao rolar para cima (só em mobile).
- Mobile: botão menu (44×44) abre painel em tela cheia com links grandes em Cinzel, horário do dia e
  botões WhatsApp/Instagram. `aria-expanded`, trap de foco, Esc fecha, scroll do body travado.
- Scrollspy: link da seção visível recebe estado ativo (sublinhado dourado).

### 3.2 Hero (`#inicio`)
- **Mobile:** vídeo vertical em tela cheia (`/video/hero.mp4`, poster `/video/hero-poster.webp`),
  `autoplay muted loop playsinline`, degradê escuro na base; por cima: selo "Tatuapé · Anália
  Franco", título em Cinzel "Seu novo ponto favorito no Tatuapé", linha script "boa comida, boa
  música e boas histórias", **pílula de status do dia** (ver regras), CTAs "Ver cardápio" (dourado) e
  "Reservar mesa" (contorno).
- **Desktop:** grid assimétrico 1.25fr / 0.75fr: texto à esquerda sobre verde com textura de ruído
  sutil (opacity ≤ .05) e o logo-placa grande como marca d'água/elemento; à direita o vídeo em
  moldura com topo em arco (`--radius-arch`), filete dourado duplo, leve parallax.
- Respeitar `prefers-reduced-motion` e `Save-Data`/conexão lenta: nesses casos não carregar o vídeo
  (`preload="none"`, sem autoplay), mostrar só o poster. Botão pausar/tocar acessível no vídeo.
- Indicador de rolagem discreto ("Role" + seta animada).

### 3.3 Faixa letreiro (marquee)
Faixa dourada/verde com itens em Barlow Semi Condensed caixa alta separados por ◆ (SVG):
"Chopp Brahma Double · Rooftop com churrasqueira · Sinuca · Telão · Feijoada aos sábados · Drinks
autorais · BarcenaIPA". Movimento contínuo que acelera levemente com a velocidade de rolagem; pausa
em hover/foco; estático com reduced-motion. Conteúdo duplicado com `aria-hidden` na cópia.

### 3.4 A Casa (`#a-casa`) — "o local"
Storytelling com **scroll fixo (sticky)** no desktop: coluna de texto à esquerda com 4 capítulos que
trocam conforme a rolagem; à direita uma pilha de fotos que troca/cruza (crossfade + leve scale) no
capítulo ativo. No mobile vira sequência de cartões com a foto em cima e o texto embaixo, com
revelação ao entrar na tela.
Capítulos (fotos do manifesto):
1. **Varanda com telão** — "Uma mesa na varanda, o jogo no telão, um brinde com os amigos." →
   `casa/varanda-noite`, `casa/telao`.
2. **Rooftop com churrasqueira** — "O espaço de cima, charmoso e perfeito para comemorar." →
   `casa/rooftop`, `casa/rooftop-mesas`, `casa/churrasqueira`.
3. **Salão e sinuca** — tijolinho, sinuca de feltro amarelo, TVs. → `casa/sinuca`, `casa/salao`,
   `casa/sinuca-tv`, `casa/janela`.
4. **O balcão** — drinks autorais e chopp gelado. → `casa/bar`, `bar/bartender`, `bar/drink-spritz`.
Abaixo: linha de "estrutura" (ícone + rótulo): Rooftop · Varanda · Salão · Sinuca · Telão.
Galeria: ao tocar numa foto abre **lightbox** acessível (setas, swipe, Esc, contador "3/12",
legenda), carregando a maior largura disponível.

### 3.5 Da cozinha e do balcão (`#comidas`)
Título "Da cozinha e do balcão". **Bento grid** (não cards iguais): 1 destaque grande para a
**Bucha — Torresmo de Rolo** ("Sucesso da casa", `pratos/bucha-torresmo-de-rolo`) + foto real
`pratos/torresmo-na-mesa`; demais: Fraldinha na chapa, Linguiça artesanal, Feijoada (selo "Sábados"),
Resina Jorge Amado (R$ 45), BarcenaIPA (6,2%), Chopp Brahma Double. Dados vêm de `cardapio.json`
(render via JS, com fallback estático mínimo). Hover/foco: zoom leve na foto + descrição sobe.
No mobile: carrossel horizontal com scroll-snap e indicador de progresso.
CTA: "Ver cardápio completo" → `/cardapio`.

### 3.6 Promoções (`#promocoes`) — aba com imagens
Abas por dia: **Qua · Qui · Sex · Sáb · Dom** (+ "Seg/Ter: fechado" como nota). A aba do dia atual
abre selecionada e ganha selo "Hoje" (`--brick`). Padrão WAI-ARIA Tabs completo (setas, Home/End,
`aria-selected`, `tabpanel`). Em cada aba: cartões com a **arte original da promoção** (imagens em
`promos/*`, proporção 1:1), título, resumo, preço formatado em BRL quando houver, e link
"Ver no Instagram" (fonte). Promoções `tipo: "destaque"` aparecem como "Sempre na casa". Tocar na
arte abre o lightbox. Nota discreta: "Promoções sujeitas a alteração. Confirme com a casa."
Transição entre abas: fade/slide curto.

### 3.7 Eventos (`#eventos`) — bloco editorial kraft
Fundo `--paper`, layout de "jornal": cabeçalho "Edição especial ◆ Eventos", manchete em Cinzel
"Seu próximo evento pode acontecer aqui", texto das legendas oficiais (aniversário, confraternização,
encontro da empresa; rooftop com churrasqueira, interno e externo, sinuca e telão). Vídeo
`/video/eventos.mp4` (poster `eventos-poster.webp`, só carrega/toca quando entra na tela) e fotos
`eventos/*`.
**Formulário de pré-reserva** (sem backend): nome, tipo (Aniversário / Confraternização / Empresa /
Outro), data (`type=date`, mín. hoje), nº de pessoas, espaço preferido (Rooftop / Salão / Varanda /
Tanto faz), observações. Validação acessível (mensagens por campo, `aria-describedby`,
`aria-invalid`). Ao enviar: monta mensagem formatada e segue a regra de WhatsApp da seção 2.
Card lateral "Convite digital para seus convidados": explica o convite online com confirmação de
presença (serviço do Gustavo) e link "Ver exemplo" →
`https://aniversario-gustavo-2026.vercel.app/?demonstracao=1` (nova aba).

### 3.8 No Instagram
Grade de 8 imagens (promos + casa) com overlay no hover e link para cada post (`fonte` quando houver)
e botão "Seguir @barcenariaoficial". Sem embed de terceiros.

### 3.9 Visite (`#visite`)
Duas colunas: (a) endereço, bairro, **tabela de horários** com o dia atual destacado e a pílula de
status; botões "Google Maps", "Waze", "WhatsApp"; (b) mapa `iframe` (`casa.mapas.embed`,
`loading="lazy"`, `title`, `referrerpolicy="no-referrer-when-downgrade"`) dentro de moldura
dourada; em mobile o mapa só carrega ao tocar em "Mostrar mapa" (economia de dados).
Nota "Informações sujeitas a confirmação".

### 3.10 Rodapé
Logo-placa, assinatura em script, links de navegação, Instagram, WhatsApp, "Cardápio digital",
aviso do protótipo (`casa.prototipo.texto`) em texto pequeno, ano corrente.

### 3.11 Mobile dock
Barra fixa inferior só no mobile (após sair do hero): **Cardápio · Reservar · Como chegar**, 3
botões de 56px, com `env(safe-area-inset-bottom)`. Some quando o menu está aberto e sobre o rodapé.

### 3.12 Motion (Motion 7, sempre com fallback)
- Reveal on-scroll (IntersectionObserver): fade + translateY(24px) com stagger de 60–80ms. Só
  anima `transform`/`opacity`.
- Títulos de seção: filete dourado que "desenha" da esquerda para a direita ao entrar.
- Parallax leve (≤ 8% de deslocamento) no hero desktop e nas fotos da Casa, via
  `requestAnimationFrame` + `transform`, desligado em reduced-motion e em telas touch.
- Botão "voltar ao topo" com anel de progresso de rolagem (SVG).
- `@media (prefers-reduced-motion: reduce)`: sem parallax, sem marquee, sem autoplay, reveals
  instantâneos.
- Sem preloader. Sem bibliotecas de animação (tudo nativo). Nenhuma dependência externa de JS.

---

## 4. Cardápio (`public/cardapio/index.html`, `public/assets/css/cardapio.css`, `public/assets/js/cardapio.js`)

Uso: cliente na mesa, celular, às vezes sol forte (rooftop) ou noite. Prioridade: **achar e ler
rápido**. Densidade 6, Motion 3.

- Header compacto: logo-placa pequeno + "Cardápio" + botão de tema (claro/escuro) + botão
  compartilhar (Web Share API; fallback copiar link).
- Parâmetro `?mesa=12` → selo "Mesa 12" no header (preparação para pedidos futuros). Validar: só
  dígitos, 1–3 caracteres.
- Banner "Hoje na Barcê" com a promoção do dia (de `promocoes.json`, dia em `America/Sao_Paulo`);
  em seg/ter, "Hoje estamos fechados — até quarta!".
- **Busca** (input `type=search`, com rótulo) que filtra itens por nome/descrição, sem acento e
  sem caixa (normalize NFD), com contador de resultados (`aria-live="polite"`) e estado vazio útil.
- **Chips de categoria** fixos (sticky) com scroll horizontal; scrollspy destaca a categoria visível;
  tocar rola suave até a categoria.
- Filtros rápidos (chips toggle): "Sucesso da casa", "Para compartilhar", "Tem promo hoje".
- Item: nome (Barlow Semi Condensed 600), descrição (2 linhas, `line-clamp`), preço alinhado à
  direita com `tabular-nums` ("R$ 45,00" via `Intl.NumberFormat('pt-BR', {style:'currency',
  currency:'BRL'})`; `null` → "Consulte"), selos, miniatura 72–88px quando houver `imagem`.
  Tocar abre **bottom sheet** (`dialog`) com foto grande, descrição completa, selos, preço e
  "Chamar garçom? Fale no WhatsApp" — sheet acessível (foco, Esc, arrastar para fechar opcional).
- Itens com `dias` fora do dia atual: mostrar selo "Só aos sábados" etc. e esmaecer levemente (sem
  esconder).
- Aviso fixo no fim: "Preços sujeitos a alteração · Informe o garçom sobre alergias" + data
  `atualizado_em`. Se `status` = "parcial": faixa discreta "Cardápio em atualização" no topo.
- **Tema:** escuro por padrão (tokens da marca); tema claro "papel" (`--paper*`) para sol forte.
  Seguir `prefers-color-scheme` quando não houver escolha salva; escolha salva em `localStorage`
  (com try/catch). Aplicar tema antes do primeiro paint (script inline mínimo no `<head>`) para evitar
  flash.
- Rodapé: link para o site (`/`), Instagram, WhatsApp, endereço curto.
- Performance: ≤ 100 KB de HTML+CSS+JS próprios (sem imagens); miniaturas lazy; nada de vídeo.
- `noindex` igual ao site. Mesmo favicon/OG.

### 4.1 QR imprimível (`public/cardapio/qr/index.html`)
Página para imprimir "display de mesa" (A6 retrato, 2 por folha A4, `@page` e `@media print`).
Gera o QR **no navegador** com `public/assets/vendor/qrcode.js` (`import qrcode from
'/assets/vendor/qrcode.js'`; API: `const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
qr.createSvgTag({ cellSize: 8, margin: 2 })` ou desenhar via `qr.getModuleCount()`/`qr.isDark(r,c)`),
apontando para `${location.origin}/cardapio` (+ `?mesa=N` se informado num campo "Número da mesa"
na tela — gerar vários de uma vez, ex.: mesas 1–20). Layout do display: logo-placa, "Aponte a câmera
para ver o cardápio", QR em moldura dourada, "@barcenariaoficial", fundo verde (com opção
"economizar tinta": fundo branco). Na tela: controles; na impressão: só os displays.

---

## 5. Qualidade (critério de aceite — verificar de verdade)

- Sem erros no console. HTML válido (sem ids duplicados), `lang="pt-BR"`, um `h1` por página.
- Contraste AA (corpo ≥ 4.5:1). Foco visível em tudo (`:focus-visible` dourado). Alvos ≥ 44px.
- Funciona em 360px sem rolagem horizontal; testado em 375×812 e 1440×900.
- Teclado: todo interativo alcançável; menu, lightbox, abas, sheet com Esc e foco gerenciado.
- `prefers-reduced-motion` respeitado. Zoom liberado (sem `maximum-scale`).
- Nenhum dado inventado (checar contra `referencias/instagram/manifest.json` e os JSONs).
- Imagens com `alt` descritivo em pt-BR, `width/height`, lazy fora da 1ª dobra.
- JS: módulos ES (`type="module"`), sem dependências externas, sem `innerHTML` com dados não
  confiáveis sem escape (os JSONs são locais, mas escapar mesmo assim ou usar `textContent`).
- Anti-slop (design-director): nada de roxo/gradiente genérico, cards idênticos, emoji-ícone,
  sombras iguais, tudo centralizado, lorem ipsum.

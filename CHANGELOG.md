# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) · Versões por **data** (`AAAA-MM-DD`), não SemVer.
Log de trabalho diário fica em `.sessoes/` — não aqui. Aqui entra só o que importa a quem **consome** o projeto.

## [2026-11-23] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Alterado
- Rodapé da página inicial: o "Desenvolvido por" ganhou a animação que as outras demos já têm. Ao chegar ao fim da página, o nome entra letra por letra, um fio dourado se desenha por baixo, uma lasca cai do fio e os três links sobem em arco.
- Cardápio digital: comidas trocadas pelo cardápio novo que a casa publicou no Instagram em 18/11/2026. Entram Porções (12), Lanches (8, com preço do lanche e do combo), Espetos (10), Pratos (2, mais o aviso dos pratos quentes da semana) e Sobremesas (3), com os textos e preços da publicação. Bebidas, almoço executivo e feijoada não aparecem na publicação nova e seguem como estavam; por isso o cardápio digital mostra a faixa "Cardápio em atualização".
- Página inicial: o glossário passa a falar só dos drinks ("Aqui, o balcão é oficina."), porque as comidas novas não têm mais nome de ferramenta. "Os mais pedidos da casa" mostra o Torresmo de Rolo, o Burger Barcenaria e a Parmegiana de Filé Mignon (fotos do reel de 20/11), chopp e drinks.
- Promoções: o destaque do torresmo usa o nome e o preço novos (Torresmo de Rolo, R$ 55) e entra o destaque "Cardápio novo na mesa". A grade do Instagram abre com a publicação do cardápio novo e o reel de 20/11.
- Vinhos: a harmonização citava pratos do cardápio antigo. Ficou só nos rótulos cujo prato continua (isca de filé mignon, bolinho de carne seca, torresmo de rolo, frango a passarinho, croquete de cogumelos).
- Buscas do cardápio digital e da tela do garçom: os exemplos sugeridos usam itens que existem (torresmo, burger, negroni, espeto).
- Página inicial sem preços, a pedido do Gustavo: saíram do glossário, dos cartões de "Os mais pedidos da casa" e dos cartões de promoção; a feijoada deixou de citar os valores no resumo; na grade do Instagram, a arte do Resina Jorge Amado (com "R$45" impresso) deu lugar à foto do mesmo post. Os preços continuam no cardápio digital.
### Adicionado
- Fotos do Burger Barcenaria e da Parmegiana de Filé Mignon (quadros do reel de 20/11) e a capa do cardápio novo; os prints das quatro páginas ficam em `referencias/cardapio/2026-11-18-cardapio-novo-*.jpg`.
### Removido
- Categorias Entradas, Acompanhamentos, Da Panela e Aprendiz de Marceneiro (kids), e os itens antigos de Porções, Lanches e Sobremesas: saíram do cardápio da casa.
- Da grade do Instagram: as artes da Bucha e da fraldinha na chapa (nome antigo e prato que saiu).

## [2026-11-16] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Removido
- Seção "Cada corte, um prato." da página inicial (as cinco peças de madeira com os nomes dos pratos), a pedido do Gustavo. A vinheta de abertura não muda.

## [2026-11-13] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Adicionado
- Vinheta de abertura na página inicial (automática, cerca de 4 s), no desenho da placa da casa: fundo verde com moldura dourada, a placa, um serrote em traço dourado que corta a tela em dois golpes; a tela se abre e a placa aparece em vidro verde com a arte dourada em relevo e um feixe de luz passando (o mesmo efeito da abertura do site da C41); então o site aparece por trás e a placa voa até pousar sobre o logo do cabeçalho. Não bloqueia a página, qualquer toque dispensa; não toca com "reduzir movimento", em link direto para uma seção nem ao voltar pelo navegador. Sem WebGL, a tela se abre direto para o site.
- Seção "Cada corte, um prato." entre o letreiro e o glossário: cinco peças de madeira com o nome do item e o prato (Viga, Sarrafo, Serragem, Fita Métrica, Guarda-Roupa). Sem preço; link para o cardápio completo.

### Corrigido
- Travamento ao rolar o site: a barra de progresso recalculava o estilo da página inteira a cada rolagem; agora só os dois elementos que a usam são atualizados.

### Retirado
- Abertura com filmagem de serrote avançada pela rolagem (duas versões publicadas mais cedo no mesmo dia, a segunda com animação por cima). Recusada pelo Gustavo. Histórico em `docs/cena-serrote.md`.

## [2026-11-04] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Alterado
- Movimento do site com antecipação e overshoot:
  - O título do início entra palavra por palavra, a cada 80 ms, crescendo até 1.08 antes de assentar.
  - Botões sobem com overshoot no hover e achatam ao toque (squash); o ícone vem logo atrás (follow-through).
  - Cards do glossário e setas de link recuam antes de andar.
  - As seções entram com um leve passo além do ponto final.
  - O vídeo de abertura tem um zoom lento e contínuo no repouso.
- Novos tokens em `tokens.css`: `--ease-back`, `--ease-anticipate` e `--stagger-word`.
- Letreiro e barra de progresso seguem lineares de propósito, porque marcam velocidade e tempo.
- Cardápio, comanda e painel não mudaram.
- Com "reduzir movimento" ligado no aparelho, título e vídeo ficam parados.

## [2026-10-02] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Removido
- Botão "Chamar garçom? Fale no WhatsApp" da ficha do item no cardápio: o cliente não chama o garçom pelo WhatsApp.

## [2026-09-30] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Adicionado
- Painel da casa (`/painel`, demonstração): agenda de reservas por área (Rooftop, Varanda, Salão interno) que recusa duas reservas da mesma área no mesmo horário e sugere áreas livres; aba de resultados com faturamento por dia, média por dia da semana, comandas por horário, pratos e bebidas mais vendidos e divisão cozinha × bar, sobre dados de exemplo gerados do cardápio real e os pedidos da demo da comanda.
- Pedir reserva (`/reservar`, demonstração): o cliente escolhe dia, horário, ocasião e espaço, vê na hora o que está livre (sem dados de outras reservas), autoriza o contato e o pedido entra no painel como pré-reserva "Pedido pelo site". Link "Peça sua reserva online" no formulário de eventos do site.

### Alterado
- Rodapé do site e do cardápio: aviso de protótipo substituído por "Desenvolvido por Gustavo Doganelli" com links para LinkedIn, GitHub e WhatsApp (mensagem pronta indicando a origem). O aviso segue em `casa.json` (`prototipo.ativo: false`) e volta ao ligar a chave.

### Segurança
- Cabeçalhos em `vercel.json`: Content-Security-Policy restrita ao próprio site, Google Fonts e mapa do Google; `X-Frame-Options: SAMEORIGIN`; Permissions-Policy bloqueando câmera, microfone, localização e pagamento.
- Scripts e estilos que estavam dentro do HTML foram para arquivos próprios (`theme-boot.js`, `qr.js`, `qr.css`, `comanda-demo.css`), e os estilos inline do JS viraram classes ou CSSOM, para funcionar com a CSP sem `unsafe-inline`.

## [2026-09-29] — publicado em https://barcenaria-digital.vercel.app (protótipo, noindex)
### Adicionado
- Estrutura inicial do projeto, especificação de design (`docs/design-spec.md`) e tokens da marca.
- Coleta dos 12 posts públicos do Instagram (fotos em alta, 3 reels, legendas) em `referencias/instagram/`.
- Logo da placa isolado com fundo transparente a partir do reel do rooftop.
- Pipeline de assets (`npm run assets`): WebP em duas larguras, recortes sem texto dos pratos, vídeo de abertura de 13 s e vídeo de eventos.
- Dados iniciais em JSON: casa, cardápio parcial, promoções por dia e manifesto de imagens.
- Cardápio completo transcrito do destaque "Cardápio" (30/06/2026): 17 seções e 153 itens, com preços, opções vegetarianas, destilados por dose/garrafa/combo, vinhos com harmonização e horários do executivo e da feijoada.
- Fotos dos pratos recortadas do cardápio impresso e 4 fotos da casa enviadas por print.
- Site one-page: vídeo de abertura, glossário da oficina (nomes de marcenaria → prato real), a casa em 4 capítulos, destaques da cozinha, promoções por dia da semana, eventos com pré-reserva via WhatsApp e convite digital, Instagram, horários e mapa.
- Cardápio digital em /cardapio com tema "papel" do cardápio impresso e tema escuro, busca pelo nome do prato, filtros, promoção do dia, painel de detalhes e número da mesa via ?mesa=.
- QR codes imprimíveis das mesas em /cardapio/qr (4 displays A6 por folha A4).
- Comanda digital (demonstração): app do garçom em /garcom (mesas, itens com opções e observações, conta da mesa), tela da expedição em /expedicao (pedido dividido entre cozinha e bar, tempos de preparo, impressão da comanda, aviso de pronto) e tela de apresentação lado a lado em /comanda. Sincroniza no mesmo navegador (localStorage + BroadcastChannel).
### Alterado
- Anália Franco em destaque no título, selo do topo e endereço.
- Promoções: só as do dia escolhido (hoje por padrão).
- Status do dia sem afirmar "aberto" (horário de fechamento desconhecido).
- Cardápio: removidas marcações e textos que não constavam no original (4 vegetarianos, selo da IPA, descrição da feijoada, subtítulos).
- Biblioteca de QR vendorizada renomeada para `qrcode.js` (MIME de módulo sem configuração extra).

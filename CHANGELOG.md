# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) · Versões por **data** (`AAAA-MM-DD`), não SemVer.
Log de trabalho diário fica em `.sessoes/` — não aqui. Aqui entra só o que importa a quem **consome** o projeto.

## [2026-11-13] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Adicionado
- Vinheta de abertura na página inicial (2,7 s, automática), no desenho da placa da casa: fundo verde com moldura dourada, a placa, um serrote em traço dourado que corta a tela em dois golpes, e a tela se abre para o site. Só CSS, não bloqueia a página, qualquer toque dispensa; não toca com "reduzir movimento", em link direto para uma seção nem ao voltar pelo navegador.
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

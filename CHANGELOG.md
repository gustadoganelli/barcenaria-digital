# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) · Versões por **data** (`AAAA-MM-DD`), não SemVer.
Log de trabalho diário fica em `.sessoes/` — não aqui. Aqui entra só o que importa a quem **consome** o projeto.

## [2026-09-30] — publicado em https://barcenaria-digital.vercel.app (noindex)
### Alterado
- Rodapé do site e do cardápio: aviso de protótipo substituído por "Desenvolvido por Gustavo Doganelli" com links para LinkedIn e GitHub. O aviso segue em `casa.json` (`prototipo.ativo: false`) e volta ao ligar a chave.

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

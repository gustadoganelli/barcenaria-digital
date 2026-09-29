# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) · Versões por **data** (`AAAA-MM-DD`), não SemVer.
Log de trabalho diário fica em `.sessoes/` — não aqui. Aqui entra só o que importa a quem **consome** o projeto.

## [Não publicado]
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
### Alterado
- Biblioteca de QR vendorizada renomeada para `qrcode.js` (MIME de módulo sem configuração extra).

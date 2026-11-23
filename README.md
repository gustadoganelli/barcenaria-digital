# Barcenaria Digital

> Site institucional e cardápio digital (QR code na mesa) da Barcenaria Bar e Restaurante, Tatuapé — SP.

**Status:** em desenvolvimento (protótipo de apresentação)
**Última atualização:** 2026-09-29

## Links (protótipo, não indexado)

| Página | Endereço |
|---|---|
| Site | https://barcenaria-digital.vercel.app |
| Cardápio digital | https://barcenaria-digital.vercel.app/cardapio |
| QR das mesas (imprimir) | https://barcenaria-digital.vercel.app/cardapio/qr |
| Comanda — apresentação | https://barcenaria-digital.vercel.app/comanda |
| Comanda — garçom / expedição | https://barcenaria-digital.vercel.app/garcom · https://barcenaria-digital.vercel.app/expedicao |
| Painel da casa — reservas e resultados | https://barcenaria-digital.vercel.app/painel |
| Pedir reserva (cliente) | https://barcenaria-digital.vercel.app/reservar |

Projeto Vercel: `gusta15/barcenaria-digital`. Publicar: `npx.cmd vercel@latest deploy --prod --scope gusta15` (no PowerShell use `npx.cmd`).

## Problema

A Barcenaria não tem site: no Google aparece apenas o Instagram. O cardápio existe no papel e em
fotos nos destaques do Instagram, e as promoções se perdem no feed.

## Solução

- **Site one-page** com vídeo do ambiente, a casa (rooftop, varanda, salão, sinuca), comidas em
  destaque, promoções por dia da semana, eventos com pré-reserva via WhatsApp e localização.
- **Cardápio digital** mobile em `/cardapio`, com busca, categorias, promoção do dia e tema claro
  para uso ao sol. QR codes para as mesas em `/cardapio/qr`.

Protótipo não indexado (`noindex`) até aprovação da casa. Conteúdo e fotos são do Instagram
oficial [@barcenariaoficial](https://www.instagram.com/barcenariaoficial/).

## Arquitetura

```
referencias/ (fotos, reels e prints do Instagram)
   ├─ scripts/build-assets.mjs  → public/images/*.webp, public/video/*.mp4, public/data/imagens.json
   └─ scripts/build-vidro.mjs   → public/images/brand/logo-vidro.webp (máscara da placa para o vidro da vinheta)
public/ (estático, publicado na Vercel)
   ├─ index.html                → site
   ├─ cardapio/index.html       → cardápio digital
   ├─ cardapio/qr/index.html    → QR codes imprimíveis
   ├─ garcom/, expedicao/       → comanda digital (demonstração, sem servidor)
   ├─ comanda/index.html        → apresentação garçom + expedição lado a lado
   ├─ painel/index.html         → painel da casa: agenda de reservas + resultados (demonstração)
   ├─ reservar/index.html       → pedido de reserva do cliente, com disponibilidade por área (demonstração)
   ├─ data/*.json               → conteúdo (casa, cardápio, promoções, manifesto de imagens)
   └─ assets/css|js|vendor
```

## Pré-requisitos

Node.js 20+.

## Instalação

```powershell
npm install
```

## Uso

```powershell
npm run dev      # http://127.0.0.1:4180
npm run assets   # regenera imagens/vídeos a partir de referencias/
```

Atualizar conteúdo: editar `public/data/cardapio.json`, `promocoes.json` ou `casa.json`.

## Variáveis de ambiente

Nenhuma nesta fase (ver `.env.example`).

## Estrutura do projeto

| Caminho | Conteúdo |
|---|---|
| `public/` | site publicado |
| `public/data/` | conteúdo em JSON |
| `referencias/instagram/` | material bruto + `manifest.json` com legendas e datas |
| `referencias/cardapio/`, `referencias/site/` | prints enviados manualmente |
| `referencias/brand/logo-placa.png` | logo isolado com fundo transparente |
| `scripts/` | servidor local, geração de assets, isolamento do logo e máscara da placa para a vinheta (`build-vidro.mjs`) |
| `docs/design-spec.md` | especificação de design e construção |
| `docs/cena-serrote.md` | especificação da vinheta de abertura, com o histórico das tentativas |
| `PEDIDOS.md` | registro corrido dos pedidos e do estado de cada um |

## Limitações conhecidas

- Comidas: cardápio novo publicado pela casa no Instagram em 18/11/2026 (prints em `referencias/cardapio/2026-11-18-cardapio-novo-*.jpg`). Bebidas, almoço executivo e feijoada: seguem do destaque "Cardápio" de 30/06/2026 (páginas 3 a 15 de 18) e não aparecem na publicação nova; a confirmar com a casa. Enquanto isso o cardápio digital mostra a faixa "Cardápio em atualização".
- Duas inconsistências vieram do cardápio original e estão marcadas com `revisar` no JSON (uva do Paisajes de Los Andes; região do Château Briot).
- Horário de fechamento, telefone do WhatsApp e endereço a confirmar com a casa.
- Sem backend: pré-reserva de evento abre o WhatsApp com a mensagem pronta.
- Comanda digital é demonstração: só sincroniza janelas do mesmo navegador. A versão real exige backend em tempo real, login por garçom e modo offline.
- Painel da casa é demonstração: reservas ficam no `localStorage` do navegador e os resultados usam dados de exemplo gerados do cardápio real (mais os pedidos da demo da comanda). A versão real exige banco de dados, login da equipe e fonte de vendas (comanda ou sistema de caixa).

## Roadmap

1. Confirmar com a casa a carta de bebidas, o almoço executivo e a feijoada depois do cardápio novo de 18/11/2026.
2. Validar com a casa (preços, horários, fotos) e remover `noindex`.
3. Fase 2: painel para a equipe editar cardápio e promoções; domínio próprio; Google Meu Negócio.

## Changelog

Ver `CHANGELOG.md` na raiz do projeto.

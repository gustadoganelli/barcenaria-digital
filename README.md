# Barcenaria Digital

> Site institucional e cardápio digital (QR code na mesa) da Barcenaria Bar e Restaurante, Tatuapé — SP.

**Status:** em desenvolvimento (protótipo de apresentação)
**Última atualização:** 2026-09-29

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
   └─ scripts/build-assets.mjs  → public/images/*.webp, public/video/*.mp4, public/data/imagens.json
public/ (estático, publicado na Vercel)
   ├─ index.html                → site
   ├─ cardapio/index.html       → cardápio digital
   ├─ cardapio/qr/index.html    → QR codes imprimíveis
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
| `scripts/` | servidor local, geração de assets, isolamento do logo |
| `docs/design-spec.md` | especificação de design e construção |

## Limitações conhecidas

- Cardápio transcrito das páginas 3 a 15 (de 18) do destaque "Cardápio"; faltam conferir as páginas 1–2 e 16–18.
- Duas inconsistências vieram do cardápio original e estão marcadas com `revisar` no JSON (uva do Paisajes de Los Andes; região do Château Briot).
- Horário de fechamento, telefone do WhatsApp e endereço a confirmar com a casa.
- Sem backend: pré-reserva de evento abre o WhatsApp com a mensagem pronta.

## Roadmap

1. Conferir as páginas 1–2 e 16–18 do destaque "Cardápio".
2. Validar com a casa (preços, horários, fotos) e remover `noindex`.
3. Fase 2: painel para a equipe editar cardápio e promoções; domínio próprio; Google Meu Negócio.

## Changelog

Ver `CHANGELOG.md` na raiz do projeto.

# Barcenaria Digital

## O que é
Site institucional one-page + cardápio digital (QR na mesa) para a Barcenaria Bar e Restaurante
(Tatuapé/Anália Franco, SP). Projeto **particular** do Gustavo, protótipo de prospecção — sem relação
com a Amigos do Bem. Falhar = cliente vê informação errada (preço, horário) na mesa.

## Arquitetura em uma linha
`referencias/` (Instagram bruto) → `scripts/build-assets.mjs` (sharp + ffmpeg) → `public/` estático
(HTML/CSS/JS + `data/*.json`) → Vercel (`outputDirectory: public`, `cleanUrls`).

## Stack deste projeto
- HTML/CSS/JS puros, ES modules, **sem build step e sem dependências JS no navegador**
  (exceção: `public/assets/vendor/qrcode.js`, MIT, vendorizado).
- Deploy Vercel (não Cloudflare). Sem banco na fase 1.
- Node só para ferramentas locais: `npm run dev` (servidor em :4180) e `npm run assets`.

## Variáveis de ambiente
Nenhuma na fase 1. Ver `.env.example`.

## Regras de negócio não óbvias
- **Não inventar fato**: preço desconhecido = `null` → "Consulte". Nunca exibir horário de
  fechamento (desconhecido). Sem depoimentos/avaliações.
- Conteúdo vem de `public/data/*.json` — `casa`, `cardapio`, `promocoes`, `imagens` (manifesto).
  Editar dado = editar JSON, não HTML.
- Dia da semana sempre em `America/Sao_Paulo` (`dias` = `Date.getDay()`, 0 = domingo).
- Até aprovação da casa: `noindex` (meta + `X-Robots-Tag` + `robots.txt`) e aviso de protótipo.
- WhatsApp: `whatsapp_numero` é `null` → fluxo copiar mensagem + abrir `whatsapp_link`.
- Sem fotos de clientes com rosto identificável.

## Convenções deste repo
- Tokens só em `public/assets/css/tokens.css`; componentes usam `var(--…)`.
- Imagem nova: entra em `IMAGES` do `build-assets.mjs`, rodar `npm run assets` (gera WebP +
  `data/imagens.json`). Nunca referenciar URL do Instagram (expira).
- Especificação completa: `docs/design-spec.md`.
- Vinheta de abertura da página inicial: especificação e histórico em `docs/cena-serrote.md` (a seção "Cada
  corte, um prato." foi retirada em 16/11 a pedido do Gustavo: não recolocar). Vive em `corte-boot.js`, `corte.css` e `vidro.js` (segundo tempo em WebGL: a placa em
  vidro que voa para o logo do cabeçalho; adaptado do site da C41); a vinheta só existe sob `html.corte-on`. É
  curta e automática: nada de cena presa à rolagem, filmagem de banco de imagens ou efeitos por cima (três
  tentativas recusadas). Mudança visual nela só vai ao ar depois de o Gustavo ver em vídeo; ajuste que ele mesmo
  ditou sobre versão aprovada pode ir junto com o vídeo.
- Verificação: `npm run dev` e checar 375×812 e 1440×900, console sem erros.
- Pedidos e estado de cada um: `PEDIDOS.md`, atualizado a cada rodada.

## Armadilhas conhecidas
- Destaques do Instagram exigem login: cardápio completo vem de prints em `referencias/cardapio/`.
- Desde o cardápio de 18/11/2026 as comidas não têm mais nome de ferramenta; só os drinks (a confirmar com a
  casa). Não escrever que os pratos levam nome de marcenaria.
- Vídeos brutos (`referencias/instagram/*.mp4`, `referencias/serra/*.mp4`) ficam fora do git (pesados).
- Não gravar variável CSS no `<html>` a cada rolagem: recalcula o estilo da página inteira e trava o site
  (medido em 13/11; a barra de progresso grava só nos dois elementos que a usam).
- Conferir a página inicial em 390×664 (janela real do celular com as barras do navegador), não só em 390×844.

## Fora de escopo
Pedido online, pagamento, reserva com backend, painel de edição (fase 2), domínio próprio.

## Onde está o resto
- Ficha e bloqueios → `~/vault-doganelli/projetos/barcenaria-digital.md`
- Como rodar e estrutura → `README.md`
- Ritual: `/sessao-abrir` no início, `/sessao-fechar` no fim. `.sessoes/` é o registro primário.

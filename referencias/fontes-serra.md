# Fontes dos vídeos da cena do serrote

Registro de origem e licença das filmagens usadas em `public/video/serra/` (quadros extraídos por
`scripts/build-serra.mjs`). Os arquivos originais ficam em `referencias/serra/` e não entram no git.

| Conjunto | Uso na página | Arquivo local | Origem | Baixado em |
| --- | --- | --- | --- | --- |
| `p` e `l` | Abertura (o corte): serrote cortando a ripa, o toco cai no fim | `referencias/serra/pexels-5972630-uhd.mp4` (3840×2160) | https://www.pexels.com/video/male-hands-sawing-piece-of-wood-close-up-5972630/ | 2026-11-12 |
| `b` | Bancada: serrote de costas sobre a bancada | `referencias/serra/pexels-5973239-hd.mp4` (1920×1080) | https://www.pexels.com/video/a-carpenter-using-a-hand-saw-5973239/ | 2026-11-12 |

## Licença

Licença Pexels (https://www.pexels.com/license/), conferida em 2026-11-12:

- uso gratuito, inclusive comercial;
- atribuição não exigida;
- modificação permitida (aqui: recorte, redução e extração de quadros);
- não revender nem redistribuir o arquivo original sem alteração;
- não sugerir que as pessoas ou marcas do vídeo endossam o produto;
- pessoas identificáveis não podem aparecer de forma ofensiva (nos dois clipes só aparecem as mãos).

## Como trocar por filmagem própria

Quando houver vídeo gravado na casa (serrote de verdade na bancada da Barcenaria), substituir os arquivos em
`referencias/serra/`, ajustar `src`, `fps` e `vf` em `scripts/build-serra.mjs` e rodar `node scripts/build-serra.mjs`.
A página lê a quantidade de quadros de `public/video/serra/serra.json`; nada mais precisa mudar.

# Corrigir logo do cabeçalho do Oxente

## O que será feito

1. Criar um asset CDN a partir da logo anexada pelo usuário (WhatsApp_Image_2026-07-31_at_15.34.17_1.jpeg), que já inclui o nome "Oxente".
2. Substituir a referência da logo antiga no cabeçalho (`src/components/site-header.tsx`) pelo novo asset.
3. Remover o texto "Oxente" exibido ao lado da imagem no header, já que a própria logo contém o nome.
4. Ajustar o tamanho da logo no header para ficar visualmente equilibrada — mantendo a identidade laranja e o chapéu de cangaço, sem distorcer.

## Arquivos envolvidos

- `src/components/site-header.tsx` (atualizar a imagem do logo e ajustar classes de tamanho)
- Novo arquivo `src/assets/oxente-logo-mark.png.asset.json` (ponteiro CDN da logo anexada)

## Saída esperada

Header do Oxente exibe apenas a logo laranja com sacola de compras, chapéu de cangaço e nome "Oxente" embutido, em tamanho proporcional e bem posicionada.

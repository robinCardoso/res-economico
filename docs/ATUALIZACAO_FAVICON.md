# 📝 Instruções para Atualizar o Favicon

## ✅ O que foi feito

1. **Configuração do favicon no layout.tsx**
   - Adicionada configuração de ícones no metadata
   - Configurado para usar `/minha-logo.png` como ícone principal
   - Mantido fallback para `/favicon.ico`

2. **Atualização do manifest PWA**
   - Ícones do PWA agora usam `/minha-logo.png`
   - Mantido fallback para `/favicon.ico`

## 🔧 Próximos Passos (Opcional)

Para ter um favicon.ico otimizado a partir da logo da empresa, você pode:

### Opção 1: Converter PNG para ICO manualmente

1. Use uma ferramenta online como:
   - https://convertio.co/pt/png-ico/
   - https://www.favicon-generator.org/
   - https://favicon.io/

2. Faça upload de `/minha-logo.png` ou `/logo-rede.jpg`

3. Gere o favicon.ico em tamanhos:
   - 16x16 pixels
   - 32x32 pixels
   - 48x48 pixels

4. Substitua o arquivo `frontend/src/app/favicon.ico` (se existir) ou `frontend/public/favicon.ico`

### Opção 2: Criar ícones PWA otimizados

Para melhor experiência no PWA, você pode criar versões otimizadas:

1. **icon-192.png**: 192x192 pixels (quadrado)
2. **icon-512.png**: 512x512 pixels (quadrado)

Salve em `frontend/public/icons/` e atualize o manifest.ts para usar esses arquivos.

### Opção 3: Usar ferramenta de linha de comando

Se tiver ImageMagick instalado:

```bash
# Converter PNG para ICO
convert minha-logo.png -resize 32x32 favicon.ico

# Criar múltiplos tamanhos
convert minha-logo.png -resize 16x16 icon-16.png
convert minha-logo.png -resize 32x32 icon-32.png
convert minha-logo.png -resize 48x48 icon-48.png
```

## 📌 Nota

O sistema já está configurado para usar `/minha-logo.png` como favicon. Se você quiser um favicon.ico específico, siga as instruções acima.


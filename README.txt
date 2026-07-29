Página Romântica - estrutura organizada

Arquivos principais:
- index.html: página principal
- dados.js: lista oficial das fotos
- dengo.mp3: música
- img/: fotos otimizadas como memoria001.webp, memoria002.webp...

Como adicionar foto pela página:
1. Abra a página publicada no GitHub Pages.
2. Clique no botão + no canto inferior direito.
3. Preencha owner, repositório, branch e token.
4. Escolha a imagem e clique em Enviar foto.
5. A página removerá os metadados, limitará a resolução e enviará a imagem para img/.
6. Em seguida, a página atualizará o dados.js.
7. Se a atualização da lista falhar, a imagem parcial será removida automaticamente.

Privacidade:
- O token nunca é salvo pelo site e é apagado do campo após cada tentativa.
- As imagens novas são regravadas antes do envio, removendo EXIF e GPS.
- O nome original do arquivo não é publicado no dados.js.

Desempenho:
- O slideshow mantém somente a foto atual e a próxima carregadas.
- As imagens são limitadas a 1600 px e armazenadas preferencialmente em WebP.

Token recomendado:
- Fine-grained token
- Acesso somente a este repositório
- Contents: Read and Write

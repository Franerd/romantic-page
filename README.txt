Página Romântica - estrutura organizada

Arquivos principais:
- index.html: página principal
- dados.js: lista oficial das fotos
- dengo.mp3: música
- img/: fotos padronizadas como memoria001.jpg, memoria002.jpg...

Como adicionar foto pela página:
1. Abra a página publicada no GitHub Pages.
2. Clique no botão + no canto inferior direito.
3. Preencha owner, repositório, branch e token.
4. Escolha a imagem e clique em Enviar foto.
5. A página removerá os metadados, limitará a resolução e enviará a imagem para img/.
6. Em seguida, a página atualizará o dados.js.

Privacidade:
- O token nunca é salvo pelo site e é apagado do campo após cada tentativa.
- As imagens novas são regravadas antes do envio, removendo EXIF e GPS.
- O nome original do arquivo não é publicado no dados.js.

Token recomendado:
- Fine-grained token
- Acesso somente a este repositório
- Contents: Read and Write

"use strict";

(() => {
  // Conteúdo e referências da interface
  let imagens = Array.isArray(window.memorias)
    ? window.memorias
        .map((item) => (typeof item === "string" ? item : item.foto))
        .filter(Boolean)
    : [];

  const frases = [
    "Te encontrei onde menos esperava, e agora não me imagino mais sem você.",
    "Entre tantas voltas da vida, foi ao teu lado que escolhi ficar.",
    "Você é meu ponto de paz no caos do mundo.",
    "Com você, até o silêncio tem sentido.",
    "Não foi sorte, foi escolha.",
    "Você é minha certeza em meio às dúvidas.",
    "Nos teus olhos encontrei meu lar.",
    "Nada faz mais sentido sem o seu sorriso.",
    "Até os dias nublados são bonitos com você.",
    "Se eu tivesse que te escolher mil vezes, faria tudo igual.",
    "Seu abraço é o lugar onde minha alma encontra paz.",
    "Você não é só amor, é lar.",
    "Nosso amor é poesia escrita no tempo.",
    "Com você, o ordinário se torna extraordinário.",
    "A vida sorriu pra mim no dia em que você chegou.",
    "O amor que sinto por você é a melhor parte de mim.",
  ];

  const inicioRelacionamento = new Date("2021-01-07T00:00:00");
  const contador = document.getElementById("contador");
  const totalDias = document.getElementById("totalDias");
  const proximoAniversario = document.getElementById("proximoAniversario");
  const totalMemorias = document.getElementById("totalMemorias");
  const slideshow = document.getElementById("slideshow");
  const legendaFoto = document.querySelector(".photo-caption span");
  const frasesContainer = document.getElementById("frasesContainer");
  const musica = document.getElementById("musica");
  const btnMusica = document.getElementById("btnMusica");
  const controleVolume = document.getElementById("controleVolume");
  const volumeValor = document.getElementById("volumeValor");
  const btnMovimento = document.getElementById("btnMovimento");
  const adminToggle = document.getElementById("adminToggle");
  const adminPanel = document.getElementById("adminPanel");
  const adminForm = document.getElementById("adminForm");
  const fecharAdmin = document.getElementById("fecharAdmin");
  const ghOwner = document.getElementById("ghOwner");
  const ghRepo = document.getElementById("ghRepo");
  const ghBranch = document.getElementById("ghBranch");
  const ghToken = document.getElementById("ghToken");
  const novaFoto = document.getElementById("novaFoto");
  const salvarConfig = document.getElementById("salvarConfig");
  const enviarFoto = document.getElementById("enviarFoto");
  const adminStatus = document.getElementById("adminStatus");
  const CONFIG_KEY = "paginaRomanticaGithubConfig";
  const TIPOS_IMAGEM_PERMITIDOS = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  const TAMANHO_MAXIMO_ARQUIVO = 20 * 1024 * 1024;
  const TOTAL_MAXIMO_PIXELS = 50_000_000;
  const LADO_MAXIMO_IMAGEM = 1600;
  const QUALIDADE_IMAGEM = 0.84;
  const prefereMovimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const camadasSlideshow = [];
  let camadaAtiva = 0;
  let fotoAtual = 0;
  let trocaEmAndamento = false;
  let urlTemporariaMemoria = null;
  let movimentoPausado = prefereMovimentoReduzido.matches;
  let intervaloSlideshow = null;
  let intervaloFrases = null;

  // Configuração e envio seguro para o GitHub
  function statusAdmin(texto) {
    adminStatus.textContent = texto || "";
  }

  function carregarConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
      ghOwner.value = cfg.owner || "";
      ghRepo.value = cfg.repo || "";
      ghBranch.value = cfg.branch || "main";
      ghToken.value = "";

      // Migração de segurança: versões anteriores salvavam o token.
      if (Object.prototype.hasOwnProperty.call(cfg, "token")) {
        localStorage.setItem(
          CONFIG_KEY,
          JSON.stringify({
            owner: cfg.owner || "",
            repo: cfg.repo || "",
            branch: cfg.branch || "main",
          }),
        );
      }
    } catch {
      ghBranch.value = "main";
      ghToken.value = "";
    }
  }

  function obterConfig() {
    return {
      owner: ghOwner.value.trim(),
      repo: ghRepo.value.trim(),
      branch: ghBranch.value.trim() || "main",
      token: ghToken.value.trim(),
    };
  }

  function branchGithubValida(branch) {
    return (
      /^[A-Za-z0-9._/-]+$/.test(branch) &&
      !branch.startsWith("/") &&
      !branch.endsWith("/") &&
      !branch.includes("..") &&
      !branch.includes("//") &&
      !branch.endsWith(".lock")
    );
  }

  function validarGithubConfig(cfg) {
    const ownerValido = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(
      cfg.owner,
    );
    const repoValido =
      /^[A-Za-z0-9._-]{1,100}$/.test(cfg.repo) &&
      cfg.repo !== "." &&
      cfg.repo !== "..";

    if (!ownerValido || !repoValido || !branchGithubValida(cfg.branch)) {
      statusAdmin("Confira usuário/organização, repositório e branch.");
      return false;
    }
    return true;
  }

  function salvarGithubConfig(mostrarMensagem = true) {
    const cfg = obterConfig();
    if (!validarGithubConfig(cfg)) {
      return null;
    }

    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({
        owner: cfg.owner,
        repo: cfg.repo,
        branch: cfg.branch,
      }),
    );

    if (mostrarMensagem) {
      statusAdmin(
        "Usuário, repositório e branch foram salvos. O token não foi salvo.",
      );
    }
    return cfg;
  }

  function arrayBufferParaBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function carregarImagemParaCanvas(file) {
    if ("createImageBitmap" in window) {
      return createImageBitmap(file, { imageOrientation: "from-image" });
    }

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível abrir a imagem escolhida."));
      };
      img.src = url;
    });
  }

  function canvasParaBlob(canvas, tipo, qualidade) {
    return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
  }

  async function prepararImagemSegura(file) {
    if (!TIPOS_IMAGEM_PERMITIDOS.has((file.type || "").toLowerCase())) {
      throw new Error("Use uma imagem JPG, PNG ou WebP.");
    }

    if (file.size > TAMANHO_MAXIMO_ARQUIVO) {
      throw new Error("A imagem deve ter no máximo 20 MB.");
    }

    const imagem = await carregarImagemParaCanvas(file);
    const larguraOriginal = imagem.width || imagem.naturalWidth;
    const alturaOriginal = imagem.height || imagem.naturalHeight;

    if (
      !larguraOriginal ||
      !alturaOriginal ||
      larguraOriginal * alturaOriginal > TOTAL_MAXIMO_PIXELS
    ) {
      if (typeof imagem.close === "function") imagem.close();
      throw new Error("A resolução da imagem é grande demais.");
    }

    const escala = Math.min(
      1,
      LADO_MAXIMO_IMAGEM / larguraOriginal,
      LADO_MAXIMO_IMAGEM / alturaOriginal,
    );
    const largura = Math.max(1, Math.round(larguraOriginal * escala));
    const altura = Math.max(1, Math.round(alturaOriginal * escala));
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d", { alpha: true });
    if (!contexto) {
      if (typeof imagem.close === "function") imagem.close();
      throw new Error("O navegador não conseguiu preparar a imagem.");
    }

    contexto.drawImage(imagem, 0, 0, largura, altura);
    if (typeof imagem.close === "function") imagem.close();

    let blob = await canvasParaBlob(canvas, "image/webp", QUALIDADE_IMAGEM);
    let extensao = "webp";

    if (!blob || blob.type !== "image/webp") {
      const tipoAlternativo =
        file.type === "image/png" ? "image/png" : "image/jpeg";
      blob = await canvasParaBlob(canvas, tipoAlternativo, QUALIDADE_IMAGEM);
      extensao = tipoAlternativo === "image/png" ? "png" : "jpg";
    }

    if (!blob) {
      throw new Error("Não foi possível converter a imagem.");
    }

    return { blob, extensao };
  }

  function normalizarListaMemorias(lista) {
    if (!Array.isArray(lista)) return [];

    return lista
      .map((item, index) => {
        const memoria =
          typeof item === "string" ? { id: index + 1, foto: item } : item;

        const id = Number(memoria && memoria.id);
        const foto = String((memoria && memoria.foto) || "");
        if (
          !Number.isInteger(id) ||
          id < 1 ||
          !/^img\/memoria\d{3,}\.(?:webp|jpe?g|png)$/i.test(foto)
        ) {
          return null;
        }

        const normalizada = { id, foto };
        if (memoria.adicionadoEm)
          normalizada.adicionadoEm = String(memoria.adicionadoEm);
        return normalizada;
      })
      .filter(Boolean);
  }

  function proximoArquivoMemoria(extensao, lista = window.memorias) {
    const maiorId = normalizarListaMemorias(lista).reduce(
      (maior, item) => Math.max(maior, item.id),
      0,
    );
    const proximoId = maiorId + 1;
    return {
      id: proximoId,
      caminho: `img/memoria${String(proximoId).padStart(3, "0")}.${extensao}`,
    };
  }

  function atualizarTotalMemorias() {
    totalMemorias.textContent = imagens.length.toLocaleString("pt-BR");
  }

  function atualizarListaLocalMemorias(lista) {
    const listaNormalizada = normalizarListaMemorias(lista);
    window.memorias = listaNormalizada;
    imagens = listaNormalizada.map((item) => item.foto);
    atualizarTotalMemorias();
  }

  function adicionarFotoAoSlideshow(src) {
    if (urlTemporariaMemoria) URL.revokeObjectURL(urlTemporariaMemoria);
    urlTemporariaMemoria = src;
    if (imagens.length) imagens[imagens.length - 1] = src;
  }

  function gerarDadosJs(lista) {
    return `window.memorias = ${JSON.stringify(normalizarListaMemorias(lista), null, 2)};\n`;
  }

  function interpretarDadosJs(texto) {
    const inicio = texto.indexOf("[");
    const fim = texto.lastIndexOf("]");
    if (inicio < 0 || fim <= inicio) {
      throw new Error("O dados.js não contém uma lista válida.");
    }

    const lista = JSON.parse(texto.slice(inicio, fim + 1));
    const listaNormalizada = normalizarListaMemorias(lista);
    if (listaNormalizada.length !== lista.length) {
      throw new Error("O dados.js contém uma memória inválida.");
    }

    const ids = new Set(listaNormalizada.map((item) => item.id));
    const fotos = new Set(listaNormalizada.map((item) => item.foto));
    if (
      ids.size !== listaNormalizada.length ||
      fotos.size !== listaNormalizada.length
    ) {
      throw new Error("O dados.js contém memórias duplicadas.");
    }
    return listaNormalizada;
  }

  function base64ParaTexto(conteudo) {
    const binario = atob(String(conteudo || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binario, (caractere) =>
      caractere.charCodeAt(0),
    );
    return new TextDecoder().decode(bytes);
  }

  function textoParaBase64(texto) {
    return arrayBufferParaBase64(new TextEncoder().encode(texto));
  }

  async function githubRequest(cfg, path, options = {}) {
    const caminhoSeguro = path.split("/").map(encodeURIComponent).join("/");
    const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${caminhoSeguro}`;
    const resposta = await fetch(
      url +
        (options.method === "GET"
          ? `?ref=${encodeURIComponent(cfg.branch)}`
          : ""),
      {
        method: options.method || "GET",
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${cfg.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      },
    );

    const texto = await resposta.text();
    let dados = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = texto;
    }
    if (!resposta.ok) {
      const msg = dados && dados.message ? dados.message : texto;
      throw new Error(msg || `Erro ${resposta.status}`);
    }
    return dados;
  }

  async function enviarArquivoGithub(cfg, path, conteudoBase64, mensagem, sha) {
    return githubRequest(cfg, path, {
      method: "PUT",
      body: {
        message: mensagem,
        content: conteudoBase64,
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
      },
    });
  }

  async function removerArquivoGithub(cfg, path, sha) {
    return githubRequest(cfg, path, {
      method: "DELETE",
      body: {
        message: `Remover envio incompleto ${path}`,
        sha,
        branch: cfg.branch,
      },
    });
  }

  async function enviarNovaFoto() {
    if (enviarFoto.disabled) return;

    let cfg = null;
    let uploadParcial = null;
    let dadosAtualizados = false;

    try {
      cfg = salvarGithubConfig(false);
      if (!cfg) return;

      if (!cfg.token) {
        statusAdmin(
          "Cole o token do GitHub para realizar este envio. Ele não será salvo.",
        );
        return;
      }

      const file = novaFoto.files && novaFoto.files[0];
      if (!file) {
        statusAdmin("Escolha uma imagem primeiro.");
        return;
      }

      enviarFoto.disabled = true;
      statusAdmin("Removendo metadados e preparando imagem...");

      const imagemSegura = await prepararImagemSegura(file);
      statusAdmin("Conferindo a lista atual no GitHub...");
      const dadosAtual = await githubRequest(cfg, "dados.js", {
        method: "GET",
      });
      if (!dadosAtual || !dadosAtual.sha || !dadosAtual.content) {
        throw new Error("Não foi possível ler a versão atual de dados.js.");
      }

      const listaRemota = interpretarDadosJs(
        base64ParaTexto(dadosAtual.content),
      );
      const novo = proximoArquivoMemoria(imagemSegura.extensao, listaRemota);
      const base64Imagem = arrayBufferParaBase64(
        await imagemSegura.blob.arrayBuffer(),
      );

      statusAdmin(`Enviando ${novo.caminho}...`);
      const respostaUpload = await enviarArquivoGithub(
        cfg,
        novo.caminho,
        base64Imagem,
        `Adicionar ${novo.caminho}`,
      );
      const shaUpload =
        respostaUpload && respostaUpload.content && respostaUpload.content.sha;
      if (!shaUpload) {
        throw new Error("O GitHub não confirmou o arquivo enviado.");
      }
      uploadParcial = { caminho: novo.caminho, sha: shaUpload };

      statusAdmin("Atualizando dados.js...");
      const novaLista = [
        ...listaRemota,
        {
          id: novo.id,
          foto: novo.caminho,
          adicionadoEm: new Date().toISOString().slice(0, 10),
        },
      ];

      const dadosJs = gerarDadosJs(novaLista);
      await enviarArquivoGithub(
        cfg,
        "dados.js",
        textoParaBase64(dadosJs),
        "Atualizar lista de memórias",
        dadosAtual.sha,
      );
      dadosAtualizados = true;

      atualizarListaLocalMemorias(novaLista);
      adicionarFotoAoSlideshow(URL.createObjectURL(imagemSegura.blob));
      novaFoto.value = "";

      statusAdmin(
        `Foto adicionada com sucesso: ${novo.caminho}\nA contagem foi atualizada. Em alguns segundos ela também aparecerá após atualizar a página.`,
      );
    } catch (erro) {
      let detalheReversao = "";
      if (cfg && uploadParcial && !dadosAtualizados) {
        statusAdmin(
          "A lista não foi atualizada. Removendo a imagem parcial...",
        );
        try {
          await removerArquivoGithub(
            cfg,
            uploadParcial.caminho,
            uploadParcial.sha,
          );
          detalheReversao = "\nO envio parcial foi removido com segurança.";
        } catch {
          detalheReversao = `\nAtenção: não foi possível remover automaticamente ${uploadParcial.caminho}.`;
        }
      }
      statusAdmin(`Erro: ${erro.message}${detalheReversao}`);
    } finally {
      ghToken.value = "";
      enviarFoto.disabled = false;
    }
  }

  function atualizarLegendaFoto(indice) {
    legendaFoto.textContent = imagens.length
      ? `Memória ${indice + 1} de ${imagens.length}`
      : "";
  }

  function criarCamadaSlideshow() {
    const img = document.createElement("img");
    img.loading = "eager";
    img.decoding = "async";
    img.setAttribute("aria-hidden", "true");
    slideshow.appendChild(img);
    return img;
  }

  function carregarCamadaSlideshow(camada, indice, prioridade = "low") {
    const src = imagens[indice];
    if (!src) return Promise.resolve(false);

    camada.alt = `Memória ${indice + 1} de ${imagens.length}`;
    camada.fetchPriority = prioridade;
    if (
      camada.getAttribute("src") === src &&
      camada.complete &&
      camada.naturalWidth
    ) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      camada.onload = () => {
        camada.onload = null;
        camada.onerror = null;
        resolve(true);
      };
      camada.onerror = () => {
        camada.onload = null;
        camada.onerror = null;
        resolve(false);
      };
      camada.src = src;
    });
  }

  async function iniciarSlideshow() {
    slideshow.replaceChildren();
    camadasSlideshow.length = 0;
    camadaAtiva = 0;
    fotoAtual = 0;
    trocaEmAndamento = true;

    if (!imagens.length) {
      atualizarLegendaFoto(0);
      trocaEmAndamento = false;
      return;
    }

    camadasSlideshow.push(criarCamadaSlideshow(), criarCamadaSlideshow());
    const carregouPrimeira = await carregarCamadaSlideshow(
      camadasSlideshow[0],
      0,
      "high",
    );
    if (carregouPrimeira) {
      camadasSlideshow[0].classList.add("active");
      camadasSlideshow[0].setAttribute("aria-hidden", "false");
    }
    atualizarLegendaFoto(0);

    if (imagens.length > 1) {
      await carregarCamadaSlideshow(camadasSlideshow[1], 1);
    }
    trocaEmAndamento = false;
  }

  async function avancarSlideshow() {
    if (imagens.length < 2 || trocaEmAndamento || camadasSlideshow.length < 2)
      return;
    trocaEmAndamento = true;

    const proximaFoto = (fotoAtual + 1) % imagens.length;
    const proximaCamada = camadaAtiva === 0 ? 1 : 0;
    const camadaNova = camadasSlideshow[proximaCamada];
    const camadaAnterior = camadasSlideshow[camadaAtiva];
    camadaNova.classList.remove("active");

    const carregou = await carregarCamadaSlideshow(
      camadaNova,
      proximaFoto,
      "high",
    );
    if (!carregou) {
      trocaEmAndamento = false;
      return;
    }

    window.requestAnimationFrame(() => camadaNova.classList.add("active"));
    camadaNova.setAttribute("aria-hidden", "false");
    window.setTimeout(async () => {
      camadaAnterior.classList.remove("active");
      camadaAnterior.setAttribute("aria-hidden", "true");
      camadaAtiva = proximaCamada;
      fotoAtual = proximaFoto;
      atualizarLegendaFoto(fotoAtual);

      const seguinte = (fotoAtual + 1) % imagens.length;
      await carregarCamadaSlideshow(camadaAnterior, seguinte);
      trocaEmAndamento = false;
    }, 1050);
  }

  musica.volume = Number(controleVolume.value);
  atualizarListaLocalMemorias(window.memorias);
  carregarConfig();
  iniciarSlideshow();

  let fraseAtual = -1;

  function escolherProximaFrase() {
    if (frases.length <= 1) return 0;
    let proxima = fraseAtual;
    while (proxima === fraseAtual) {
      proxima = Math.floor(Math.random() * frases.length);
    }
    return proxima;
  }

  function mostrarFrase() {
    if (!frasesContainer || !frases.length) return;
    frasesContainer.classList.add("fade");
    window.setTimeout(() => {
      fraseAtual = escolherProximaFrase();
      frasesContainer.textContent = `“${frases[fraseAtual]}”`;
      frasesContainer.classList.remove("fade");
    }, 320);
  }

  function interromperMovimentoAutomatico() {
    if (intervaloSlideshow) window.clearInterval(intervaloSlideshow);
    if (intervaloFrases) window.clearInterval(intervaloFrases);
    intervaloSlideshow = null;
    intervaloFrases = null;
  }

  function iniciarMovimentoAutomatico() {
    interromperMovimentoAutomatico();
    if (movimentoPausado) return;
    intervaloSlideshow = window.setInterval(avancarSlideshow, 4200);
    intervaloFrases = window.setInterval(mostrarFrase, 5600);
  }

  function definirMovimentoPausado(pausado) {
    movimentoPausado = Boolean(pausado);
    btnMovimento.setAttribute("aria-pressed", String(movimentoPausado));
    btnMovimento.textContent = movimentoPausado
      ? "▶ Retomar animações"
      : "⏸ Pausar animações";
    iniciarMovimentoAutomatico();
  }

  function adicionarAnosPreservandoDia(data, quantidade) {
    const resultado = new Date(data);
    const dia = resultado.getDate();
    resultado.setDate(1);
    resultado.setFullYear(resultado.getFullYear() + quantidade);
    resultado.setDate(
      Math.min(
        dia,
        new Date(
          resultado.getFullYear(),
          resultado.getMonth() + 1,
          0,
        ).getDate(),
      ),
    );
    return resultado;
  }

  function adicionarMesesPreservandoDia(data, quantidade) {
    const resultado = new Date(data);
    const dia = resultado.getDate();
    resultado.setDate(1);
    resultado.setMonth(resultado.getMonth() + quantidade);
    resultado.setDate(
      Math.min(
        dia,
        new Date(
          resultado.getFullYear(),
          resultado.getMonth() + 1,
          0,
        ).getDate(),
      ),
    );
    return resultado;
  }

  function diferencaCalendario(inicio, fim) {
    if (fim < inicio) {
      return { anos: 0, meses: 0, dias: 0, horas: 0, minutos: 0, segundos: 0 };
    }

    let anos = fim.getFullYear() - inicio.getFullYear();
    let cursor = adicionarAnosPreservandoDia(inicio, anos);
    if (cursor > fim) {
      anos -= 1;
      cursor = adicionarAnosPreservandoDia(inicio, anos);
    }

    let meses =
      (fim.getFullYear() - cursor.getFullYear()) * 12 +
      fim.getMonth() -
      cursor.getMonth();
    let candidato = adicionarMesesPreservandoDia(cursor, meses);
    if (candidato > fim) {
      meses -= 1;
      candidato = adicionarMesesPreservandoDia(cursor, meses);
    }
    cursor = candidato;

    let dias = 0;
    while (true) {
      const proximoDia = new Date(cursor);
      proximoDia.setDate(proximoDia.getDate() + 1);
      if (proximoDia > fim) break;
      cursor = proximoDia;
      dias += 1;
    }

    const restante = Math.max(0, fim - cursor);
    const horas = Math.floor(restante / 3_600_000);
    const minutos = Math.floor(restante / 60_000) % 60;
    const segundos = Math.floor(restante / 1000) % 60;
    return { anos, meses, dias, horas, minutos, segundos };
  }

  function numeroDiasEntreDatas(inicio, fim) {
    const inicioUtc = Date.UTC(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate(),
    );
    const fimUtc = Date.UTC(fim.getFullYear(), fim.getMonth(), fim.getDate());
    return Math.max(0, Math.floor((fimUtc - inicioUtc) / 86_400_000));
  }

  function atualizarContador() {
    const agora = new Date();
    const tempo = diferencaCalendario(inicioRelacionamento, agora);
    const diasTotais = numeroDiasEntreDatas(inicioRelacionamento, agora);

    contador.textContent = `${tempo.anos} anos, ${tempo.meses} meses, ${tempo.dias} dias, ${tempo.horas}h ${tempo.minutos}min ${tempo.segundos}s`;
    totalDias.textContent = diasTotais.toLocaleString("pt-BR");

    const hojeUtc = Date.UTC(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
    );
    let aniversarioUtc = Date.UTC(agora.getFullYear(), 0, 7);
    if (hojeUtc > aniversarioUtc)
      aniversarioUtc = Date.UTC(agora.getFullYear() + 1, 0, 7);
    proximoAniversario.textContent = Math.round(
      (aniversarioUtc - hojeUtc) / 86_400_000,
    );
  }

  btnMusica.addEventListener("click", async () => {
    musica.volume = Number(controleVolume.value);
    if (musica.paused) {
      try {
        await musica.play();
        btnMusica.textContent = "⏸ Pausar música";
        btnMusica.setAttribute("aria-pressed", "true");
      } catch {
        btnMusica.textContent = "▶ Tocar nossa música";
        btnMusica.setAttribute("aria-pressed", "false");
      }
    } else {
      musica.pause();
      btnMusica.textContent = "▶ Tocar nossa música";
      btnMusica.setAttribute("aria-pressed", "false");
    }
  });

  controleVolume.addEventListener("input", () => {
    musica.volume = Number(controleVolume.value);
    volumeValor.value = `${Math.round(musica.volume * 100)}%`;
  });

  function definirPainelAdmin(aberto, devolverFoco = true) {
    adminPanel.hidden = !aberto;
    adminToggle.setAttribute("aria-expanded", String(aberto));
    adminToggle.setAttribute(
      "aria-label",
      aberto
        ? "Fechar painel para adicionar foto"
        : "Abrir painel para adicionar foto",
    );

    if (aberto) {
      ghOwner.focus();
    } else if (devolverFoco) {
      adminToggle.focus();
    }
  }

  btnMovimento.addEventListener("click", () => {
    definirMovimentoPausado(!movimentoPausado);
  });

  prefereMovimentoReduzido.addEventListener("change", (evento) => {
    definirMovimentoPausado(evento.matches);
  });

  adminToggle.addEventListener("click", () => {
    definirPainelAdmin(adminPanel.hidden);
  });

  fecharAdmin.addEventListener("click", () => {
    definirPainelAdmin(false);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !adminPanel.hidden) {
      definirPainelAdmin(false);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      interromperMovimentoAutomatico();
    } else {
      iniciarMovimentoAutomatico();
    }
  });

  salvarConfig.addEventListener("click", () => {
    salvarGithubConfig(true);
    ghToken.value = "";
  });

  adminForm.addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviarNovaFoto();
  });

  window.addEventListener("pagehide", () => {
    interromperMovimentoAutomatico();
    ghToken.value = "";
    if (urlTemporariaMemoria) {
      URL.revokeObjectURL(urlTemporariaMemoria);
      urlTemporariaMemoria = null;
    }
  });

  volumeValor.value = `${Math.round(musica.volume * 100)}%`;
  mostrarFrase();
  definirMovimentoPausado(movimentoPausado);
  atualizarContador();
  window.setInterval(atualizarContador, 1000);
})();

# Vortex Cam

Aplicativo web que captura a câmera do dispositivo em tempo real e a transforma em um **vórtice fractal psicodélico**: centenas de cópias do vídeo giram numa espiral logarítmica, com túnel infinito, feedback de caleidoscópio, aberração cromática e brilho. Dá para ajustar tudo ao vivo e **gravar o resultado em MP4 ou WebM**.

Feito com **React + TypeScript + Vite + Three.js**, com **GSAP** nas animações e **Zustand** no estado.

> **Aviso de fotossensibilidade:** o efeito tem rotação rápida e cores muito vibrantes. Pode causar desconforto em pessoas sensíveis a imagens piscantes ou em movimento intenso.

---

## Sumário

1. [Recursos](#recursos)
2. [Começando](#começando)
3. [Testando no celular](#testando-no-celular)
4. [Deploy no GitHub Pages](#deploy-no-github-pages)
5. [Como usar](#como-usar)
6. [Estrutura do projeto](#estrutura-do-projeto)
7. [Como o efeito funciona](#como-o-efeito-funciona)
8. [Gravação de vídeo](#gravação-de-vídeo)
9. [Performance](#performance)
10. [Compatibilidade](#compatibilidade)
11. [Personalização](#personalização)
12. [Solução de problemas](#solução-de-problemas)
13. [Licença](#licença)

---

## Recursos

- **Câmera** frontal e traseira, com alternância em tempo real e preview ao vivo. Câmera frontal espelhada como selfie.
- **Espiral logarítmica** de até 400 clones instanciados (uma única chamada de desenho na GPU).
- **Vertex shader** com distorção radial, vórtice, ondulação, distorção de barril e inclinação 3D por clone.
- **Fragment shaders** com swirl, vortex, aberração cromática, glow e feedback trail.
- **Túnel infinito** sem emendas: a espiral flui continuamente, sem "pulo" visível.
- **Caleidoscópio** de 2 a 12 fatias, aplicado ao feedback e à imagem final.
- **Interação:** toque ou arraste na imagem para mover o centro do vórtice, com um "soco" de distorção que se dissipa.
- **Controles:** intensidade, velocidade de rotação, quantidade de clones, mais ajustes avançados e 4 estilos prontos com transição suave.
- **Gravação** com `MediaRecorder` (MP4 quando o navegador suporta, senão WebM) e download automático. Em aparelhos que permitem, aparece também o botão **Compartilhar**.
- **60 FPS:** `requestAnimationFrame`, renderização em WebGL2 e resolução dinâmica caso o aparelho não acompanhe.
- **Code splitting:** o Three.js só é baixado depois do clique em "Iniciar câmera".
- Ajustes salvos no `localStorage`.

## Começando

Requisitos: **Node.js 18+** (recomendado 20).

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`). A câmera funciona em `localhost` sem HTTPS.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run dev:https` | Servidor com HTTPS local, exposto na rede (para testar no celular) |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run build` | Checa tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |

## Testando no celular

Navegadores só liberam a câmera em **HTTPS** (ou `localhost`). Para testar no celular pela rede local:

```bash
npm run dev:https
```

Abra no celular o endereço `https://<IP-do-computador>:5173`. Como o certificado é autoassinado, aceite o aviso do navegador uma vez. Computador e celular precisam estar na mesma rede Wi-Fi.

## Deploy no GitHub Pages

O projeto já vem pronto: `base: './'` no `vite.config.ts` (funciona em qualquer subcaminho) e o workflow `.github/workflows/deploy.yml`.

1. Crie um repositório no GitHub e envie o código para a branch `main`:
   ```bash
   git init
   git add .
   git commit -m "Vortex Cam"
   git branch -M main
   git remote add origin https://github.com/<usuario>/<repositorio>.git
   git push -u origin main
   ```
2. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. A cada push na `main`, o workflow instala, compila e publica. O endereço final é `https://<usuario>.github.io/<repositorio>/`.

Dicas:

- Depois do primeiro `npm install`, faça commit do `package-lock.json` e troque `npm install` por `npm ci` no workflow, para builds reproduzíveis.
- Deploy manual, sem Actions: rode `npm run build` e publique o conteúdo de `dist/` na branch `gh-pages` (por exemplo com o pacote `gh-pages`).
- O GitHub Pages serve em HTTPS, então a câmera funciona normalmente.

## Como usar

1. Toque em **Iniciar câmera** e permita o acesso.
2. Use o botão de ajustes para abrir o painel. Escolha um estilo pronto ou mexa nos sliders.
3. Toque ou arraste sobre a imagem para deslocar o centro do vórtice.
4. Use o botão de alternar câmera para trocar entre frontal e traseira.
5. Toque no botão vermelho para gravar, e toque de novo para parar. O arquivo é baixado automaticamente.
6. O botão de olho oculta a interface para você ver o efeito limpo (a interface nunca aparece na gravação).

**Controles principais**

| Slider | Efeito |
| --- | --- |
| Intensidade | Força de todas as deformações. Em 0%, mostra só a câmera |
| Velocidade de rotação | Giro do padrão. Valores negativos invertem o sentido |
| Quantidade de clones | De 12 a 400 cópias. Mais clones deixam a espiral mais densa |

**Ajustes avançados:** velocidade do túnel (negativo inverte para "sair" do túnel), voltas da espiral, tamanho dos clones, rastro, brilho, aberração cromática e caleidoscópio.

**Atalhos no desktop:** `R` grava/para, `F` alterna a câmera, `H` oculta/mostra a interface.

## Estrutura do projeto

```
vortex-cam/
├── .github/workflows/deploy.yml     # deploy automático no GitHub Pages
├── index.html
├── vite.config.ts                   # base relativa, code splitting, HTTPS opcional
├── public/favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── pages/
    │   └── VortexPage.tsx           # orquestra câmera, gravação, painel e atalhos
    ├── components/
    │   ├── VortexStage.tsx          # canvas (carregado sob demanda, contém o Three.js)
    │   ├── StartScreen.tsx          # tela inicial (animação com GSAP)
    │   ├── ControlPanel.tsx         # presets + sliders
    │   ├── ParamSlider.tsx
    │   ├── Toolbar.tsx              # ajustes, gravar, alternar câmera, ocultar
    │   ├── RecordButton.tsx
    │   ├── Toast.tsx                # aviso pós-gravação (compartilhar / baixar)
    │   └── Icons.tsx
    ├── shaders/
    │   ├── common.glsl              # rotação, hue, caleidoscópio, cover-fit
    │   ├── fullscreen.vert.glsl
    │   ├── clone.vert.glsl          # espiral + deformação por vértice
    │   ├── clone.frag.glsl          # swirl local, aberração, tinta, moldura neon
    │   ├── feedback.frag.glsl       # rastro + túnel + vórtice + caleidoscópio
    │   ├── post.frag.glsl           # vortex de tela, aberração, glow, vinheta
    │   └── index.ts
    ├── hooks/
    │   ├── useCamera.ts             # getUserMedia, frontal/traseira, erros em português
    │   ├── useRecorder.ts           # MediaRecorder + download automático
    │   ├── useVortexEngine.ts       # ciclo de vida do motor Three.js
    │   └── useVortexStore.ts        # Zustand (parâmetros, persistência, presets com GSAP)
    └── utils/
        ├── VortexEngine.ts          # renderer, passes, loop com requestAnimationFrame
        ├── spiral.ts                # matemática da espiral
        ├── params.ts                # tipos, limites, padrões e presets
        ├── recorder.ts              # escolha de formato e captura do canvas
        └── device.ts
```

## Como o efeito funciona

### 1. Espiral logarítmica por semelhança

Cada clone `k` é o clone anterior multiplicado por um número complexo `c = decay · e^(iΔθ)`:

```
e      = k + fase
escala = decay^e
raio   = R0 · escala
ângulo = e · Δθ + rotação
```

Como `decay = 0,006^(1/N)` e `Δθ = voltas · 2π / N`, a espiral sempre vai do tamanho máximo até 0,6% dele e dá o mesmo número de voltas, qualquer que seja `N`. Mais clones apenas deixam tudo mais denso.

O truque do **loop infinito**: `fase` desliza de 1 até 0 e reinicia. No reinício, o clone `k` assume exatamente a posição que o clone `k+1` tinha, e as pontas do túnel entram e saem com transparência, então não há emenda visível. Tudo é calculado no vertex shader a partir de um único atributo por instância.

### 2. Pipeline de renderização (por quadro)

```
câmera (VideoTexture)
   │
   ├─► Passe 1 → RT[write]
   │     ├─ feedback.frag : quadro anterior girado, ampliado, com matiz deslocado e mais um pouco de câmera
   │     └─ clones (instanciados, blend normal): clone.vert + clone.frag
   │
   ├─ troca ping-pong (o resultado vira o "quadro anterior")
   │
   └─► Passe 2 → tela : post.frag (vortex, aberração cromática, glow, vinheta)
```

O feedback usa a **mesma velocidade angular e de zoom** dos clones, então o rastro acompanha a espiral em vez de brigar com ela. O matiz do rastro gira a cada quadro, o que produz o arco-íris típico do vídeo-feedback.

### 3. Shaders

| Recurso pedido | Onde está |
| --- | --- |
| Deformação (vertex) | `clone.vert.glsl`: vórtice, ondulação radial, barril, inclinação 3D, perspectiva |
| Swirl | `clone.frag.glsl` (dentro de cada clone), `feedback.frag.glsl` e `post.frag.glsl` |
| Vortex | `post.frag.glsl` (tela) e `clone.vert.glsl` (geometria) |
| Aberração cromática | `clone.frag.glsl` e `post.frag.glsl` (canais R e B deslocados em sentidos opostos) |
| Glow | `post.frag.glsl` (14 amostras em espiral áurea sobre as áreas claras) |
| Feedback trail | `feedback.frag.glsl` com render targets em ping-pong (half-float quando disponível) |

Os shaders são arquivos `.glsl` importados com `?raw` e concatenados com `common.glsl`.

## Gravação de vídeo

- O canvas WebGL é copiado a cada quadro para um canvas 2D intermediário, e a gravação sai desse canvas. Isso evita `preserveDrawingBuffer` (que custa FPS em celulares), funciona no Safari e garante dimensões pares, exigência do H.264.
- Formato escolhido automaticamente, nesta ordem: MP4 (H.264), WebM VP9, WebM VP8, WebM genérico.
- Resolução máxima de 1920 px no lado maior, limitada pela resolução de renderização do aparelho.
- O download começa sozinho ao parar. Onde o navegador permite, o aviso também oferece **Compartilhar**, útil no iPhone para enviar direto ao Instagram, TikTok ou Fotos.
- A gravação é somente de vídeo (sem áudio).

## Performance

- Uma única chamada de desenho para todos os clones (`InstancedBufferGeometry`).
- Render targets em half-float quando o aparelho suporta.
- Resolução limitada a 1,5× em celulares e 2× em desktops.
- **Resolução dinâmica:** se o FPS ficar abaixo de ~48 por cerca de 2 segundos, a resolução cai em passos até 60% do original. Nunca sobe de volta, para não oscilar.
- Ainda com pouco desempenho: reduza **Quantidade de clones**, **Tamanho dos clones** e **Brilho**. O modo de economia de energia do iPhone limita a tela a 30 FPS.

## Compatibilidade

O efeito exige **WebGL 2**. A gravação exige `MediaRecorder`.

| Plataforma | Observações |
| --- | --- |
| Android (Chrome, Edge, Firefox) | Câmera traseira e frontal. Grava MP4 ou WebM conforme a versão |
| iPhone / iPad (Safari) | Precisa de iOS com WebGL 2 e `MediaRecorder` (versões recentes). Grava MP4. Câmera aberta dentro de um gesto de toque |
| Desktop (Chrome, Edge, Firefox, Safari) | Usa a webcam disponível. O botão de alternar aparece se houver mais de uma câmera |

Navegadores dentro de aplicativos (webviews do Instagram, TikTok etc.) costumam bloquear a câmera. Abra o link no navegador do sistema.

## Personalização

- **Padrões e estilos prontos:** `src/utils/params.ts`.
- **Aparência da espiral:** `MIN_RATIO` em `src/utils/spiral.ts` (tamanho relativo do menor clone) e `R0` em `VortexEngine.update`.
- **Cores e brilho:** `clone.frag.glsl` (tinta e moldura neon) e `post.frag.glsl` (glow, saturação, vinheta).
- **Limite de clones:** `MAX_CLONES` em `VortexEngine.ts`.
- **Resolução:** `maxPixelRatio()` em `src/utils/device.ts`.
- **Tema da interface:** variáveis CSS no topo de `src/index.css`.

## Solução de problemas

| Problema | O que fazer |
| --- | --- |
| "Permissão da câmera negada" | Libere a câmera nas configurações do site/navegador e recarregue |
| Câmera não abre | Confirme que o endereço é HTTPS (ou `localhost`) e que nenhum outro app usa a câmera |
| Tela preta com câmera ativa | Feche outras abas que usem a câmera. No iOS, abra no Safari em vez de um navegador embutido |
| "WebGL 2 não suportado" | Atualize o navegador e ative a aceleração de hardware |
| Vídeo gravado vazio | Grave por alguns segundos antes de parar |
| Baixo FPS | Veja a seção [Performance](#performance) |
| Página em branco no GitHub Pages | Confirme que **Settings → Pages → Source** está como **GitHub Actions** |

## Licença

MIT. Use, modifique e publique à vontade.

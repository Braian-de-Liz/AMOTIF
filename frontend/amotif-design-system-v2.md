# AMOTIF — Design System v2
 
Revisão do design system atual. Mantém 100% a identidade verde-natural já construída;
remove os padrões que leem como "gerado por IA" (glass em tudo, gradiente diagonal em
botão, radius uniforme, stagger genérico) e introduz um elemento de assinatura real:
a **waveform**.
 
---
 
## 1. O que mudou e por quê
 
| Antes | Depois | Motivo |
|---|---|---|
| Glassmorphism em cards, forms, search bar | Glass só em navbar e modal | Glass em tudo é o tell mais forte de UI genérica de IA |
| Gradiente 135deg + shimmer no botão CTA | Cor sólida `--verde-musgo`, sem shimmer | Gradiente diagonal em botão é padrão-template |
| Radius uniforme (`--radius-pill` em tudo) | Radius diferenciado por função | Sem hierarquia de raio, nada parece decidido |
| Só Inter, em tudo | Inter (UI/corpo) + Fraunces (títulos) + mono (dados) | Uma única face vira "papel de parede" |
| Paleta 100% monocromática | Verde + 1 accent pontual (latão) + tinta quase-preta pra títulos | Contraste de tom sem sair da identidade |
| `fadeInUp` com stagger `nth-child` em tudo | Motion só onde há significado (ordem real de camadas) | Stagger universal é decoração, não informação |
| Nenhum elemento de assinatura | Waveform como divisor / loading / empty state / sublinhado de hero | O produto é sobre áudio e sync — o motivo visual estava óbvio e sem uso |
 
---
 
## 2. Paleta de Cores
 
### Verde (identidade da marca — mantido)
 
| Token | Cor | Uso |
|---|---|---|
| `--verde-pastel` | `#dce8d9` | Fundos suaves, badges |
| `--verde-claro` | `#b8d0b0` | Bordas, hover states |
| `--verde-medio` | `#7a9f6a` | Ícones ativos, follow buttons |
| `--verde-musgo` | `#5c7a44` | **Cor principal** — CTA sólido, links, acentos |
| `--verde-tinta` | `#1f2b1a` | Títulos, texto de alto contraste (substitui o antigo `--verde-escuro` como cor de título) |
 
### Accent de assinatura (novo — uso pontual, nunca estrutural)
 
| Token | Cor | Uso |
|---|---|---|
| `--accent-latao` | `#b8912f` | Favoritos, destaque, badge "featured" — dourado-areia opaco, remete a instrumento/latão sem virar rainbow-SaaS |
 
### Neutros
 
| Token | Cor | Uso |
|---|---|---|
| `--fundo` | `#f7f8f5` | Fundo da página |
| `--fundo-secundario` | `#eef1ea` | Superfícies secundárias |
| `--branco` | `#ffffff` | Cards, modals, forms (superfície sólida, não glass) |
| `--cinza-suave` | `#e9ede7` | Hover states, empty states |
 
### Texto
 
| Token | Cor | Uso |
|---|---|---|
| `--texto-principal` | `#1f2b1a` | Texto primário e títulos (mais contraste que antes) |
| `--texto-secundario` | `#55684c` | Texto muted, labels |
| `--placeholder` | `#8a9a82` | Placeholder de inputs |
| `--borda` | `rgba(92, 122, 68, 0.14)` | Bordas gerais |
 
### Semânticas (mantidas — já funcionavam bem)
 
| Token | Cor | Contexto |
|---|---|---|
| `--erro` | `#dc2626` | Erros, exclusão |
| `--erro-bg` | `#fef2f2` | Fundo de erros |
| `--sucesso` | `#16a34a` | Aprovação |
| `--sucesso-bg` | `#f0fdf4` | Fundo de sucesso |
| `--aviso` | `#d97706` | Avisos, pendências |
| `--aviso-bg` | `#fef3c7` | Fundo de avisos |
| `--info` | `#2563eb` | Informações |
| `--cor-like` | `#ef4444` | Coração / curtir |
 
**Regra:** `--accent-latao` é a única cor "extra" da paleta e só aparece em favoritos/destaque —
nunca em botão, nunca em fundo de seção.
 
---
 
## 3. Gradiente (uso drasticamente reduzido)
 
O gradiente diagonal deixou de ser o padrão de botão. Sobrevive só onde o espaço é
grande o bastante pra sustentar narrativa visual:
 
| Token | Valor | Uso |
|---|---|---|
| `--gradiente-hero` | `linear-gradient(170deg, #5c7a44 0%, #7a9f6a 55%, #b8d0b0 100%)` | **Único** lugar com gradiente visível: hero de login/cadastro |
 
Botões, badges e cards passam a usar cor sólida. Gradiente em botão CTA foi removido.
 
---
 
## 4. Glassmorphism (escopo restrito)
 
```css
--glass-bg: rgba(255, 255, 255, 0.75);
--glass-bg-solid: rgba(255, 255, 255, 0.9);
--glass-border: 1px solid rgba(92, 122, 68, 0.1);
--glass-blur: blur(14px);
```
 
**Onde usar:** navbar, modal — superfícies que flutuam sobre conteúdo.
**Onde NÃO usar (mudou):** cards, forms, search bar, mural, lista de colaboradores.
Essas viram superfície sólida branca (`--branco`) com borda fina (`--borda`).
 
---
 
## 5. Tipografia
 
Três papéis, cada um com um trabalho:
 
| Papel | Fonte | Peso | Uso |
|---|---|---|---|
| **Display** | Fraunces (variable) | 500 / 600 | H1, H2, título de hero, número de destaque |
| **UI / corpo** | Inter | 400 / 500 / 600 | Corpo, labels, botões, nav, formulários |
| **Dados técnicos** | JetBrains Mono | 400 / 500 | BPM, `delayMs`, timestamps de track, marcações de waveform |
 
Fraunces entra especificamente pelas curvas orgânicas — conversa com o "natural/orgânico"
que já é a personalidade da marca, e cria contraste real com a Inter utilitária.
JetBrains Mono aparece só em dado técnico de áudio — é um detalhe que só faz sentido
porque o produto sincroniza camadas por offset em milissegundos.
 
| Token | Tamanho | Face |
|---|---|---|
| `--text-xs` | 0.75rem (12px) | Inter / Mono — badges, timestamps |
| `--text-sm` | 0.8125rem (13px) | Inter — labels |
| `--text-base` | 0.9375rem (15px) | Inter — corpo, inputs |
| `--text-lg` | 1.0625rem (17px) | Inter — labels de formulário |
| `--text-xl` | 1.25rem (20px) | Fraunces 500 — títulos de seção |
| `--text-2xl` | 1.5rem (24px) | Fraunces 500 — sub-títulos |
| `--text-3xl` | 1.75rem (28px) | Fraunces 600 — títulos de página |
| `--text-4xl` | 2rem (32px) | Fraunces 600 — headers grandes |
| `--text-5xl` | 2.25rem (36px) | Fraunces 600 — dashboard headings |
 
**Letter-spacing:** `-0.01em` só em Fraunces acima de `--text-2xl`. Não aplicar em Inter —
a tightening universal em tudo foi um dos tells genéricos.
 
---
 
## 6. Spacing
 
Sem alteração — a escala em `rem` já era consistente e correta.
 
| Token | Valor |
|---|---|
| `--space-2xs` | 0.25rem |
| `--space-xs` | 0.5rem |
| `--space-sm` | 0.75rem |
| `--space-md` | 1rem |
| `--space-lg` | 1.5rem |
| `--space-xl` | 2rem |
| `--space-2xl` | 2.5rem |
| `--space-3xl` | 3rem |
| `--space-4xl` | 4rem |
 
---
 
## 7. Border Radius (agora diferenciado por função)
 
| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | 4px | Elementos pequenos |
| `--radius-sm` | 6px | Badges pequenos |
| `--radius-base` | 8px | **Botões e inputs** (era pill 10px em tudo) |
| `--radius-md` | 10px | Icon buttons |
| `--radius-lg` | 12px | Cards pequenos, tabs |
| `--radius-xl` | 14px | Cards grandes, modals (era 16px — leve redução) |
| `--radius-2xl` | 20px | Profile elements |
| `--radius-full` | 9999px | Avatares, círculos verdadeiros, badges realmente ovais |
 
**Regra nova:** cada elemento usa o radius da sua categoria funcional, não um valor
default aplicado a tudo. Botão não é mais pill por padrão.
 
---
 
## 8. Sombras
 
Mantidas com toque verde, intensidade de hover reduzida (estava exagerada):
 
| Token | Valor | Uso |
|---|---|---|
| `--sombra-card` | `0 2px 8px rgba(92,122,68,0.06), 0 6px 18px rgba(0,0,0,0.05)` | Cards em repouso |
| `--sombra-card-hover` | `0 6px 16px rgba(92,122,68,0.12), 0 3px 8px rgba(0,0,0,0.05)` | Cards em hover |
| `--sombra-popup` | `0 8px 24px rgba(0,0,0,0.1)` | Popups, dropdowns |
| `--sombra-modal` | `0 24px 48px rgba(0,0,0,0.15)` | Modals |
| `--sombra-overlay` | `rgba(31, 43, 26, 0.5)` | Backdrop de modais |
 
---
 
## 9. Botões
 
### Primário (CTA)
```css
background: var(--verde-musgo);
color: white;
border-radius: var(--radius-base); /* 8px, não pill */
box-shadow: 0 2px 8px rgba(92, 122, 68, 0.25);
```
- Hover: `background: #506b3a` (verde-musgo -6% luz) + `translateY(-1px)`
- Active: `scale(0.98)`
- **Sem gradiente. Sem shimmer.**
### Secundário (Outline)
```css
background: transparent;
border: 1px solid var(--borda);
color: var(--texto-secundario);
border-radius: var(--radius-base);
```
 
### Perigo
```css
background: transparent;
border: 1px solid rgba(220, 38, 38, 0.2);
color: var(--erro);
```
 
### Ícones
```css
background: var(--branco);
border: 1px solid var(--borda);
border-radius: var(--radius-sm);
```
 
---
 
## 10. Cards (agora superfície sólida)
 
```css
background: var(--branco);
border-radius: var(--radius-xl); /* 14px */
border: 1px solid rgba(92, 122, 68, 0.08);
box-shadow: var(--sombra-card);
```
 
**Hover:**
```css
transform: translateY(-2px); /* era -3px */
box-shadow: var(--sombra-card-hover);
border-color: rgba(92, 122, 68, 0.18);
```
 
**Entrada:** sem stagger automático por `nth-child`. Animação de entrada só onde a
ordem carrega informação real (ex: lista de camadas de áudio na ordem em que foram
adicionadas ao projeto).
 
---
 
## 11. Formulários
 
- Input border: `1px solid var(--borda)`
- Input focus: `border-color: var(--verde-medio)` + `box-shadow: 0 0 0 3px rgba(92, 122, 68, 0.1)`
- Input background: `var(--fundo)` em repouso, `var(--branco)` em focus
- Fundo sólido, sem glass
---
 
## 12. Elemento de assinatura: Waveform
 
Este é o elemento que só existe porque é o AMOTIF — um produto de sincronização de
camadas de áudio. Uma linha de waveform (barras verticais de altura variável, em
`--verde-medio` ou `--verde-tinta`) substitui divisores genéricos:
 
- **Divisor de seção:** waveform fina no lugar de `<hr>` entre blocos do dashboard
- **Loading state:** barras da waveform "pulsam" em sequência em vez de spinner genérico
- **Empty state:** waveform "achatada" (todas as barras baixas) com call-to-action
- **Sublinhado de hero:** uma waveform fina sob o H1 da página de login/cadastro, no
  lugar de um underline reto
A waveform usa `--verde-medio` em repouso e `--verde-musgo` em estados ativos/hover.
Altura de barra máxima ~24px, largura de barra 2–3px, gap 2px — discreta, não decorativa.
 
---
 
## 13. Navegação
 
Sem alteração estrutural. Desktop: top bar horizontal com glass (mantido — é uma
superfície flutuante, uso correto). Mobile: bottom tab bar fixa, 4 links.
 
---
 
## 14. Modais
 
- Overlay: `var(--sombra-overlay)` com `backdrop-filter: blur(4px)`
- Container: glass (`--glass-bg-solid`) — mantido, é overlay legítimo
- Animação: `scaleIn` (0.2s)
- Variante perigo: borda top vermelha
---
 
## 15. Animações
 
| Nome | Efeito | Duração | Uso |
|---|---|---|---|
| `fadeIn` | opacity 0 → 1 | 0.2s | Modals, painéis |
| `scaleIn` | scale(0.97) → 1 | 0.2s | Modais |
| `slideDown` | translateY(-6px) → 0 | 0.2s | Dropdowns, erros |
| `waveformPulse` | altura de barra anima em sequência | 0.6s loop | Loading states |
| `layerReveal` | entrada de card na ordem real de adição da camada | 0.25s/item | Lista de camadas de um projeto |
 
**Removido:** `fadeInUp` genérico com stagger `nth-child` aplicado a qualquer lista de
cards. Motion agora é reservado pra onde carrega informação (ordem de camadas) ou
identidade (waveform).
 
---
 
## 16. Ícones
 
Lucide-react, tamanhos mantidos (14/16/18/20/24px conforme contexto).
 
---
 
## 17. Responsividade
 
Sem alteração — breakpoint `768px`, mesma estrutura desktop/mobile.
 
---
 
## 18. Anti-patterns (atualizado)
 
1. Não usar bordas laterais coloridas (`border-left`)
2. Não usar gradiente em botão CTA — cor sólida
3. Não usar shimmer/glow em hover de botão
4. Não usar glass fora de navbar/modal
5. Não usar o mesmo `border-radius` em botão, card e badge
6. Não aplicar `fadeInUp` + stagger `nth-child` como default de qualquer lista
7. Não usar sombras pretas pesadas
8. Não usar cores hipersaturadas
9. Não usar mais de uma face de destaque além de Fraunces/Inter/Mono
10. Não usar a waveform como decoração solta — só como divisor, loading, empty state ou sublinhado de hero
---
 
## 19. Arquitetura de CSS
 
Sem alteração na estrutura de arquivos — `Global.css`, `Navbar.css`, `Form.css`,
`Login.css`, `Cadastro.css`, `Shared.css`, `Studio.css`, `User.css`, `Home.css`
continuam com as mesmas responsabilidades. O que muda é o conteúdo dos tokens em
`Global.css` e a remoção de classes de glass/gradiente em `Shared.css`/`Studio.css`.
 
---
 
*v2 — Agosto 2026*
Aqui está o guia completo de estilo para o AMOTIF, consolidado em um arquivo Markdown (.md) para você consultar e aplicar no seu Front-end.🎵 Guia de Design System: AMOTIF - "Luminous Mint"Este documento define a identidade visual da plataforma, focando em leveza, clareza e modernidade, utilizando tons de verde sálvia e menta para criar um ambiente criativo e harmônico.🎨 1. Paleta de Cores (Hexadecimal)AplicaçãoCorHexDescriçãoPrimária#2D5A27Verde Floresta (Textos, Logos e Botões Principais)Secundária#D1E8E2Verde Menta Suave (Cards, Hovers e Backgrounds Secundários)Background#F7F9F7Off-White Esverdeado (Fundo principal da aplicação)Suporte#FFFFFFBranco Puro (Fundo de inputs e áreas de destaque)Bordas#E0E7E1Cinza Sálvia (Linhas sutis e divisores)✍️ 2. TipografiaA tipografia deve ser limpa e sem serifa para manter a estética moderna.Títulos (H1, H2, H3): Montserrat ou Poppins.Uso: Peso 600 (Semibold). Passa uma imagem de autoridade técnica.Corpo de Texto: Inter ou Roboto.Uso: Peso 400 (Regular). Focado em legibilidade para descrições de projetos e nomes de trilhas.📐 3. Conceitos de UI (Interface do Usuário)A. Botões e AçõesFormato: border-radius: 8px. Evite cantos retos (muito rígidos) ou redondos demais (muito infantis).Efeito: Sombras suaves (box-shadow: 0 4px 6px rgba(0,0,0,0.05)) em vez de bordas pesadas.B. Navegação (Nav)A Nav deve ser fixa no topo, com fundo branco ou translúcido.Contraste: Use o Verde Primário (#2D5A27) para os ícones e links.Estado Ativo: O item do menu atual deve ter um sublinhado sutil ou fundo em #D1E8E2.C. Cards de Projetos e CamadasCada projeto no feed deve estar dentro de um card com fundo branco.Use padding: 20px para dar "ar" ao conteúdo.Divisores: Use a cor de Bordas (#E0E7E1) com 1px de espessura.💻 4. Variáveis CSS Sugeridas (index.css)CSS:root {
  /* Cores Principais */
  --color-primary: #2D5A27;
  --color-accent: #D1E8E2;
  --color-bg: #F7F9F7;
  --color-surface: #FFFFFF;
  --color-border: #E0E7E1;
  
  /* Texto */
  --text-dark: #1A2E1A;
  --text-muted: #556B55;

  /* Layout */
  --radius-md: 8px;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
}

body {
  background-color: var(--color-bg);
  color: var(--text-dark);
  font-family: 'Inter', sans-serif;
  margin: 0;
}
🚀 5. Próximos Passos de ImplementaçãoNav: Aplicar o --color-primary nos links e --color-border no border-bottom.Home/Feed: Organizar os projetos em um grid (display: grid) com espaçamento generoso (gap: 30px).Botão de Logout: Pode usar uma variação mais clara de vermelho ou apenas texto para não quebrar a paleta verde.Gostaria que eu criasse o código CSS específico para os cards de projetos usando essa paleta, para deixar o seu Feed com essa cara moderna?
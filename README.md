# 🍔 Estoque Porks

Sistema completo de gestão de inventário para Porks, integrado com Google Sheets.

## 📋 Funcionalidades Completas

### ✅ Gestão de Estoque
- **69 itens pré-cadastrados** organizados em 9 categorias
- Adicionar novos itens
- Deletar itens (com confirmação)
- Atualizar quantidades (+/- ou input direto)
- Alertas de estoque baixo

### ✅ Busca e Filtros Avançados
- Busca por nome do item
- Filtro por categoria (CARNES, PÃES, QUEIJOS, INSUMOS, PORÇÕES, HORTIFRUTI, CONDIMENTOS, OUTROS, EMBALAGENS)
- Filtro por status (Disponível, Estoque Baixo, Sem Estoque)
- Ordenação (Nome, Status, Quantidade, Categoria)
- Minimizar/Mostrar filtros

### ✅ Sincronização com Google Sheets
- **Buscar Dados**: Puxa os dados mais recentes da planilha
- **Sincronizar**: Envia apenas os itens modificados para a planilha
- **Exportar CSV**: Exporta todos os dados em formato CSV
- **Abrir Planilha**: Link direto para a planilha do Google

### ✅ Interface Moderna
- Estatísticas em tempo real (Total, Disponíveis, Baixo, Sem Estoque, Modificados)
- Notificações com SweetAlert2
- Loading states em todos os botões
- Design responsivo
- Ícones FontAwesome

## 🚀 Como Configurar

### 1. Configurar o Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Crie um novo projeto
3. Cole o código do arquivo `inventory-script.js`
4. O ID da planilha já está configurado: `1vq87hX51Jk3VZoZGARLpJ7lPtFzCOEQyI1ptNIfZwG0`
5. Implante como Web App:
   - Clique em **Implantar** > **Nova implantação**
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
   - Clique em **Implantar**
   - **Copie a URL gerada** (algo como: `https://script.google.com/macros/s/...`)

### 2. Executar o Projeto Next.js

```bash
cd inventory-app
npm install
npm run dev
```

### 3. Configurar no Aplicativo

1. Abra http://localhost:3000
2. Clique no botão **⚙️ Configurações**
3. Cole a URL do Google Apps Script no campo "URL da API"
4. Configure o nome da aba (padrão: `Estoque_Hamburgeria`)
5. Clique em **Salvar**

## 📊 Como Usar

### Primeira Vez
1. Configure a URL da API (veja acima)
2. Clique em **☁️ Buscar Dados** para carregar os itens da planilha
3. Se a planilha estiver vazia, os 69 itens pré-cadastrados serão exibidos

### Atualizar Quantidades
- Use os botões **+** e **-** para ajustar
- Ou digite diretamente no campo de quantidade

### Adicionar Novo Item
1. Clique em **➕ Adicionar Item**
2. Preencha: Nome, Categoria, Unidade, Estoque Mínimo
3. Clique em **Adicionar**

### Deletar Item
1. Clique no botão **🗑️** no card do item
2. Confirme a exclusão

### Sincronizar com Google Sheets
1. Faça as alterações nas quantidades
2. Clique em **🔄 Sincronizar**
3. Digite o nome do colaborador
4. Adicione observações (opcional)
5. Clique em **Sincronizar**
6. Apenas os itens modificados serão enviados!

### Buscar Dados Atualizados
- Clique em **☁️ Buscar Dados** para puxar os dados mais recentes da planilha

### Exportar CSV
- Clique em **📥 Exportar CSV** para baixar todos os dados

### Abrir Planilha
- Clique em **🔗 Abrir Planilha** para ver a planilha no Google Sheets

## 📦 Estrutura do Projeto

```
inventory-app/
├── app/
│   ├── components/
│   │   ├── Controls.tsx       # Busca, filtros e botões de ação
│   │   ├── Header.tsx         # Cabeçalho com estatísticas
│   │   ├── LoadingScreen.tsx  # Tela de carregamento
│   │   ├── StockGrid.tsx      # Grid de itens
│   │   └── StockItemCard.tsx  # Card individual de item
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Página principal com lógica
├── inventory-script.js        # Script do Google Apps Script
└── README.md
```

## 📊 Categorias de Estoque

- **CARNES** (4 itens): Blend fraldinha, Blend acém, Hamburguer vegetariano, Frango empanado
- **PÃES** (2 itens): Pão brioche, Pão Australiano
- **QUEIJOS** (4 itens): Queijo prato, Cheddar, Parmesão, Bacon
- **INSUMOS** (18 itens): Sal, Açúcar, Óleos, Molhos, Condimentos
- **PORÇÕES** (4 itens): Batata frita, Onion rings, Dadinho de tapioca, Crispy de gouda
- **HORTIFRUTI** (7 itens): Alface, Alho, Cebola, Tomate, Temperos
- **CONDIMENTOS** (4 itens): Sachês de molhos, Geléia de pimenta
- **OUTROS** (2 itens): Sal grosso, Picles
- **EMBALAGENS** (24 itens): Guardanapos, Copos, Embalagens, Produtos de limpeza

## 🎨 Tecnologias

- Next.js 15
- TypeScript
- Tailwind CSS
- SweetAlert2
- FontAwesome
- Google Apps Script
- Google Sheets

## 📝 Observações

- O projeto `my-app` original foi mantido intacto
- Este é um projeto completamente novo e independente
- Todos os 69 itens da lista foram incluídos
- O estoque mínimo foi configurado conforme a lista fornecida
- A sincronização envia apenas itens modificados (otimizado)
- Os dados são salvos no localStorage para persistência local

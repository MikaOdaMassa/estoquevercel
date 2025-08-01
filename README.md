# Sistema de Controle de Estoque - Cozinha

## Funcionalidades Principais

### Rastreamento de Mudanças Inteligente

O sistema agora implementa um rastreamento inteligente de mudanças que detecta apenas os itens que foram modificados desde a última sincronização com o Google Sheets.

#### Como Funciona:

1. **Dados Originais**: O sistema mantém uma cópia dos dados originais (última sincronização) no localStorage
2. **Detecção de Mudanças**: Quando você modifica a quantidade de um item, o sistema compara com os dados originais
3. **Indicação Visual**: Itens modificados são destacados com:
   - Um anel azul ao redor do card
   - Uma badge "Modificado" no nome do item
   - Um indicador no header mostrando quantos itens foram modificados

#### Exemplo de Uso:

1. **Cenário**: Você tem açúcar com quantidade 5kg
2. **Modificação**: Você altera para 10kg
3. **Resultado**: Apenas o açúcar será enviado para o Google Sheets, não todos os itens
4. **Sincronização**: O sistema envia apenas:
   ```json
   {
     "collaborator": "Seu Nome",
     "notes": "Observações",
     "stockData": {
       "1": {
         "id": "1",
         "name": "Açúcar",
         "category": "INSUMOS",
         "quantity": 10,
         "unit": "kg",
         "minStock": 2
       }
     }
   }
   ```

### Funcionalidades Adicionais

#### Modal de Sincronização Melhorado
- Mostra quantos itens foram modificados
- Lista os primeiros 5 itens que serão enviados
- Indica se há mais itens além dos mostrados

#### Indicador no Header
- Mostra quantos itens foram modificados
- Aparece apenas quando há modificações
- Animação pulsante para chamar atenção

#### Configurações Avançadas
- **Reset de Dados Originais**: Permite marcar todos os itens como sincronizados
- **Nome Padrão do Colaborador**: Salva o nome para uso futuro
- **Sincronização Automática**: Opção para sincronizar automaticamente

### Estrutura dos Dados

#### Dados Originais (originalData)
```typescript
{
  "Açúcar": {
    category: "INSUMOS",
    quantity: 5,
    unit: "kg",
    minStock: 2
  }
}
```

#### Dados Atuais (stockData)
```typescript
{
  "Açúcar": {
    category: "INSUMOS",
    quantity: 10, // Modificado
    unit: "kg",
    minStock: 2
  }
}
```

#### Itens Modificados Detectados
```typescript
{
  "1": {
    id: "1",
    name: "Açúcar",
    category: "INSUMOS",
    quantity: 10,
    unit: "kg",
    minStock: 2
  }
}
```

### APIs do Google Apps Script

O sistema envia dados no formato esperado pelo script do Google Apps Script:

#### POST Request
```javascript
{
  "collaborator": "Nome do Colaborador",
  "notes": "Observações sobre a contagem",
  "stockData": {
    "1": {
      "id": "1",
      "name": "Nome do Item",
      "category": "Categoria",
      "quantity": 10,
      "unit": "kg",
      "minStock": 2
    }
  }
}
```

#### GET Request
Retorna todos os dados da planilha para sincronização inicial.

### Benefícios

1. **Eficiência**: Envia apenas dados modificados
2. **Performance**: Reduz o tráfego de rede
3. **Transparência**: Mostra claramente o que será enviado
4. **Controle**: Permite resetar dados originais quando necessário
5. **Feedback Visual**: Indica claramente quais itens foram modificados

### Como Usar

1. **Modificar Itens**: Use os botões +/- ou digite diretamente no campo quantidade
2. **Ver Modificações**: Itens modificados são destacados visualmente
3. **Sincronizar**: Clique no botão de sincronização para enviar apenas os itens modificados
4. **Reset**: Use o botão "Resetar" nas configurações para marcar todos como sincronizados

### Armazenamento Local

O sistema salva automaticamente:
- `kitchenStockData`: Dados atuais do estoque
- `originalStockData`: Dados originais (última sincronização)
- `collaboratorName`: Nome do colaborador
- `appsScriptConfig`: Configurações do sistema

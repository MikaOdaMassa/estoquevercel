"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import Controls from './components/Controls';
import StockGrid from './components/StockGrid';

// Dados iniciais do estoque
const initialStockData = {
  'Costelinha suína': { category: 'CARNES', quantity: 0, unit: 'kg', minStock: 2 },
  'Fraldinha Hambúrguer': { category: 'CARNES', quantity: 0, unit: 'kg', minStock: 3 },
  'Panceta - fatiada': { category: 'CARNES', quantity: 0, unit: 'kg', minStock: 1 },
  // ... (adicione todos os outros itens do app.js aqui)
};

function getItemStatus(item: any) {
  if (item.quantity === 0) return 'out';
  if (item.quantity <= item.minStock) return 'low';
  return 'available';
}

// Função para exportar dados em CSV com dados mais recentes
async function exportData(stockData: {[key: string]: any}) {
  try {
    // Importar SweetAlert2
    const Swal = (await import('sweetalert2')).default;
    
    // URL do Apps Script
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbw6NeBHL3R_NRNh2i6uUHIaYhnTBr5MSJK1AH27HNKo3jpy8N1FkiTKMdvcre-bD38/exec';
    
    // Buscar dados mais recentes do Google Sheets
    const res = await fetch(appsScriptUrl);
    const json = await res.json();
    
    let exportData = stockData; // Usar dados locais como fallback
    let csvData = [];
    
    if (json.result === 'success' && Array.isArray(json.data)) {
      // Usar dados do Google Sheets que já incluem ID, Data/Hora, Colaborador
      csvData = json.data.map((item: any) => {
        const status = getItemStatus({
          quantity: parseFloat(item.Quantidade) || 0,
          minStock: parseFloat(item["Estoque Mínimo"]) || 0
        });
        const statusText = status === 'available' ? 'Disponível' : status === 'low' ? 'Estoque Baixo' : 'Sem Estoque';
        
        // Formatar data para formato brasileiro
        let formattedDate = item['Data/Hora'] || new Date().toLocaleString('pt-BR');
        if (item['Data/Hora']) {
          try {
            const date = new Date(item['Data/Hora']);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            }
          } catch (e) {
            // Se falhar, mantém o valor original
          }
        }
        
        return {
          ID: item.ID || '',
          'Data/Hora': formattedDate,
          Colaborador: item.Colaborador || 'Sistema',
          Item: item.Item || '',
          Categoria: item.Categoria || '',
          Quantidade: item.Quantidade || '0',
          Unidade: item.Unidade || '',
          'Estoque Mínimo': item['Estoque Mínimo'] || '0',
          Status: statusText,
          Observações: item.Observações || ''
        };
      });
    } else {
      // Converter dados locais para incluir campos necessários
      const now = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const collaborator = typeof window !== 'undefined' ? localStorage.getItem('collaboratorName') || 'Sistema' : 'Sistema';
      
      csvData = Object.keys(exportData).map((item, index) => {
        const data = exportData[item];
        const status = getItemStatus(data);
        const statusText = status === 'available' ? 'Disponível' : status === 'low' ? 'Estoque Baixo' : 'Sem Estoque';
        
        return {
          ID: `ITEM_${index + 1}`,
          'Data/Hora': now,
          Colaborador: collaborator,
          Item: item,
          Categoria: data.category || '',
          Quantidade: data.quantity || '0',
          Unidade: data.unit || '',
          'Estoque Mínimo': data.minStock || '0',
          Status: statusText,
          Observações: ''
        };
      });
    }
    
    // Criar CSV com todos os campos
    const headers = ['ID', 'Data/Hora', 'Colaborador', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Estoque Mínimo', 'Status', 'Observações'];
    const csvContent = "data:text/csv;charset=utf-8," +
      headers.join(',') + "\n" +
      csvData.map((row: any) => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estoque_cozinha_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar sucesso com SweetAlert2
    await Swal.fire({
      icon: 'success',
      title: 'Exportação Concluída!',
      text: `Arquivo CSV exportado com ${csvData.length} itens!`,
      confirmButtonText: 'OK',
      confirmButtonColor: '#10b981'
    });
  } catch (error) {
    console.error('Erro ao exportar:', error);
    
    // Mostrar erro com SweetAlert2
    const Swal = (await import('sweetalert2')).default;
    await Swal.fire({
      icon: 'error',
      title: 'Erro na Exportação',
      text: 'Erro ao exportar dados. Verifique a conexão com o Google Sheets.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ef4444'
    });
  }
}

// Função melhorada para obter apenas itens alterados
function getChangedItems(stockData: {[key: string]: any}, originalData: any) {
  const changedItems: any = {};
  let itemId = 1;
  
  for (const [itemName, itemData] of Object.entries(stockData)) {
    // Verifica se o item existe nos dados originais
    const originalItem = originalData?.[itemName];
    
    // Se não existe nos originais ou se os dados são diferentes
    if (!originalItem || 
        originalItem.quantity !== itemData.quantity ||
        originalItem.category !== itemData.category ||
        originalItem.unit !== itemData.unit ||
        originalItem.minStock !== itemData.minStock) {
      
      changedItems[itemId.toString()] = {
        id: itemId.toString(),
        name: itemName,
        category: itemData.category,
        quantity: itemData.quantity,
        unit: itemData.unit,
        minStock: itemData.minStock
      };
      itemId++;
    }
  }
  
  return changedItems;
}

export default function Home() {
  // Estado para controlar hidratação
  const [isHydrated, setIsHydrated] = useState(false);

  // Estado do estoque
  const [stockData, setStockData] = useState<{[key: string]: any}>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kitchenStockData');
      if (saved) return JSON.parse(saved);
    }
    return initialStockData;
  });

  // Estado para armazenar os dados originais (última sincronização)
  const [originalData, setOriginalData] = useState<{[key: string]: any}>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('originalStockData');
      if (saved) return JSON.parse(saved);
    }
    return initialStockData; // Usar initialStockData em vez de null
  });

  // Estado de loading
  const [loading, setLoading] = useState(true);

  // Estados de loading
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Filtros
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentSort, setCurrentSort] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'CARNES', unit: '', minStock: 0 });
  const [addError, setAddError] = useState('');

  // Estado para controle do modal de confirmação de exclusão
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null);

  // Estado para controlar o modal de sincronização
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [syncNotes, setSyncNotes] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');
  const [syncFail, setSyncFail] = useState('');
  const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbw6NeBHL3R_NRNh2i6uUHIaYhnTBr5MSJK1AH27HNKo3jpy8N1FkiTKMdvcre-bD38/exec'; // ajuste se necessário

  // Estado para controlar o modal de configuração
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [collaboratorDefault, setCollaboratorDefault] = useState('');
  const [sheetName, setSheetName] = useState('Contagem_de_Estoque');
  const [autoSync, setAutoSync] = useState(true);
  const [configError, setConfigError] = useState('');

  // Carregar configurações do localStorage ao iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('appsScriptConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.sheetName) setSheetName(parsed.sheetName);
        if (parsed.autoSync !== undefined) setAutoSync(parsed.autoSync);
      } catch {}
    }
    const savedCollaborator = localStorage.getItem('collaboratorName');
    if (savedCollaborator) setCollaboratorDefault(savedCollaborator);
  }, []);

  // Marcar hidratação como completa
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Salvar nome do colaborador ao definir
  useEffect(() => {
    if (collaboratorDefault) localStorage.setItem('collaboratorName', collaboratorDefault);
  }, [collaboratorDefault]);

  // Salvar configurações ao salvar no modal
  const handleSaveConfig = () => {
    if (!sheetName.trim()) {
      setConfigError('Nome da aba é obrigatório.');
      return;
    }
    localStorage.setItem('appsScriptConfig', JSON.stringify({ sheetName, autoSync }));
    localStorage.setItem('collaboratorDefault', collaboratorDefault);
    setShowConfigModal(false);
  };

  // Salvar no localStorage sempre que stockData mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kitchenStockData', JSON.stringify(stockData));
    }
  }, [stockData]);

  // Exibir modal de colaborador ao carregar se não houver nome salvo
  useEffect(() => {
    if (!collaboratorDefault) {
      // Não mostrar modal automático, deixar o usuário configurar quando quiser
    }
  }, [collaboratorDefault]);

  // Carregar estoque da API ao iniciar e sempre buscar dados mais recentes
  useEffect(() => {
    async function fetchStock() {
      try {
        console.log('Buscando dados mais recentes do Google Sheets...');
        const res = await fetch(appsScriptUrl);
        const json = await res.json();
        
        if (json.result === 'success' && Array.isArray(json.data)) {
          console.log('Dados recebidos do Google Sheets:', json.data.length, 'itens');
          
          // Converter para o formato do app
          const apiData: {[key: string]: any} = {};
          json.data.forEach((item: any) => {
            apiData[item.Item] = {
              category: item.Categoria,
              quantity: parseFloat(item.Quantidade) || 0,
              unit: item.Unidade,
              minStock: parseFloat(item["Estoque Mínimo"]) || 0
            };
          });
          
          console.log('Dados convertidos:', Object.keys(apiData).length, 'itens');
          setStockData(apiData);
          
          // Salvar como dados originais
          setOriginalData(apiData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('kitchenStockData', JSON.stringify(apiData));
            localStorage.setItem('originalStockData', JSON.stringify(apiData));
          }
          
          console.log('Estoque atualizado com dados do Google Sheets');
        } else {
          console.log('Resposta inválida do Google Sheets:', json);
          // Se der erro, mantém o localStorage
          const saved = localStorage.getItem('kitchenStockData');
          if (saved) {
            setStockData(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.error('Erro ao buscar dados do Google Sheets:', e);
        // Se der erro, mantém o localStorage
        const saved = localStorage.getItem('kitchenStockData');
        if (saved) {
          setStockData(JSON.parse(saved));
        }
      }
      setLoading(false);
    }
    
    // Sempre buscar dados mais recentes ao carregar a página
    fetchStock();
  }, [appsScriptUrl]);

  // Filtragem e ordenação otimizada
  const filteredItems = useMemo(() => {
    let items = Object.keys(stockData);
    
    if (currentCategory !== 'all') {
      items = items.filter(item => stockData[item].category === currentCategory);
    }
    if (searchTerm) {
      items = items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter) {
      items = items.filter(item => getItemStatus(stockData[item]) === statusFilter);
    }
    
    return items.sort((a, b) => {
      switch (currentSort) {
        case 'name':
          return a.localeCompare(b);
        case 'status':
          const statusA = getItemStatus(stockData[a]);
          const statusB = getItemStatus(stockData[b]);
          const statusOrder = { 'available': 1, 'low': 2, 'out': 3 };
          return statusOrder[statusA] - statusOrder[statusB];
        case 'quantity':
          return stockData[b].quantity - stockData[a].quantity;
        case 'category':
          return stockData[a].category.localeCompare(stockData[b].category);
        default:
          return a.localeCompare(b);
      }
    });
  }, [stockData, currentCategory, searchTerm, statusFilter, currentSort]);

  // Funções de manipulação otimizadas
  const updateQuantity = useCallback((itemName: string, change: number) => {
    setStockData(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        quantity: Math.max(0, prev[itemName].quantity + change)
      }
    }));
  }, []);

  // Função para adicionar item
  const handleAddItem = useCallback(async () => {
    const Swal = (await import('sweetalert2')).default;
    if (!newItem.name.trim()) {
      setAddError('Nome do item é obrigatório');
      return;
    }
    if (!newItem.unit.trim()) {
      setAddError('Unidade é obrigatória');
      return;
    }
    if (stockData[newItem.name]) {
      setAddError('Item já existe no estoque');
      return;
    }
    
    setAddLoading(true);
    // Montar payload para o Apps Script
    const collaborator = typeof window !== 'undefined' ? (localStorage.getItem('collaboratorName') || 'Usuário') : 'Usuário';
    const syncData = {
      collaborator,
      notes: 'Adição manual',
      stockData: {
        '1': {
          name: newItem.name,
          category: newItem.category,
          quantity: 0,
          unit: newItem.unit,
          minStock: newItem.minStock
        }
      }
    };
    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify(syncData)
      });
      const json = await res.json();
      if (json.result === 'success') {
        setStockData(prev => ({
          ...prev,
          [newItem.name]: {
            category: newItem.category,
            quantity: 0,
            unit: newItem.unit,
            minStock: newItem.minStock
          }
        }));
        setShowAddModal(false);
        setNewItem({ name: '', category: 'CARNES', unit: '', minStock: 0 });
        setAddError('');
        await Swal.fire({
          icon: 'success',
          title: 'Item adicionado!',
          text: json.message || 'Produto criado com sucesso na planilha.',
          confirmButtonColor: '#10b981'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao adicionar',
          text: json.message || 'Não foi possível criar o produto.',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro de rede',
        text: error.message || 'Erro ao comunicar com o Google Sheets.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setAddLoading(false);
    }
  }, [newItem, stockData, setShowAddModal, setNewItem, setAddError, appsScriptUrl]);

  // Função para deletar item
  const handleDeleteItem = useCallback(async (itemName: string) => {
    const Swal = (await import('sweetalert2')).default;
    const result = await Swal.fire({
      title: `Excluir "${itemName}"?`,
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });
    if (!result.isConfirmed) return;

    setDeleteLoading(true);
    try {
      console.log('=== INICIANDO DELETE FRONTEND ===');
      console.log('Item a deletar:', itemName);
      
      // SEMPRE buscar o ID do item na planilha
      console.log('Buscando ID do item...');
      const res = await fetch(appsScriptUrl);
      const json = await res.json();
      
      let itemId = null;
      if (json.result === 'success' && Array.isArray(json.data)) {
        console.log('Total de itens na planilha:', json.data.length);
        
        const item = json.data.find((row: any) => row.Item === itemName);
        
        if (item && item.ID) {
          itemId = item.ID;
          console.log('✅ ID encontrado:', itemId);
        } else {
          console.log('❌ Item não encontrado na planilha');
          await Swal.fire({
            icon: 'error',
            title: 'Item não encontrado',
            text: `O item "${itemName}" não foi encontrado na planilha.`,
            confirmButtonColor: '#ef4444'
          });
          return;
        }
      } else {
        console.log('❌ Erro ao buscar dados da planilha');
        await Swal.fire({
          icon: 'error',
          title: 'Erro de conexão',
          text: 'Não foi possível buscar dados da planilha.',
          confirmButtonColor: '#ef4444'
        });
        return;
      }
      
      // SEMPRE enviar apenas o ID
      const deleteData = { action: 'delete', itemId };
      console.log('Payload (apenas ID):', deleteData);
      
      const deleteRes = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify(deleteData)
      });
      
      console.log('Status da resposta:', deleteRes.status);
      const deleteJson: any = await deleteRes.json();
      console.log('Resposta do servidor:', deleteJson);
      
      if (deleteJson.result === 'success') {
        console.log('✅ Delete bem-sucedido, removendo do estado local');
        console.log('Estado antes:', Object.keys(stockData).length, 'itens');
        
        setStockData(prev => {
          const newData = { ...prev };
          delete newData[itemName];
          console.log('Estado depois:', Object.keys(newData).length, 'itens');
          console.log('Item removido:', itemName);
          return newData;
        });
        
        if (originalData && originalData[itemName]) {
          setOriginalData(prev => {
            if (prev) {
              const newOriginal = { ...prev };
              delete newOriginal[itemName];
              console.log('OriginalData atualizado também');
              return newOriginal;
            }
            return prev;
          });
        }
        
        setDeleteItemName(null);
        console.log('Modal de delete fechado');
        
        await Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: deleteJson.message || 'Item excluído com sucesso.',
          confirmButtonColor: '#10b981'
        });
        
        console.log('SweetAlert mostrado');
        
        // Forçar atualização da interface
        console.log('Forçando atualização da interface...');
        setTimeout(() => {
          console.log('Estado final após timeout:', Object.keys(stockData).length, 'itens');
        }, 100);
        
      } else {
        console.log('❌ Erro no delete:', deleteJson.message);
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao excluir',
          text: deleteJson.message || 'Não foi possível excluir o item.',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erro de rede',
        text: error.message || 'Erro ao comunicar com o Google Sheets.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [appsScriptUrl, originalData, setDeleteItemName]);

  // Função para resetar dados originais (útil para testes)
  const resetOriginalData = useCallback(() => {
    setOriginalData(JSON.parse(JSON.stringify(stockData)));
    if (typeof window !== 'undefined') {
      localStorage.setItem('originalStockData', JSON.stringify(stockData));
    }
  }, [stockData]);

  // Função para buscar dados atualizados do Google Sheets
  const handleFetchLatestData = useCallback(async () => {
    setFetchLoading(true);
    try {
      console.log('Buscando dados mais recentes do Google Sheets...');
      const res = await fetch(appsScriptUrl);
      const json = await res.json();
      
      if (json.result === 'success' && Array.isArray(json.data)) {
        console.log('Dados recebidos do Google Sheets:', json.data.length, 'itens');
        
        // Converter para o formato do app
        const apiData: {[key: string]: any} = {};
        json.data.forEach((item: any) => {
          apiData[item.Item] = {
            category: item.Categoria,
            quantity: parseFloat(item.Quantidade) || 0,
            unit: item.Unidade,
            minStock: parseFloat(item["Estoque Mínimo"]) || 0
          };
        });
        
        setStockData(apiData);
        setOriginalData(apiData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kitchenStockData', JSON.stringify(apiData));
          localStorage.setItem('originalStockData', JSON.stringify(apiData));
        }
        
        // Mostrar sucesso com SweetAlert2
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'success',
          title: 'Dados Atualizados!',
          text: `${Object.keys(apiData).length} itens carregados do Google Sheets.`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
      } else {
        // Mostrar erro com SweetAlert2
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao Buscar Dados',
          text: 'Resposta inválida do Google Sheets',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      // Mostrar erro com SweetAlert2
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Erro ao Buscar Dados',
        text: error.message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setFetchLoading(false);
    }
  }, [appsScriptUrl]);

  // Função para enviar sincronização
  const handleSync = useCallback(async () => {
    if (!collaboratorInput.trim()) {
      setSyncError('Por favor, digite o nome do colaborador.');
      return;
    }
    setSyncLoading(true);
    setSyncError('');
    setSyncSuccess('');
    setSyncFail('');
    const changedItems = getChangedItems(stockData, originalData);
    if (Object.keys(changedItems).length === 0) {
      setSyncError('Nenhum item alterado desde a última sincronização.');
      setSyncLoading(false);
      return;
    }
    const syncData = {
      collaborator: collaboratorInput,
      notes: syncNotes || 'Contagem mensal',
      stockData: changedItems
    };
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify(syncData)
      });
      if (response.status === 200) {
        setSyncSuccess('Dados sincronizados com sucesso!');
        // Atualiza os dados originais após sincronização bem-sucedida
        const newOriginalData = JSON.parse(JSON.stringify(stockData));
        setOriginalData(newOriginalData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('originalStockData', JSON.stringify(newOriginalData));
        }
        setShowSyncModal(false);
        
        // Mostrar mensagem de sucesso com SweetAlert2
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'success',
          title: 'Sincronização Concluída!',
          text: `Dados sincronizados com sucesso! ${Object.keys(changedItems).length} item(s) atualizado(s).`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
      } else {
        setSyncFail('Erro ao sincronizar: ' + response.statusText);
        
        // Mostrar mensagem de erro com SweetAlert2
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'error',
          title: 'Erro na Sincronização',
          text: `Erro ao sincronizar: ${response.statusText}`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error: any) {
      setSyncFail('Erro de rede: ' + error.message);
      
      // Mostrar mensagem de erro de rede com SweetAlert2
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        icon: 'error',
        title: 'Erro de Rede',
        text: `Erro de rede: ${error.message}`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSyncLoading(false);
    }
  }, [collaboratorInput, stockData, originalData, syncNotes, appsScriptUrl]);

  // Estatísticas otimizadas
  const stats = useMemo(() => {
    const items = Object.values(stockData);
    const changedItems = getChangedItems(stockData, originalData);
    return {
      totalItems: Object.keys(stockData).length,
      availableItems: items.filter(item => getItemStatus(item) === 'available').length,
      lowStockItems: items.filter(item => getItemStatus(item) === 'low').length,
      outOfStockItems: items.filter(item => getItemStatus(item) === 'out').length,
      modifiedItems: Object.keys(changedItems).length
    };
  }, [stockData, originalData]);

  return (
    <main className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 min-h-screen text-gray-800 font-sans">
      <LoadingScreen loading={loading} />

      {!isHydrated ? (
        // Renderizar uma versão simplificada durante a hidratação
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-10 mb-10 shadow-2xl text-center border border-purple-200">
            <div className="flex items-center justify-center mb-6">
              <i className="fas fa-warehouse text-5xl text-white mr-4 drop-shadow-md"></i>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">Controle de Estoque - Cozinha</h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg border border-blue-200">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-boxes text-3xl mr-3"></i>
                  <div className="text-4xl font-bold">0</div>
                </div>
                <div className="text-sm font-medium">Total de Itens</div>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-check-circle text-3xl mr-3"></i>
                  <div className="text-4xl font-bold">0</div>
                </div>
                <div className="text-sm font-medium">Disponíveis</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg border border-amber-200">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-exclamation-triangle text-3xl mr-3"></i>
                  <div className="text-4xl font-bold">0</div>
                </div>
                <div className="text-sm font-medium">Estoque Baixo</div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg border border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-times-circle text-3xl mr-3"></i>
                  <div className="text-4xl font-bold">0</div>
                </div>
                <div className="text-sm font-medium">Sem Estoque</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <Header 
            totalItems={stats.totalItems}
            availableItems={stats.availableItems}
            lowStockItems={stats.lowStockItems}
            outOfStockItems={stats.outOfStockItems}
            modifiedItems={stats.modifiedItems}
          />

          <Controls 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            currentSort={currentSort}
            setCurrentSort={setCurrentSort}
            setShowAddModal={setShowAddModal}
            exportData={async () => await exportData(stockData)}
            openSyncModal={() => setShowSyncModal(true)}
            setShowConfigModal={setShowConfigModal}
            fetchLatestData={handleFetchLatestData}
            fetchLoading={fetchLoading}
          />

          <StockGrid 
            filteredItems={filteredItems}
            stockData={stockData}
            originalData={originalData}
            updateQuantity={updateQuantity}
            setDeleteItemName={setDeleteItemName}
          />

        {/* Modal de adicionar item */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up relative border-2 border-purple-200">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-plus mr-2 text-emerald-600"></i>Adicionar Novo Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item:</label>
                  <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Ex: Tomate" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria:</label>
                  <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    {['CARNES','PÃES','QUEIJOS','INSUMOS','PORÇÕES','HORTIFRUTI','CONDIMENTOS','SOBREMESAS','OUTROS'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade:</label>
                  <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="">Selecione uma unidade</option>
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="l">Litros (l)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="un">Unidades (un)</option>
                    <option value="pç">Peças (pç)</option>
                    <option value="cx">Caixas (cx)</option>
                    <option value="pct">Pacotes (pct)</option>
                    <option value="lata">Latas</option>
                    <option value="garrafa">Garrafas</option>
                    <option value="bandeja">Bandejas</option>
                    <option value="sachê">Sachês</option>
                    <option value="dúzia">Dúzias</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo:</label>
                  <input type="number" min={0} step={0.1} value={newItem.minStock} onChange={e => setNewItem({ ...newItem, minStock: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="0" />
                </div>
                {addError && <div className="text-red-600 text-sm font-semibold mt-2">{addError}</div>}
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleAddItem} 
                  disabled={addLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Adicionando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>Adicionar
                    </>
                  )}
                </button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-600 flex items-center justify-center">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {deleteItemName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up relative border-2 border-red-200">
              <button onClick={() => setDeleteItemName(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-trash mr-2 text-red-600"></i>Deletar Item</h3>
              <p className="mb-6">Tem certeza que deseja deletar <span className="font-semibold">"{deleteItemName}"</span> do estoque?</p>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => handleDeleteItem(deleteItemName)} 
                  disabled={deleteLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Deletando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>Deletar
                    </>
                  )}
                </button>
                <button onClick={() => setDeleteItemName(null)} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-600 flex items-center justify-center">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Sincronização */}
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up relative border-2 border-purple-200">
              <button onClick={() => setShowSyncModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-sync-alt mr-2 text-purple-600"></i>Sincronizar Histórico</h3>
              
              {/* Mostrar itens modificados */}
              {(() => {
                const changedItems = getChangedItems(stockData, originalData);
                const changedCount = Object.keys(changedItems).length;
                return (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 flex items-center">
                        <i className="fas fa-info-circle mr-2 text-blue-600"></i>
                        Itens Modificados:
                      </span>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {changedCount}
                      </span>
                    </div>
                    {changedCount > 0 && (
                      <div className="text-sm text-gray-600">
                        <p>Os seguintes itens serão enviados para o Google Sheets:</p>
                        <ul className="mt-2 space-y-1">
                          {Object.values(changedItems).slice(0, 5).map((item: any) => (
                            <li key={item.id} className="flex items-center">
                              <i className="fas fa-arrow-right mr-2 text-blue-500"></i>
                              {item.name} - {item.quantity} {item.unit}
                            </li>
                          ))}
                          {changedCount > 5 && (
                            <li className="text-blue-600 font-semibold">
                              ... e mais {changedCount - 5} item(s)
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              <div className="mb-6">
                <label className="block mb-3 font-semibold text-gray-700 flex items-center">
                  <i className="fas fa-user mr-2 text-purple-600"></i>
                  Nome do Colaborador:
                </label>
                <input type="text" value={collaboratorInput} onChange={e => setCollaboratorInput(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200" />
              </div>
              <div className="mb-6">
                <label className="block mb-3 font-semibold text-gray-700 flex items-center">
                  <i className="fas fa-sticky-note mr-2 text-purple-600"></i>
                  Observações:
                </label>
                <textarea value={syncNotes} onChange={e => setSyncNotes(e.target.value)} placeholder="Observações sobre a contagem..." rows={3} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"></textarea>
              </div>
              {syncError && <div className="text-red-600 text-sm font-semibold mb-4">{syncError}</div>}
              {syncLoading && <div className="text-purple-600 text-sm font-semibold mb-4">Sincronizando...</div>}
              {syncSuccess && <div className="text-emerald-600 text-sm font-semibold mb-4">{syncSuccess}</div>}
              {syncFail && <div className="text-red-600 text-sm font-semibold mb-4">{syncFail}</div>}
              <div className="flex gap-3">
                <button 
                  onClick={handleSync} 
                  disabled={syncLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt mr-2"></i>
                      Sincronizar
                    </>
                  )}
                </button>
                <button onClick={() => setShowSyncModal(false)} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-600 flex items-center justify-center">
                  <i className="fas fa-times mr-2"></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuração */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-slide-up relative border-2 border-blue-200">
              <button onClick={() => setShowConfigModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i className="fas fa-cog mr-2 text-blue-600"></i>Configurações</h3>
              <div className="space-y-6">
               
                <div>
                  <label className="block mb-3 font-semibold text-gray-700 flex items-center">
                    <i className="fas fa-layer-group mr-2 text-blue-600"></i>
                    Nome da Aba:
                  </label>
                  <input type="text" value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Contagem_de_Estoque" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                  <p className="text-sm text-gray-600 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Nome da aba na planilha (padrão: Contagem_de_Estoque)
                  </p>
                </div>
                <div>
                  <label className="block mb-3 font-semibold text-gray-700 flex items-center">
                    <i className="fas fa-sync mr-2 text-blue-600"></i>
                    Sincronização Automática:
                  </label>
                  <div className="mt-3">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} className="mr-3 w-5 h-5 text-blue-600 focus:ring-blue-500" />
                      <span>Sincronizar automaticamente ao abrir a página</span>
                    </label>
                  </div>
                </div>
               
              </div>
              {configError && <div className="text-red-600 text-sm font-semibold mb-4">{configError}</div>}
              <div className="flex gap-3 mt-8">
                <button onClick={handleSaveConfig} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center">
                  <i className="fas fa-save mr-2"></i>
                  Salvar
                </button>
                <button onClick={() => setShowConfigModal(false)} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-600 flex items-center justify-center">
                  <i className="fas fa-times mr-2"></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
    </main>
  );
}
                      

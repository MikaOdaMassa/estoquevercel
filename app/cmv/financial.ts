export interface TurnoProduto {
  produtoNome: string;
  categoria?: string;
  unidade?: string;
  estoqueInicial: number;
  entradas: number;
  estoqueFinal: number;
  custoAplicado: number;
  consumo: number;
  custo: number;
}

export interface Turno {
  ID: string;
  Data: string;
  Local: string;
  Responsavel: string;
  Periodo: string;
  Status: string;
  ValorVendido: number;
  PercentualMeta: number;
  IfoodNet?: number;
  NinetynineNet?: number;
  CounterNet?: number;
  MachineFees?: number;
  Discounts?: number;
  RealFinalSales?: number;
  Produtos: TurnoProduto[];
  OriginalIds?: string[];
  FechamentoID?: string;
  Locais?: string[];
  TurnosOriginais?: Turno[];
  IsConsolidated?: boolean;
}

export function getTurnoCusto(turno: Turno) {
  return turno.Produtos?.reduce((sum, product) => sum + (Number(product.custo) || 0), 0) || 0;
}

export function getFinancialGroupKey(turno: Pick<Turno, 'Data' | 'Periodo'>) {
  return `${turno.Data}__${turno.Periodo}`;
}

export function getLocationLabel(location: string) {
  if (location === 'BAR') return 'Bar';
  if (location === 'COZINHA') return 'Cozinha';
  return 'Consolidado';
}

export function sortTurnosByLocation(turnos: Turno[]) {
  return [...turnos].sort((a, b) => {
    if (a.Local === b.Local) return a.ID.localeCompare(b.ID);
    if (a.Local === 'COZINHA') return -1;
    if (b.Local === 'COZINHA') return 1;
    return a.Local.localeCompare(b.Local);
  });
}

function sumField(turnos: Turno[], field: keyof Pick<Turno, 'ValorVendido' | 'IfoodNet' | 'NinetynineNet' | 'CounterNet' | 'MachineFees' | 'Discounts' | 'RealFinalSales'>) {
  return turnos.reduce((sum, turno) => sum + (Number(turno[field]) || 0), 0);
}

function getFinancialOwner(turnos: Turno[], fallback: Turno) {
  return turnos.find(turno => (Number(turno.RealFinalSales) || 0) > 0)
    || turnos.find(turno => turno.Status === 'CONCLUIDO')
    || fallback;
}

export function findTurnosDoMesmoFechamento(turnos: Turno[], turno: Turno) {
  return sortTurnosByLocation(
    turnos.filter(item => item.Data === turno.Data && item.Periodo === turno.Periodo)
  );
}

export function groupTurnosConsolidados(turnos: Turno[]) {
  const groups = new Map<string, Turno[]>();

  turnos.forEach(turno => {
    const key = getFinancialGroupKey(turno);
    groups.set(key, [...(groups.get(key) || []), turno]);
  });

  return Array.from(groups.values()).map(group => {
    const ordered = sortTurnosByLocation(group);
    const primary = ordered[0];
    const owner = getFinancialOwner(ordered, primary);
    const originalIds = ordered.map(turno => turno.ID);
    const locais = Array.from(new Set(ordered.map(turno => turno.Local)));
    const responsaveis = Array.from(new Set(ordered.map(turno => turno.Responsavel).filter(Boolean)));
    const isConsolidated = ordered.length > 1;

    return {
      ...primary,
      ID: originalIds.join('__'),
      OriginalIds: originalIds,
      FechamentoID: ordered.find(turno => turno.Status === 'AGUARDANDO_FATURAMENTO')?.ID || owner.ID || primary.ID,
      Local: isConsolidated ? 'CONSOLIDADO' : primary.Local,
      Locais: locais,
      Responsavel: responsaveis.join(' / ') || primary.Responsavel,
      Status: ordered.some(turno => turno.Status === 'AGUARDANDO_FATURAMENTO') ? 'AGUARDANDO_FATURAMENTO' : 'CONCLUIDO',
      ValorVendido: sumField(ordered, 'ValorVendido'),
      PercentualMeta: owner.PercentualMeta || primary.PercentualMeta,
      IfoodNet: sumField(ordered, 'IfoodNet'),
      NinetynineNet: sumField(ordered, 'NinetynineNet'),
      CounterNet: sumField(ordered, 'CounterNet'),
      MachineFees: sumField(ordered, 'MachineFees'),
      Discounts: sumField(ordered, 'Discounts'),
      RealFinalSales: sumField(ordered, 'RealFinalSales'),
      Produtos: ordered.flatMap(turno => turno.Produtos || []),
      TurnosOriginais: ordered,
      IsConsolidated: isConsolidated,
    } satisfies Turno;
  });
}

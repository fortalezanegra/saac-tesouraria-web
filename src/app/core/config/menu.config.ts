export interface MenuItem {
  label: string;
  icon: string;
  rota?: string;
  permissao?: string;
  filhos?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Tesouraria',
    icon: 'account_balance',
    filhos: [
      {
        label: 'Cadastrar Movimento',
        icon: 'add_circle',
        rota: '/tesouraria/movimento-financeiro/cadastro',
        permissao: 'TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE'
      },
      {
        label: 'Consultar Movimentos',
        icon: 'search',
        rota: '/tesouraria/movimento-financeiro/consulta',
        permissao: 'TESOURARIA_MOVIMENTO_FINANCEIRO_READ'
      },
      {
        label: 'Relatório',
        icon: 'bar_chart',
        rota: '/tesouraria/movimento-financeiro/relatorio',
        permissao: 'TESOURARIA_MOVIMENTO_FINANCEIRO_READ'
      }
    ]
  }
];

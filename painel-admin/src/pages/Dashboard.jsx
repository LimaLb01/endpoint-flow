import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Tooltip from '../components/Tooltip';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#f9f506', '#8c8b5f', '#181811', '#a3a272', '#6b6a5a'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClientes: 0,
    assinaturasAtivas: 0,
    assinaturasVencidas: 0,
    receitaMes: 0,
    receitaMesAnterior: 0,
    crescimentoReceita: 0,
    receitaHistorica: [],
    top5Clientes: [],
    receitaPorPlano: [],
    assinaturasVencendo: 0,
    flowStats: {
      total: 0,
      completos: 0,
      abandonados: 0,
      emAndamento: 0,
      taxaConversao: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Iniciando carregamento de estatísticas...');
      const estatisticas = await api.obterEstatisticas();
      
      console.log('✅ Estatísticas recebidas:', estatisticas);
      
      if (estatisticas && estatisticas.stats) {
        console.log('📊 Stats:', estatisticas.stats);
        setStats(estatisticas.stats);
      } else if (estatisticas === null) {
        console.error('❌ Estatísticas retornaram null');
        setError('Erro ao conectar com o servidor. Verifique sua conexão.');
      } else {
        console.error('❌ Formato de dados inválido:', estatisticas);
        setError('Dados inválidos recebidos do servidor.');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      setError(error.message || 'Erro ao carregar estatísticas. Tente novamente.');
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento finalizado');
    }
  };

  const formatarCrescimento = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '0%';
    if (valor === 0) return '0%';
    const sinal = valor > 0 ? '+' : '';
    return `${sinal}${Number(valor).toFixed(1)}%`;
  };

  const getCrescimentoColor = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return 'text-[#8c8b5f] dark:text-[#a3a272]';
    if (valor > 0) return 'text-green-600 dark:text-green-400';
    if (valor < 0) return 'text-red-600 dark:text-red-400';
    return 'text-[#8c8b5f] dark:text-[#a3a272]';
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
        {/* Ações Rápidas */}
        <div className="flex gap-2 justify-end mb-4">
          <Tooltip text="Criar novo cliente (ou pressione Ctrl+K para buscar)">
            <button
              onClick={() => navigate('/clientes/buscar')}
              className="h-10 px-4 rounded-full bg-primary text-[#181811] text-sm font-bold shadow-sm hover:brightness-95 transition-all flex items-center gap-2 animate-scale-in"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Novo Cliente
            </button>
          </Tooltip>
          <Tooltip text="Registrar um novo pagamento manual">
            <button
              onClick={() => navigate('/pagamentos/registrar')}
              className="h-10 px-4 rounded-full bg-primary text-[#181811] text-sm font-bold shadow-sm hover:brightness-95 transition-all flex items-center gap-2 animate-scale-in"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              Registrar Pagamento
            </button>
          </Tooltip>
        </div>
        {loading ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <LoadingSkeleton key={i} type="card" lines={2} />
              ))}
            </div>
            <LoadingSkeleton type="chart" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="card" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Erro ao carregar dados</h3>
              </div>
              <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={carregarEstatisticas}
                className="w-full px-4 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1 - Total Clients */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">groups</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Total Clients</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.totalClientes}</p>
                </div>
              </div>
              
              {/* Card 2 - Active Subscriptions */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">loyalty</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.assinaturasAtivas}</p>
                </div>
              </div>
              
              {/* Card 3 - Expired Subscriptions */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a190b] shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a] hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-neutral-light dark:bg-[#2e2d1a] group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">running_with_errors</span>
                  </div>
                </div>
                <div>
                  <p className="text-[#8c8b5f] dark:text-[#a3a272] text-sm font-medium mb-1">Expired Subscriptions</p>
                  <p className="text-3xl font-bold text-neutral-dark dark:text-white tracking-tight">{stats.assinaturasVencidas}</p>
                </div>
              </div>
              
              {/* Card 4 - Revenue */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-neutral-dark dark:bg-[#f9f506] shadow-sm border border-neutral-dark dark:border-primary hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-[#3a3928] dark:bg-[#d6d311] group-hover:bg-[#4a4933] dark:group-hover:bg-[#bfbd0f] transition-colors">
                    <span className="material-symbols-outlined text-primary dark:text-neutral-dark">attach_money</span>
                  </div>
                  {stats.crescimentoReceita !== undefined && stats.crescimentoReceita !== null && stats.crescimentoReceita !== 0 && (
                    <span className={`text-xs font-bold ${getCrescimentoColor(stats.crescimentoReceita)}`}>
                      {formatarCrescimento(stats.crescimentoReceita)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[#a3a272] dark:text-[#6b6a07] text-sm font-medium mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-white dark:text-neutral-dark tracking-tight">
                    {utils.formatarMoeda(stats.receitaMes || 0)}
                  </p>
                  {stats.receitaMesAnterior > 0 && (
                    <p className="text-xs text-[#a3a272] dark:text-[#6b6a07] mt-1">
                      Mês anterior: {utils.formatarMoeda(stats.receitaMesAnterior)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Cards de Alertas */}
            {stats.assinaturasVencendo > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-4">
                <div className="p-2 rounded-full bg-yellow-500">
                  <span className="material-symbols-outlined text-white">warning</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-yellow-800 dark:text-yellow-300">
                    {stats.assinaturasVencendo} assinatura{stats.assinaturasVencendo > 1 ? 's' : ''} vencendo em 7 dias
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Ação recomendada: Verificar e renovar assinaturas
                  </p>
                </div>
                <button
                  onClick={() => navigate('/assinaturas')}
                  className="px-4 h-10 rounded-full bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors"
                >
                  Ver Assinaturas
                </button>
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receita Histórica */}
              <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
                <h3 className="text-lg font-bold text-neutral-dark dark:text-white mb-6">Receita (Últimos 6 Meses)</h3>
                {stats.receitaHistorica && stats.receitaHistorica.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.receitaHistorica}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5dc" />
                      <XAxis 
                        dataKey="mes" 
                        stroke="#8c8b5f"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#8c8b5f"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a190b', 
                          border: '1px solid #3a3928',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => utils.formatarMoeda(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#f9f506" 
                        strokeWidth={3}
                        dot={{ fill: '#f9f506', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-[#8c8b5f] dark:text-[#a3a272]">
                    <p>Sem dados de receita histórica</p>
                  </div>
                )}
              </div>

              {/* Gráfico de Receita por Plano */}
              <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
                <h3 className="text-lg font-bold text-neutral-dark dark:text-white mb-6">Receita por Plano</h3>
                {stats.receitaPorPlano && stats.receitaPorPlano.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.receitaPorPlano}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, receita }) => `${name}: ${utils.formatarMoeda(receita)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="receita"
                      >
                        {stats.receitaPorPlano.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a190b', 
                          border: '1px solid #3a3928',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => utils.formatarMoeda(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-[#8c8b5f] dark:text-[#a3a272]">
                    <p>Sem dados de receita por plano</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de Conversão do Flow */}
            {stats.flowStats && (
              <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-dark dark:text-white">Conversão do Flow</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">Completos: {stats.flowStats.completos || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">Em Andamento: {stats.flowStats.emAndamento || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">Abandonados: {stats.flowStats.abandonados || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-[#f8f8f5] dark:bg-[#23220f]">
                    <p className="text-2xl font-bold text-neutral-dark dark:text-white">{stats.flowStats.total || 0}</p>
                    <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">Total de Flows</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.flowStats.completos || 0}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Completos</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.flowStats.emAndamento || 0}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Em Andamento</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.flowStats.abandonados || 0}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Abandonados</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-dark dark:text-white">Taxa de Conversão</span>
                    <span className="text-sm font-bold text-primary">
                      {stats.flowStats?.taxaConversao !== undefined && !isNaN(stats.flowStats.taxaConversao) 
                        ? stats.flowStats.taxaConversao.toFixed(1) 
                        : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-[#f8f8f5] dark:bg-[#23220f] rounded-full h-4">
                    <div 
                      className="bg-primary h-4 rounded-full transition-all duration-500"
                      style={{ width: `${stats.flowStats?.taxaConversao !== undefined && !isNaN(stats.flowStats.taxaConversao) ? stats.flowStats.taxaConversao : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 5 Clientes */}
            {stats.top5Clientes && stats.top5Clientes.length > 0 && (
              <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 shadow-sm border border-[#f0f0eb] dark:border-[#2e2d1a]">
                <h3 className="text-lg font-bold text-neutral-dark dark:text-white mb-6">Top 5 Clientes por Receita</h3>
                <div className="space-y-3">
                  {stats.top5Clientes.map((cliente, index) => (
                    <div 
                      key={cliente.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-[#f8f8f5] dark:bg-[#23220f] hover:bg-[#e5e5dc] dark:hover:bg-[#3a3928] transition-colors cursor-pointer"
                      onClick={() => navigate(`/clientes/buscar?cpf=${cliente.cpf}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary flex items-center justify-center text-neutral-dark font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-dark dark:text-white">{cliente.name}</p>
                          <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                            {utils.aplicarMascaraCPF(cliente.cpf)}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {utils.formatarMoeda(cliente.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

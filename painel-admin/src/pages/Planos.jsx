import { useState, useEffect } from 'react';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Tooltip from '../components/Tooltip';
import { toast } from '../utils/toast';

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showStats, setShowStats] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filterActive, setFilterActive] = useState(null); // null = todos, true = ativos, false = inativos

  const [formData, setFormData] = useState({
    name: '',
    type: 'monthly',
    price: '',
    currency: 'BRL',
    description: '',
    active: true
  });

  useEffect(() => {
    carregarPlanos();
  }, [filterActive]);

  const carregarPlanos = async () => {
    setLoading(true);
    try {
      const listaPlanos = await api.listarPlanos(filterActive);
      console.log('📋 Planos carregados:', listaPlanos);
      setPlanos(listaPlanos || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos: ' + (error.message || 'Erro desconhecido'));
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      type: 'monthly',
      price: '',
      currency: 'BRL',
      description: '',
      active: true
    });
    setShowModal(true);
  };

  const abrirModalEditar = (plano) => {
    setEditingPlan(plano);
    setFormData({
      name: plano.name || '',
      type: plano.type || 'monthly',
      price: plano.price?.toString() || '',
      currency: plano.currency || 'BRL',
      description: plano.description || '',
      active: plano.active !== undefined ? plano.active : true
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      type: 'monthly',
      price: '',
      currency: 'BRL',
      description: '',
      active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        // Atualizar
        const result = await api.atualizarPlano(editingPlan.id, formData);
        if (result?.success) {
          toast.success('Plano atualizado com sucesso!');
          fecharModal();
          carregarPlanos();
        } else {
          toast.error('Erro ao atualizar plano: ' + (result?.error || 'Erro desconhecido'));
        }
      } else {
        // Criar
        const result = await api.criarPlano(formData);
        if (result?.success) {
          toast.success('Plano criado com sucesso!');
          fecharModal();
          carregarPlanos();
        } else {
          toast.error('Erro ao criar plano: ' + (result?.error || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleToggleActive = async (plano) => {
    const confirmMessage = plano.active 
      ? 'Tem certeza que deseja desativar este plano?'
      : 'Tem certeza que deseja ativar este plano?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let result;
      if (plano.active) {
        result = await api.desativarPlano(plano.id);
      } else {
        result = await api.ativarPlano(plano.id);
      }

      if (result?.success) {
        alert(`Plano ${plano.active ? 'desativado' : 'ativado'} com sucesso!`);
        carregarPlanos();
      } else {
        alert('Erro ao alterar status do plano: ' + (result?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
      alert('Erro ao alterar status do plano: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const carregarEstatisticas = async (planId) => {
    if (showStats === planId && statsData) {
      setShowStats(null);
      setStatsData(null);
      return;
    }

    setLoadingStats(true);
    setShowStats(planId);
    try {
      const result = await api.obterEstatisticasPlano(planId);
      if (result?.success) {
        setStatsData(result);
      } else {
        alert('Erro ao carregar estatísticas: ' + (result?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      alert('Erro ao carregar estatísticas: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-10">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-dark dark:text-white mb-2">
              Gerenciamento de Planos
            </h1>
            <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
              Crie, edite e gerencie os planos de assinatura
            </p>
          </div>
          <Tooltip text="Criar um novo plano de assinatura">
            <button
              onClick={abrirModalCriar}
              className="px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2 animate-scale-in hover:scale-105"
            >
              <span className="material-symbols-outlined">add</span>
              Novo Plano
            </button>
          </Tooltip>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterActive === null
                ? 'bg-primary text-neutral-dark'
                : 'bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white hover:opacity-90'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterActive === true
                ? 'bg-primary text-neutral-dark'
                : 'bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white hover:opacity-90'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterActive === false
                ? 'bg-primary text-neutral-dark'
                : 'bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white hover:opacity-90'
            }`}
          >
            Inativos
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 animate-fade-in">
            <LoadingSkeleton type="table" lines={5} />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#f0f0eb] dark:border-[#2e2d1a] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-light dark:bg-[#2e2d1a] text-xs uppercase text-[#8c8b5f]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Plano</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Preço</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0eb] dark:divide-[#2e2d1a]">
                {planos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[#8c8b5f] dark:text-[#a3a272]">
                      Nenhum plano encontrado
                    </td>
                  </tr>
                ) : (
                  planos.map((plano) => {
                    const tipoTexto = plano.type === 'monthly' ? 'Mensal' :
                                     plano.type === 'yearly' ? 'Anual' :
                                     plano.type === 'one_time' ? 'Único' : plano.type;
                    
                    return (
                      <tr key={plano.id} className="hover:bg-neutral-light/50 dark:hover:bg-[#2e2d1a]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">card_membership</span>
                            </div>
                            <div>
                              <p className="font-bold text-neutral-dark dark:text-white">{plano.name || 'Plano'}</p>
                              <p className="text-xs text-[#8c8b5f]">{plano.description || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#5e5d40] dark:text-[#d1d0c5]">{tipoTexto}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-neutral-dark dark:text-white">{utils.formatarMoeda(parseFloat(plano.price || 0))}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            plano.active 
                              ? 'bg-[#e6f6e8] text-accent-green' 
                              : 'bg-neutral-light text-[#5e5d40]'
                          }`}>
                            <span className="size-1.5 rounded-full bg-current"></span>
                            {plano.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip text="Ver estatísticas do plano">
                              <button
                                onClick={() => carregarEstatisticas(plano.id)}
                                className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-all hover:scale-110"
                              >
                                <span className="material-symbols-outlined text-[#8c8b5f] dark:text-[#a3a272]">bar_chart</span>
                              </button>
                            </Tooltip>
                            <Tooltip text="Editar plano">
                              <button
                                onClick={() => abrirModalEditar(plano)}
                                className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-all hover:scale-110"
                              >
                                <span className="material-symbols-outlined text-[#8c8b5f] dark:text-[#a3a272]">edit</span>
                              </button>
                            </Tooltip>
                            <Tooltip text={plano.active ? 'Desativar plano' : 'Ativar plano'}>
                              <button
                                onClick={() => handleToggleActive(plano)}
                                className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-all hover:scale-110"
                              >
                                <span className={`material-symbols-outlined ${
                                  plano.active 
                                    ? 'text-red-600' 
                                    : 'text-green-600'
                                }`}>
                                  {plano.active ? 'toggle_on' : 'toggle_off'}
                                </span>
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Criar/Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#e5e5dc] dark:border-[#3a3928]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-dark dark:text-white">
                    {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                  </h2>
                  <button
                    onClick={fecharModal}
                    className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
                  >
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">close</span>
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                    placeholder="Ex: Plano Mensal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="one_time">Único</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Moeda
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-dark dark:text-white">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg bg-neutral-light dark:bg-[#2e2d1a] border border-[#e5e5dc] dark:border-[#3a3928] text-neutral-dark dark:text-white"
                    placeholder="Descrição do plano..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="active" className="text-sm text-neutral-dark dark:text-white">
                    Plano ativo
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                  </button>
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="px-6 py-2 bg-neutral-light dark:bg-[#2e2d1a] text-neutral-dark dark:text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Estatísticas */}
        {showStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-[#e5e5dc] dark:border-[#3a3928]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-dark dark:text-white">
                    Estatísticas do Plano
                  </h2>
                  <button
                    onClick={() => {
                      setShowStats(null);
                      setStatsData(null);
                    }}
                    className="p-2 rounded-lg hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
                  >
                    <span className="material-symbols-outlined text-neutral-dark dark:text-white">close</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {loadingStats ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                      refresh
                    </span>
                  </div>
                ) : statsData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Assinaturas Ativas</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {statsData.stats?.activeSubscriptions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Total de Assinaturas</p>
                      <p className="text-2xl font-bold text-neutral-dark dark:text-white">
                        {statsData.stats?.totalSubscriptions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-light dark:bg-[#2e2d1a] rounded-lg">
                      <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-1">Receita Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {utils.formatarMoeda(statsData.stats?.totalRevenue || 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-[#8c8b5f] dark:text-[#a3a272]">Nenhuma estatística disponível</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

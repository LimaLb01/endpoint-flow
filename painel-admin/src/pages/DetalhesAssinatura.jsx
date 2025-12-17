import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, utils } from '../utils/api';
import Layout from '../components/Layout';

export default function DetalhesAssinatura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const carregarDetalhes = async () => {
    try {
      const data = await api.obterAssinatura(id);
      setAssinatura(data);
    } catch (error) {
      alert('Erro ao carregar detalhes: ' + error.message);
      navigate('/assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;
    
    try {
      await api.cancelarAssinatura(id, false);
      alert('Assinatura cancelada com sucesso!');
      carregarDetalhes();
    } catch (error) {
      alert('Erro ao cancelar: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center">Carregando...</div>
      </Layout>
    );
  }

  if (!assinatura) {
    return (
      <Layout>
        <div className="p-8 text-center">Assinatura não encontrada</div>
      </Layout>
    );
  }

  const customer = assinatura.customer || {};
  const plan = assinatura.plan || {};

  return (
    <Layout>
      <header className="w-full px-6 py-4 lg:px-10 lg:py-6 border-b border-[#e5e5dc] dark:border-[#3a3928] bg-white/80 dark:bg-[#1a190b]/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400 text-sm mb-1">
                  <a onClick={() => navigate('/assinaturas')} className="hover:underline cursor-pointer">Assinaturas</a>
                  <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                  <span>Detalhes</span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-text-main dark:text-white">Detalhes da Assinatura #{id.substring(0, 8)}</h2>
              </div>
              <button
                onClick={() => navigate('/assinaturas')}
                className="px-4 py-2 rounded-full bg-neutral-light dark:bg-[#2e2d1a] text-text-main dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Voltar
              </button>
        </div>
      </header>

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#e6e6db] dark:border-[#3a392a] p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Informações do Cliente</h3>
              <p className="text-lg font-bold">{customer.name || 'N/A'}</p>
              <p className="text-sm text-text-secondary">{customer.email || 'N/A'}</p>
              <p className="text-sm text-text-secondary">CPF: {utils.aplicarMascaraCPF(customer.cpf || '')}</p>
            </div>

            <div className="bg-white dark:bg-[#1a190b] rounded-xl border border-[#e6e6db] dark:border-[#3a392a] p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Informações da Assinatura</h3>
              <p className="text-2xl font-bold mb-2">{plan.name || 'N/A'}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                assinatura.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {assinatura.status === 'active' ? 'Ativa' : assinatura.status === 'canceled' ? 'Cancelada' : 'Vencida'}
              </span>
              <div className="mt-4 space-y-2">
                <p className="text-sm">Início: {utils.formatarData(assinatura.current_period_start)}</p>
                <p className="text-sm">Vencimento: {utils.formatarData(assinatura.current_period_end)}</p>
              </div>
            </div>

            {assinatura.status === 'active' && (
              <button
                onClick={cancelar}
                className="px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Cancelar Assinatura
              </button>
        )}
      </div>
    </Layout>
  );
}


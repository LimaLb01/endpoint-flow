import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { toast } from '../utils/toast';

export default function Pagamentos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [barbershopStatus, setBarbershopStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [barbershopId, setBarbershopId] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [checkoutRedirecting, setCheckoutRedirecting] = useState(false);

  useEffect(() => {
    carregarDados();
    
    // Verificar se veio de callback do Stripe
    const onboarding = searchParams.get('onboarding');
    const checkout = searchParams.get('checkout');
    const portal = searchParams.get('portal');
    
    if (onboarding === 'success') {
      toast.success('Onboarding do Stripe concluído com sucesso!');
      // Limpar parâmetro da URL
      navigate('/pagamentos', { replace: true });
      carregarDados();
    } else if (onboarding === 'refresh') {
      toast.info('Por favor, complete o onboarding do Stripe');
    } else if (checkout === 'success') {
      toast.success('Pagamento processado com sucesso!');
      navigate('/pagamentos', { replace: true });
      carregarDados();
    } else if (checkout === 'cancel') {
      toast.warning('Checkout cancelado');
      navigate('/pagamentos', { replace: true });
    } else if (portal === 'return') {
      toast.success('Alterações salvas com sucesso!');
      navigate('/pagamentos', { replace: true });
      carregarDados();
    }
  }, [searchParams, navigate]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar barbearias
      const barbershopsResult = await api.buscarBarbershops();
      const barbershops = barbershopsResult?.data || [];
      
      if (barbershops && barbershops.length > 0) {
        // Por enquanto, usar a primeira barbearia
        // TODO: Quando tiver autenticação por barbearia, usar a barbearia do usuário logado
        const barbershop = barbershops[0];
        setBarbershopId(barbershop.id);
        
        // Buscar status da conta Stripe
        const status = await api.obterStatusStripeConnect(barbershop.id);
        setBarbershopStatus(status);
        
        // Buscar assinatura ativa da barbearia
        const assinatura = await api.buscarAssinaturaBarbershop(barbershop.id);
        setSubscription(assinatura);
      } else {
        // Nenhuma barbearia encontrada
        setBarbershopStatus({
          connected: false,
          status: 'not_connected',
          message: 'Nenhuma barbearia configurada'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações de pagamento');
      setBarbershopStatus({
        connected: false,
        status: 'error',
        message: 'Erro ao carregar dados'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConectarPagamentos = async () => {
    if (!barbershopId) {
      toast.error('Barbearia não encontrada');
      return;
    }

    setRedirecting(true);
    try {
      const result = await api.iniciarOnboardingStripe(barbershopId);
      
      if (result && result.url) {
        // Redirecionar para Stripe
        window.location.href = result.url;
      } else {
        toast.error('Erro ao gerar link de onboarding');
        setRedirecting(false);
      }
    } catch (error) {
      console.error('Erro ao iniciar onboarding:', error);
      toast.error('Erro ao iniciar processo de conexão');
      setRedirecting(false);
    }
  };

  const handleGerenciarCartao = async () => {
    if (!subscription || !subscription.stripe_customer_id) {
      toast.error('Nenhuma assinatura ativa encontrada');
      return;
    }

    try {
      const returnUrl = `${window.location.origin}/pagamentos?portal=return`;
      const result = await api.criarLinkCustomerPortal(subscription.stripe_customer_id, returnUrl);
      
      if (result && result.url) {
        // Redirecionar para Stripe Customer Portal
        window.location.href = result.url;
      } else {
        toast.error('Erro ao gerar link do portal');
      }
    } catch (error) {
      console.error('Erro ao criar link do portal:', error);
      toast.error('Erro ao acessar portal de pagamentos');
    }
  };

  const handleVerHistorico = async () => {
    // Redirecionar para portal do Stripe (mesmo que gerenciar cartão)
    await handleGerenciarCartao();
  };

  const carregarPlanos = async () => {
    setLoadingPlanos(true);
    try {
      const listaPlanos = await api.listarPlanos(true); // Apenas planos ativos
      setPlanos(listaPlanos || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
      setPlanos([]);
    } finally {
      setLoadingPlanos(false);
    }
  };

  const handleCriarAssinatura = async () => {
    if (!barbershopId) {
      toast.error('Barbearia não encontrada');
      return;
    }

    if (barbershopStatus?.status !== 'active') {
      toast.error('Conta Stripe não está ativa. Complete o onboarding primeiro.');
      return;
    }

    // Carregar planos e abrir modal
    await carregarPlanos();
    setShowPlanModal(true);
  };

  const handleSelecionarPlano = async (plano) => {
    if (!plano.stripe_price_id) {
      toast.error('Este plano não possui integração com Stripe. Configure o stripe_price_id primeiro.');
      return;
    }

    setCheckoutRedirecting(true);
    try {
      // Buscar dados do usuário do localStorage
      const userStr = localStorage.getItem('user');
      let customerEmail = 'admin@barbershop.com'; // Fallback
      let customerCpf = '00000000000'; // Fallback

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.email) customerEmail = user.email;
          // CPF não está no user, manter fallback
        } catch (e) {
          console.warn('Erro ao parsear dados do usuário:', e);
        }
      }

      const result = await api.criarCheckoutStripeConnect({
        barbershopId,
        customerEmail,
        customerCpf,
        planId: plano.id,
        priceId: plano.stripe_price_id,
      });

      if (result && result.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = result.url;
      } else {
        toast.error('Erro ao criar sessão de checkout');
        setCheckoutRedirecting(false);
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao iniciar checkout: ' + (error.message || 'Erro desconhecido'));
      setCheckoutRedirecting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_connected': { label: 'Não Conectada', color: 'bg-gray-500' },
      'pending': { label: 'Em Análise', color: 'bg-yellow-500' },
      'active': { label: 'Ativa', color: 'bg-green-500' },
      'error': { label: 'Erro', color: 'bg-red-500' },
    };

    const config = statusConfig[status] || statusConfig['not_connected'];
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-10">
          <LoadingSkeleton type="card" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#181811] dark:text-white">Pagamentos</h1>
            <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mt-1">
              Gerencie seus pagamentos e assinaturas
            </p>
          </div>
        </div>

        {/* Status da Conta Stripe */}
        <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 border border-[#e5e5dc] dark:border-[#3a3928]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#181811] dark:text-white">
              Status da Conta Stripe
            </h2>
            {barbershopStatus && getStatusBadge(barbershopStatus.status)}
          </div>
          
          {barbershopStatus && (
            <div className="space-y-3">
              {barbershopStatus.status === 'not_connected' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                    Conecte sua conta Stripe para começar a receber pagamentos online.
                  </p>
                  <button
                    onClick={handleConectarPagamentos}
                    disabled={redirecting}
                    className="px-6 py-3 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {redirecting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Redirecionando...
                      </>
                    ) : (
                      'Conectar Pagamentos'
                    )}
                  </button>
                </div>
              ) : barbershopStatus.status === 'pending' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                    Sua conta está em processo de análise. Isso pode levar alguns dias úteis.
                  </p>
                  <button
                    onClick={handleConectarPagamentos}
                    disabled={redirecting}
                    className="px-6 py-3 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {redirecting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Redirecionando...
                      </>
                    ) : (
                      'Verificar Status'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
                    Conta Stripe ativa e pronta para receber pagamentos.
                  </p>
                  {barbershopStatus.account_id && (
                    <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] font-mono">
                      ID: {barbershopStatus.account_id}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status da Assinatura */}
        {subscription ? (
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 border border-[#e5e5dc] dark:border-[#3a3928]">
            <h2 className="text-lg font-semibold text-[#181811] dark:text-white mb-4">
              Assinatura Ativa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] mb-1">Status</p>
                <p className="text-sm font-semibold text-[#181811] dark:text-white capitalize">
                  {subscription.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] mb-1">Valor do Plano</p>
                <p className="text-sm font-semibold text-[#181811] dark:text-white">
                  R$ {subscription.plan?.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] mb-1">Próxima Cobrança</p>
                <p className="text-sm font-semibold text-[#181811] dark:text-white">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1a190b] rounded-xl p-6 border border-[#e5e5dc] dark:border-[#3a3928]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#181811] dark:text-white">
                Assinatura
              </h2>
              {barbershopStatus?.status === 'active' && (
                <button
                  onClick={handleCriarAssinatura}
                  disabled={checkoutRedirecting}
                  className="px-4 py-2 bg-primary text-neutral-dark rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {checkoutRedirecting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">add</span>
                      Criar Assinatura
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272]">
              {barbershopStatus?.status === 'active' 
                ? 'Nenhuma assinatura ativa no momento. Clique em "Criar Assinatura" para começar.'
                : 'Complete o onboarding do Stripe para criar uma assinatura.'}
            </p>
          </div>
        )}

        {/* Aviso de Segurança */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Pagamentos processados com segurança pelo Stripe
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Todos os pagamentos são processados diretamente pelo Stripe. Nós não armazenamos dados de cartão de crédito.
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbershopStatus?.status === 'active' && subscription && (
            <>
              <button
                onClick={handleGerenciarCartao}
                className="bg-white dark:bg-[#1a190b] border border-[#e5e5dc] dark:border-[#3a3928] rounded-xl p-6 text-left hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                  <h3 className="font-semibold text-[#181811] dark:text-white">
                    Gerenciar Cartão / Pagamentos
                  </h3>
                </div>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                  Atualize seu método de pagamento ou veja o histórico
                </p>
              </button>
              <button
                onClick={handleVerHistorico}
                className="bg-white dark:bg-[#1a190b] border border-[#e5e5dc] dark:border-[#3a3928] rounded-xl p-6 text-left hover:bg-neutral-light dark:hover:bg-[#2e2d1a] transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  <h3 className="font-semibold text-[#181811] dark:text-white">
                    Ver Histórico
                  </h3>
                </div>
                <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272]">
                  Visualize todas as transações e faturas
                </p>
              </button>
            </>
          )}
        </div>

        {/* Modal de Seleção de Plano */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a190b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e5e5dc] dark:border-[#3a3928]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#181811] dark:text-white">
                    Selecionar Plano
                  </h2>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="text-[#8c8b5f] dark:text-[#a3a272] hover:text-[#181811] dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {loadingPlanos ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSkeleton type="card" />
                  </div>
                ) : planos.length === 0 ? (
                  <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] text-center py-8">
                    Nenhum plano ativo disponível.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {planos.map((plano) => (
                      <button
                        key={plano.id}
                        onClick={() => handleSelecionarPlano(plano)}
                        disabled={!plano.stripe_price_id || checkoutRedirecting}
                        className="bg-white dark:bg-[#1a190b] border-2 border-[#e5e5dc] dark:border-[#3a3928] rounded-xl p-6 text-left hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-[#181811] dark:text-white">
                            {plano.name}
                          </h3>
                          <span className="text-lg font-bold text-primary">
                            R$ {plano.price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <p className="text-xs text-[#8c8b5f] dark:text-[#a3a272] mb-2">
                          {plano.type === 'monthly' ? 'Mensal' : 
                           plano.type === 'yearly' ? 'Anual' : 
                           'Único'}
                        </p>
                        {plano.description && (
                          <p className="text-sm text-[#8c8b5f] dark:text-[#a3a272] mb-4">
                            {plano.description}
                          </p>
                        )}
                        {!plano.stripe_price_id && (
                          <p className="text-xs text-red-500 mt-2">
                            ⚠️ Plano não configurado no Stripe
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


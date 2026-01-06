/**
 * Serviço para Gerenciar Produtos e Preços no Stripe
 * Cria produtos e preços automaticamente via API do Stripe
 */

const Stripe = require('stripe');
const { globalLogger } = require('../utils/logger');

// Inicializar Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Verifica se o Stripe está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return stripe !== null;
}

/**
 * Cria um produto no Stripe
 * @param {object} productData - Dados do produto
 * @param {string} productData.name - Nome do produto
 * @param {string} productData.description - Descrição do produto
 * @param {string} [productData.image] - URL da imagem do produto
 * @param {string} [productData.stripeAccount] - ID da conta Stripe Connect (acct_xxx) - opcional
 * @returns {Promise<object|null>} Produto criado ou null
 */
async function createProduct(productData) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const { name, description, image, stripeAccount } = productData;

    const productParams = {
      name: name,
      description: description || null,
      images: image ? [image] : undefined,
      metadata: {
        created_by: 'platform',
        created_at: new Date().toISOString(),
      },
    };

    // Se stripeAccount fornecido, criar na conta Connect
    const options = stripeAccount ? { stripeAccount } : {};

    const product = await stripe.products.create(productParams, options);

    globalLogger.info('Produto Stripe criado', {
      productId: product.id,
      name: product.name,
      stripeAccount: stripeAccount || 'main_account',
    });

    return product;
  } catch (error) {
    globalLogger.error('Erro ao criar produto no Stripe', {
      error: error.message,
      productData,
    });
    return null;
  }
}

/**
 * Cria um preço no Stripe
 * @param {object} priceData - Dados do preço
 * @param {string} priceData.productId - ID do produto (prod_xxx)
 * @param {number} priceData.amount - Valor em centavos (ex: 19990 = R$ 199,90)
 * @param {string} priceData.currency - Moeda (ex: 'brl')
 * @param {string} priceData.type - Tipo: 'recurring' ou 'one_time'
 * @param {object} [priceData.recurring] - Dados de recorrência (se type === 'recurring')
 * @param {string} priceData.recurring.interval - 'month' ou 'year'
 * @param {string} [priceData.stripeAccount] - ID da conta Stripe Connect (acct_xxx) - opcional
 * @returns {Promise<object|null>} Preço criado ou null
 */
async function createPrice(priceData) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const { productId, amount, currency, type, recurring, stripeAccount } = priceData;

    const priceParams = {
      product: productId,
      unit_amount: amount, // Valor em centavos
      currency: currency.toLowerCase(), // 'brl' para Real Brasileiro
    };

    if (type === 'recurring' && recurring) {
      priceParams.recurring = {
        interval: recurring.interval, // 'month' ou 'year'
      };
    }

    // Se stripeAccount fornecido, criar na conta Connect
    const options = stripeAccount ? { stripeAccount } : {};

    const price = await stripe.prices.create(priceParams, options);

    globalLogger.info('Preço Stripe criado', {
      priceId: price.id,
      productId: productId,
      amount: amount,
      type: type,
      stripeAccount: stripeAccount || 'main_account',
    });

    return price;
  } catch (error) {
    globalLogger.error('Erro ao criar preço no Stripe', {
      error: error.message,
      priceData,
    });
    return null;
  }
}

/**
 * Cria produto e preço no Stripe baseado em um plano do sistema
 * @param {object} plan - Plano do sistema
 * @param {string} plan.name - Nome do plano
 * @param {string} plan.description - Descrição do plano
 * @param {number} plan.price - Preço do plano (ex: 199.90)
 * @param {string} plan.currency - Moeda (ex: 'BRL')
 * @param {string} plan.type - Tipo: 'monthly', 'yearly', 'one_time'
 * @param {string} [plan.stripeAccount] - ID da conta Stripe Connect (acct_xxx) - opcional
 * @returns {Promise<object|null>} Objeto com productId e priceId, ou null
 */
async function createProductAndPriceFromPlan(plan) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const { stripeAccount } = plan;

    // 1. Criar produto
    const product = await createProduct({
      name: plan.name,
      description: plan.description || null,
      stripeAccount: stripeAccount,
    });

    if (!product) {
      return null;
    }

    // 2. Converter preço para centavos
    const amountInCents = Math.round(parseFloat(plan.price) * 100);

    // 3. Determinar tipo e recorrência
    let priceType = 'one_time';
    let recurring = null;

    if (plan.type === 'monthly') {
      priceType = 'recurring';
      recurring = { interval: 'month' };
    } else if (plan.type === 'yearly') {
      priceType = 'recurring';
      recurring = { interval: 'year' };
    }

    // 4. Criar preço
    const price = await createPrice({
      productId: product.id,
      amount: amountInCents,
      currency: plan.currency || 'brl',
      type: priceType,
      recurring: recurring,
      stripeAccount: stripeAccount,
    });

    if (!price) {
      // Se falhar ao criar preço, tentar deletar o produto criado
      try {
        const options = stripeAccount ? { stripeAccount } : {};
        await stripe.products.del(product.id, options);
      } catch (delError) {
        globalLogger.warn('Erro ao deletar produto após falha na criação do preço', {
          productId: product.id,
          error: delError.message,
        });
      }
      return null;
    }

    globalLogger.info('Produto e preço criados no Stripe', {
      planId: plan.id,
      productId: product.id,
      priceId: price.id,
      stripeAccount: stripeAccount || 'main_account',
    });

    return {
      productId: product.id,
      priceId: price.id,
      product: product,
      price: price,
    };
  } catch (error) {
    globalLogger.error('Erro ao criar produto e preço no Stripe', {
      error: error.message,
      plan,
    });
    return null;
  }
}

/**
 * Atualiza um produto existente no Stripe
 * @param {string} productId - ID do produto (prod_xxx)
 * @param {object} updates - Dados para atualizar
 * @returns {Promise<object|null>} Produto atualizado ou null
 */
async function updateProduct(productId, updates) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const product = await stripe.products.update(productId, updates);

    globalLogger.info('Produto Stripe atualizado', {
      productId: product.id,
      updates: Object.keys(updates),
    });

    return product;
  } catch (error) {
    globalLogger.error('Erro ao atualizar produto no Stripe', {
      error: error.message,
      productId,
      updates,
    });
    return null;
  }
}

/**
 * Busca um produto no Stripe por ID
 * @param {string} productId - ID do produto (prod_xxx)
 * @returns {Promise<object|null>} Produto encontrado ou null
 */
async function getProduct(productId) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const product = await stripe.products.retrieve(productId);
    return product;
  } catch (error) {
    globalLogger.error('Erro ao buscar produto no Stripe', {
      error: error.message,
      productId,
    });
    return null;
  }
}

/**
 * Busca um preço no Stripe por ID
 * @param {string} priceId - ID do preço (price_xxx)
 * @returns {Promise<object|null>} Preço encontrado ou null
 */
async function getPrice(priceId) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    return price;
  } catch (error) {
    globalLogger.error('Erro ao buscar preço no Stripe', {
      error: error.message,
      priceId,
    });
    return null;
  }
}

module.exports = {
  createProduct,
  createPrice,
  createProductAndPriceFromPlan,
  updateProduct,
  getProduct,
  getPrice,
  isConfigured,
};


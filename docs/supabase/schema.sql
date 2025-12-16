-- Schema do Banco de Dados para Clube CODE
-- Execute este script no SQL Editor do Supabase

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly', 'yearly', 'one_time')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO plans (name, type, price, description) VALUES
  ('Plano Mensal', 'monthly', 99.90, 'Assinatura mensal do Clube CODE'),
  ('Plano Anual', 'yearly', 999.90, 'Assinatura anual do Clube CODE (economia de 2 meses)'),
  ('Plano Único', 'one_time', 199.90, 'Plano único sem renovação automática')
ON CONFLICT DO NOTHING;

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para assinaturas
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'manual')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Tabela de Pagamentos Manuais
CREATE TABLE IF NOT EXISTS manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed_by TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pagamentos manuais
CREATE INDEX IF NOT EXISTS idx_manual_payments_customer_id ON manual_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_payments_updated_at
  BEFORE UPDATE ON manual_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View para assinaturas ativas com dados do cliente
CREATE OR REPLACE VIEW active_subscriptions_view AS
SELECT 
  s.id,
  s.customer_id,
  s.plan_id,
  s.status,
  s.current_period_end,
  c.cpf,
  c.name,
  c.email,
  c.phone,
  p.name as plan_name,
  p.type as plan_type,
  p.price as plan_price
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- Função para verificar se CPF tem plano ativo
CREATE OR REPLACE FUNCTION check_active_plan(cpf_input TEXT)
RETURNS TABLE (
  has_plan BOOLEAN,
  is_club_member BOOLEAN,
  subscription_id UUID,
  plan_name TEXT,
  plan_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_plan,
    CASE WHEN s.id IS NOT NULL THEN true ELSE false END as is_club_member,
    s.id as subscription_id,
    p.name as plan_name,
    p.type as plan_type,
    s.current_period_end as expires_at
  FROM customers c
  LEFT JOIN subscriptions s ON c.id = s.customer_id 
    AND s.status = 'active' 
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  LEFT JOIN plans p ON s.plan_id = p.id
  WHERE c.cpf = cpf_input
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


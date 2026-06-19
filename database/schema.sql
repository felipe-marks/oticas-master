-- ============================================================
-- ÓTICAS MASTER — Schema Completo do Banco de Dados
-- Banco: PostgreSQL (Supabase)
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: admin_users (Usuários do painel administrativo)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: categories (Categorias de produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon VARCHAR(100),
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: brands (Marcas)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: products (Produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

  -- Preços
  price_original DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_sale DECIMAL(10,2),
  price_pix DECIMAL(10,2),
  installments_max INTEGER DEFAULT 3,
  installments_interest_free INTEGER DEFAULT 3,

  -- Estoque
  stock_quantity INTEGER DEFAULT 0,
  stock_min_alert INTEGER DEFAULT 5,
  track_stock BOOLEAN DEFAULT true,

  -- Atributos específicos de ótica
  frame_material VARCHAR(100),
  frame_shape VARCHAR(100),
  frame_color VARCHAR(100),
  lens_type VARCHAR(100),
  gender VARCHAR(20) CHECK (gender IN ('masculino', 'feminino', 'unissex', 'infantil')),

  -- Status e visibilidade
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_promotion BOOLEAN DEFAULT false,

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,

  -- Imagens (array de URLs)
  images JSONB DEFAULT '[]',
  main_image_url TEXT,

  -- Métricas
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: promotions (Promoções)
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')),
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  code VARCHAR(100) UNIQUE,
  banner_url TEXT,
  banner_text TEXT,

  -- Regras de aplicação
  applies_to VARCHAR(50) DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product', 'brand')),
  applies_to_ids JSONB DEFAULT '[]',

  -- Limites
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER DEFAULT 1,

  -- Vigência
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: customers (Clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  birth_date DATE,
  gender VARCHAR(20),

  -- Endereço principal
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),

  -- Dados ópticos
  optical_prescription JSONB,

  -- Status
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT false,

  -- Métricas
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: orders (Pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded', 'chargeback'
  )),

  -- Valores
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Pagamento
  payment_method VARCHAR(50),
  payment_installments INTEGER DEFAULT 1,
  payment_id VARCHAR(255),
  payment_data JSONB,

  -- Promoção aplicada
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  coupon_code VARCHAR(100),

  -- Entrega
  shipping_method VARCHAR(100),
  shipping_tracking VARCHAR(100),
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,

  -- Endereço de entrega (snapshot)
  shipping_address JSONB,

  -- Dados do cliente (snapshot)
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Notas
  notes TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: order_items (Itens do pedido)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_sku VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: appointments (Agendamentos de exame)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type VARCHAR(100) DEFAULT 'exame_vista',
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: newsletter_subscribers (Assinantes da newsletter)
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- TABELA: site_settings (Configurações do site)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: banners (Banners e slides da home)
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text VARCHAR(100),
  position VARCHAR(50) DEFAULT 'hero',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: contact_messages (Mensagens de contato)
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================================
-- DADOS INICIAIS — Categorias
-- ============================================================
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Óculos de Sol', 'solar', 'Óculos de sol com proteção UV', 'Sun', 1),
  ('Óculos de Grau', 'grau', 'Armações para óculos de grau', 'Glasses', 2),
  ('Óculos Infantis', 'infantil', 'Óculos especiais para crianças', 'Baby', 3),
  ('Lentes de Contato', 'lentes', 'Lentes de contato de diversas marcas', 'Eye', 4),
  ('Óculos Esportivos', 'esportivo', 'Óculos para prática de esportes', 'Zap', 5),
  ('Acessórios', 'acessorios', 'Estojos, cordões e outros acessórios', 'Package', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DADOS INICIAIS — Configurações do site
-- ============================================================
INSERT INTO site_settings (key, value, description) VALUES
  ('store_name', '"Óticas Master"', 'Nome da loja'),
  ('store_phone', '"(94) 98179-6065"', 'Telefone principal'),
  ('store_email', '"oticasmaster@outlook.com"', 'E-mail da loja'),
  ('store_whatsapp', '"5594981796065"', 'WhatsApp para pedidos'),
  ('store_address', '{"street": "Rua Costa e Silva, Quadra 06, Lote 02", "neighborhood": "Esplanada", "city": "Parauapebas", "state": "PA", "zip": ""}', 'Endereço da loja'),
  ('store_hours', '"Segunda a Sábado, 8h às 18h"', 'Horário de funcionamento'),
  ('store_instagram', '"@oticasmaster.pbs"', 'Instagram'),
  ('store_cnpj', '""', 'CNPJ da empresa'),
  ('pix_discount_percent', '5', 'Desconto para pagamento via PIX (%)'),
  ('max_installments', '3', 'Número máximo de parcelas sem juros'),
  ('free_shipping_above', '300', 'Valor mínimo para frete grátis'),
  ('topbar_messages', '["Enviamos para todo o Brasil", "Parcelamento em até 3x sem juros", "5% de desconto no PIX"]', 'Mensagens da barra superior')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ADMIN PADRÃO (senha: Admin@2026 — TROCAR APÓS PRIMEIRO LOGIN)
-- ============================================================
INSERT INTO admin_users (name, email, password_hash, role) VALUES
  ('Felipe Marques', 'felipedourado029@gmail.com',
   crypt('Admin@2026', gen_salt('bf')), 'super_admin')
ON CONFLICT (email) DO NOTHING;

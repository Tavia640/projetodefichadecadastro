-- Script para configurar a tabela de configurações no Supabase
-- Execute este script no SQL Editor do painel do Supabase

-- 1. Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas permissivas
DROP POLICY IF EXISTS "Permitir leitura de configurações ativas" ON configuracoes;
DROP POLICY IF EXISTS "Permitir leitura de todas as configurações" ON configuracoes;
DROP POLICY IF EXISTS "Permitir operações do sistema" ON configuracoes;

CREATE POLICY "Permitir leitura de todas as configurações"
  ON configuracoes
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir operações do sistema"
  ON configuracoes
  FOR ALL
  USING (true);

-- 4. Inserir dados de configuração
INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'RESEND_API_KEY',
  're_SmQE7h9x_8gJ7nxVBZiv81R4YWEamyVTs',
  'Chave API do Resend para envio de emails',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();

INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'EMAIL_DESTINO',
  'admudrive2025@gavresorts.com.br',
  'Email de destino para receber as fichas de negociação',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();

INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'EMAIL_REMETENTE',
  'GAV Resorts <onboarding@resend.dev>',
  'Email e nome do remetente para os emails enviados',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();

-- 5. Verificar se os dados foram inseridos
SELECT * FROM configuracoes;

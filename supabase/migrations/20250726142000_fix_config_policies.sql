/*
  # Corrigir políticas de configurações
  
  1. Remover política restritiva atual
  2. Adicionar política mais permissiva para leitura de configurações
  3. Garantir que o sistema possa acessar as configurações
*/

-- Remover a política atual se existir
DROP POLICY IF EXISTS "Permitir leitura de configurações ativas" ON configuracoes;

-- Criar política mais permissiva para leitura
CREATE POLICY "Permitir leitura de todas as configurações"
  ON configuracoes
  FOR SELECT
  USING (true);

-- Criar política para permitir inserção/atualização para o sistema
CREATE POLICY "Permitir operações do sistema"
  ON configuracoes
  FOR ALL
  USING (true);

-- Garantir que os dados estão inseridos
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

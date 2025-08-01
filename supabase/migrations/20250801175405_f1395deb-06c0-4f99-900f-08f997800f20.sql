-- Create fichas table for storing client negotiation records
CREATE TABLE public.fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dados_cliente JSONB NOT NULL,
  dados_negociacao JSONB NOT NULL,
  nome_consultor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'arquivada')),
  nome_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Permitir tudo em fichas" 
ON public.fichas 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fichas_updated_at
BEFORE UPDATE ON public.fichas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create configuracoes table for system settings
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Permitir tudo em configuracoes" 
ON public.configuracoes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
('RESEND_API_KEY', '', 'Chave da API do Resend para envio de emails'),
('EMAIL_DESTINO', '', 'Email de destino para onde as fichas serão enviadas');
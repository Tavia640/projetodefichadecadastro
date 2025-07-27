import { supabase } from '@/integrations/supabase/client';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';
import { ConfigService } from './configService';

export interface EmailPayload {
  clientData: DadosCliente;
  fichaData: DadosNegociacao;
  pdfData1: string;
  pdfData2: string;
}

export class EmailService {
  // Função para testar a conectividade do sistema de email
  static async testarConectividade(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Testando conectividade do sistema de email...');

      // Buscar configurações (com fallback)
      console.log('🔍 Buscando configurações para teste...');

      let configs: Record<string, string> = {};

      try {
        // Tentar buscar do banco primeiro
        configs = await ConfigService.getConfigs([
          'RESEND_API_KEY',
          'EMAIL_DESTINO',
          'EMAIL_REMETENTE'
        ]);
        console.log('✅ Configurações encontradas no banco');
      } catch (error: any) {
        console.warn('⚠️ Banco indisponível, usando configurações diretas:', {
          message: error?.message || 'Erro desconhecido',
          type: error?.constructor?.name || 'Unknown'
        });

        // Fallback: usar configurações diretas
        configs = {
          RESEND_API_KEY: 're_SmQE7h9x_8gJ7nxVBZiv81R4YWEamyVTs',
          EMAIL_DESTINO: 'admudrive2025@gavresorts.com.br',
          EMAIL_REMETENTE: 'GAV Resorts <onboarding@resend.dev>'
        };
        console.log('✅ Usando configurações diretas para teste');
      }

      if (!configs.RESEND_API_KEY) {
        return {
          success: false,
          message: 'Chave API do Resend não configurada no sistema. Configure nas Configurações.'
        };
      }

      if (!configs.EMAIL_DESTINO) {
        return {
          success: false,
          message: 'Email de destino não configurado no sistema. Configure nas Configurações.'
        };
      }

      console.log('✅ Configurações encontradas, testando edge function...');

      const response = await supabase.functions.invoke('send-pdfs-v2', {
        body: {
          test: true,
          configs: {
            resendApiKey: configs.RESEND_API_KEY,
            emailDestino: configs.EMAIL_DESTINO,
            emailRemetente: configs.EMAIL_REMETENTE || 'GAV Resorts <onboarding@resend.dev>'
          }
        }
      });

      console.log('📡 Resultado do teste:', response);

      if (response.error) {
        return {
          success: false,
          message: `Erro de conectividade: ${response.error.message}`
        };
      }

      if (response.data && !response.data.success) {
        return {
          success: false,
          message: response.data.message || 'Erro desconhecido no teste'
        };
      }

      return {
        success: true,
        message: 'Sistema de email está funcionando corretamente'
      };

    } catch (error: any) {
      console.error('❌ Erro no teste de conectividade:', error);
      return {
        success: false,
        message: `Erro no teste: ${error.message}`
      };
    }
  }
  static async enviarPDFs(payload: EmailPayload): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('🚀 Iniciando envio de PDFs via email...');
      console.log('📋 Dados do payload:', {
        temClientData: !!payload.clientData,
        temFichaData: !!payload.fichaData,
        nomeCliente: payload.clientData?.nome,
        tamanhoPdf1: payload.pdfData1?.length || 0,
        tamanhoPdf2: payload.pdfData2?.length || 0
      });

      // Validar dados antes do envio
      this.validarPayload(payload);

      // Buscar configurações (com fallback para configurações diretas)
      console.log('🔍 Buscando configurações do sistema...');

      let configs: Record<string, string> = {};

      try {
        // Tentar buscar do banco primeiro
        configs = await ConfigService.getConfigs([
          'RESEND_API_KEY',
          'EMAIL_DESTINO',
          'EMAIL_REMETENTE'
        ]);
        console.log('✅ Configurações carregadas do banco de dados');
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Erro desconhecido';
        console.warn('⚠️ Erro ao acessar banco, usando configurações diretas:', errorMsg);

        // Fallback: usar configurações diretas
        configs = {
          RESEND_API_KEY: 're_SmQE7h9x_8gJ7nxVBZiv81R4YWEamyVTs',
          EMAIL_DESTINO: 'admudrive2025@gavresorts.com.br',
          EMAIL_REMETENTE: 'GAV Resorts <onboarding@resend.dev>'
        };
        console.log('✅ Usando configurações diretas (fallback)');
      }

      if (!configs.RESEND_API_KEY) {
        throw new Error('Chave API do Resend não configurada no sistema. Entre em contato com o administrador.');
      }

      if (!configs.EMAIL_DESTINO) {
        throw new Error('Email de destino não configurado no sistema. Entre em contato com o administrador.');
      }

      // Invocar edge function
      const response = await supabase.functions.invoke('send-pdfs-v2', {
        body: {
          ...payload,
          configs: {
            resendApiKey: configs.RESEND_API_KEY,
            emailDestino: configs.EMAIL_DESTINO,
            emailRemetente: configs.EMAIL_REMETENTE || 'GAV Resorts <onboarding@resend.dev>'
          }
        }
      });

      console.log('📨 Resposta completa da edge function:', {
        error: response.error,
        data: response.data,
        status: response.status
      });

      // Verificar erros da edge function
      if (response.error) {
        console.error('❌ Erro da edge function:', response.error);

        // Melhor diagnóstico do erro
        if (response.error.message?.includes('Edge Function returned a non-2xx status code')) {
          // Se temos dados de erro na resposta, usar essa informação
          if (response.data && typeof response.data === 'object') {
            throw new Error(`Servidor retornou erro: ${response.data.error || response.data.message || 'Erro interno'}`);
          }
          throw new Error('Erro interno no servidor de email. Verifique as configurações da API key do Resend.');
        }

        throw new Error(`Erro no envio: ${response.error.message}`);
      }

      // Verificar resposta de sucesso
      if (!response.data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (!response.data.success) {
        console.error('❌ Falha reportada pela edge function:', response.data);
        throw new Error(response.data.error || response.data.message || 'Erro desconhecido no servidor');
      }

      console.log('✅ PDFs enviados com sucesso!');

      return {
        success: true,
        message: `PDFs enviados com sucesso para ${configs.EMAIL_DESTINO}`,
        messageId: response.data.messageId
      };

    } catch (error: any) {
      console.error('❌ Erro no envio de PDFs:', error);
      console.error('📚 Stack trace completo:', error.stack);

      // Tratamento de erros específicos
      let errorMessage = 'Erro desconhecido no envio de PDFs';

      if (error.message?.includes('Chave API do Resend')) {
        errorMessage = 'Chave API do Resend não configurada no sistema. Entre em contato com o administrador.';
      } else if (error.message?.includes('Email de destino')) {
        errorMessage = 'Email de destino não configurado no sistema. Entre em contato com o administrador.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
      } else if (error.message?.includes('non-2xx status code')) {
        errorMessage = 'Erro interno no servidor de email. Verifique as configurações da API key do Resend no painel do Supabase.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }
  
  private static validarPayload(payload: EmailPayload): void {
    console.log('🔍 Validando payload...');

    if (!payload.clientData) {
      throw new Error('Dados do cliente são obrigatórios');
    }

    if (!payload.fichaData) {
      throw new Error('Dados da negociação são obrigatórios');
    }

    if (!payload.pdfData1 || !payload.pdfData2) {
      throw new Error('PDFs são obrigatórios para o envio');
    }

    if (!payload.clientData.nome) {
      throw new Error('Nome do cliente é obrigatório');
    }

    console.log('📊 Informações dos PDFs:', {
      pdf1_size: payload.pdfData1.length,
      pdf2_size: payload.pdfData2.length,
      pdf1_starts_with: payload.pdfData1.substring(0, 20),
      pdf2_starts_with: payload.pdfData2.substring(0, 20)
    });

    // Validar se os PDFs não estão vazios (devem ter conteúdo base64 válido)
    const minPdfSize = 1000; // Tamanho mínimo esperado para um PDF válido

    if (payload.pdfData1.length < minPdfSize) {
      throw new Error(`PDF de cadastro muito pequeno: ${payload.pdfData1.length} bytes (mínimo: ${minPdfSize})`);
    }

    if (payload.pdfData2.length < minPdfSize) {
      throw new Error(`PDF de negociação muito pequeno: ${payload.pdfData2.length} bytes (mínimo: ${minPdfSize})`);
    }

    // Validar se é base64 válido
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(payload.pdfData1)) {
      throw new Error('PDF de cadastro não é um base64 válido');
    }

    if (!base64Pattern.test(payload.pdfData2)) {
      throw new Error('PDF de negociação não é um base64 válido');
    }

    console.log('✅ Payload validado com sucesso');
  }
}

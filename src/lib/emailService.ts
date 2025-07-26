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
  static async enviarPDFs(payload: EmailPayload): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('🚀 Iniciando envio de PDFs via email...');
      
      // Validar dados antes do envio
      this.validarPayload(payload);
      
      // Buscar configurações necessárias do Supabase
      console.log('🔍 Buscando configurações do sistema...');
      const configs = await ConfigService.getConfigs([
        'RESEND_API_KEY',
        'EMAIL_DESTINO',
        'EMAIL_REMETENTE'
      ]);
      
      if (!configs.RESEND_API_KEY) {
        throw new Error('Chave API do Resend não configurada no sistema. Entre em contato com o administrador.');
      }
      
      if (!configs.EMAIL_DESTINO) {
        throw new Error('Email de destino não configurado no sistema. Entre em contato com o administrador.');
      }
      
      console.log('✅ Configurações carregadas com sucesso');
      
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
      
      console.log('📨 Resposta da edge function:', response);
      
      // Verificar erros da edge function
      if (response.error) {
        console.error('❌ Erro da edge function:', response.error);
        throw new Error(`Erro no envio: ${response.error.message}`);
      }
      
      // Verificar resposta de sucesso
      if (!response.data) {
        throw new Error('Resposta vazia da edge function');
      }
      
      if (!response.data.success) {
        console.error('❌ Falha reportada pela edge function:', response.data);
        throw new Error(response.data.error || 'Erro desconhecido no servidor');
      }
      
      console.log('✅ PDFs enviados com sucesso!');
      
      return {
        success: true,
        message: `PDFs enviados com sucesso para ${configs.EMAIL_DESTINO}`,
        messageId: response.data.messageId
      };
      
    } catch (error: any) {
      console.error('❌ Erro no envio de PDFs:', error);
      
      // Tratamento de erros específicos
      let errorMessage = 'Erro desconhecido no envio de PDFs';
      
      if (error.message?.includes('Chave API do Resend')) {
        errorMessage = 'Chave API do Resend não configurada no sistema. Entre em contato com o administrador.';
      } else if (error.message?.includes('Email de destino')) {
        errorMessage = 'Email de destino não configurado no sistema. Entre em contato com o administrador.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
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
    
    // Validar se os PDFs não estão vazios (devem ter conteúdo base64 válido)
    const minPdfSize = 1000; // Tamanho mínimo esperado para um PDF válido
    
    if (payload.pdfData1.length < minPdfSize) {
      throw new Error('PDF de cadastro parece estar vazio ou corrompido');
    }
    
    if (payload.pdfData2.length < minPdfSize) {
      throw new Error('PDF de negociação parece estar vazio ou corrompido');
    }
    
    console.log('✅ Payload validado com sucesso');
  }
}
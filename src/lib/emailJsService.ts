import emailjs from '@emailjs/browser';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';
import { PDFGenerator } from './pdfGenerator';
import { ConfigService } from './configService';

export interface EmailJsPayload {
  clientData: DadosCliente;
  fichaData: DadosNegociacao;
}

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  destinationEmail: string;
  fromEmail?: string;
}

export class EmailJsService {
  private static config: EmailJsConfig = {
    serviceId: "service_ldi1oub",
    templateId: "template_gavn8gt",
    publicKey: "220ao3TEOhWHfxHtM",
    destinationEmail: "seuemail@exemplo.com",
    fromEmail: "noreply@gavresorts.com"
  };

  static async init(config?: Partial<EmailJsConfig>): Promise<void> {
    try {
      // Tentar carregar configurações do Supabase
      console.log('🔍 Carregando configurações do EmailJS...');
      const configs = await ConfigService.getConfigs([
        'EMAILJS_SERVICE_ID',
        'EMAILJS_TEMPLATE_ID',
        'EMAILJS_PUBLIC_KEY',
        'EMAILJS_DESTINATION_EMAIL',
        'EMAILJS_FROM_EMAIL'
      ]);

      // Aplicar configurações do Supabase se disponíveis
      if (configs.EMAILJS_SERVICE_ID) this.config.serviceId = configs.EMAILJS_SERVICE_ID;
      if (configs.EMAILJS_TEMPLATE_ID) this.config.templateId = configs.EMAILJS_TEMPLATE_ID;
      if (configs.EMAILJS_PUBLIC_KEY) this.config.publicKey = configs.EMAILJS_PUBLIC_KEY;
      if (configs.EMAILJS_DESTINATION_EMAIL) this.config.destinationEmail = configs.EMAILJS_DESTINATION_EMAIL;
      if (configs.EMAILJS_FROM_EMAIL) this.config.fromEmail = configs.EMAILJS_FROM_EMAIL;

      console.log('✅ Configurações do EmailJS carregadas');
    } catch (error) {
      console.warn('⚠️ Falha ao carregar configurações do Supabase, usando valores padrão:', error);
    }

    // Aplicar configurações passadas como parâmetro (têm prioridade)
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Inicializar EmailJS
    emailjs.init(this.config.publicKey);
    console.log('🚀 EmailJS inicializado com sucesso');
  }

  static async enviarFichaPorEmail(payload: EmailJsPayload): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('🚀 Iniciando envio de ficha por email via EmailJS...');
      
      // Validar dados antes do envio
      this.validarPayload(payload);
      
      // Gerar PDFs como data URI
      console.log('📄 Gerando PDFs...');
      const pdfCadastro = PDFGenerator.gerarPDFCadastroCliente(payload.clientData);
      const pdfNegociacao = PDFGenerator.gerarPDFNegociacao(payload.clientData, payload.fichaData);
      
      // Preparar dados para o template do EmailJS
      const templateParams = {
        to_name: payload.clientData.nome || "Cliente",
        to_email: this.config.destinationEmail,
        from_email: this.config.fromEmail,
        client_name: payload.clientData.nome,
        client_cpf: payload.clientData.cpf,
        client_phone: payload.clientData.telefone,
        closer: payload.fichaData.closer || 'Não informado',
        liner: payload.fichaData.liner || 'Não informado',
        tipo_venda: payload.fichaData.tipoVenda || 'Não informado',
        message: `Segue em anexo a ficha de negociação de cota para o cliente ${payload.clientData.nome}.`,
        pdf_cadastro: pdfCadastro,
        pdf_negociacao: pdfNegociacao,
        attachment_name_1: `Cadastro_${payload.clientData.nome?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        attachment_name_2: `Negociacao_${payload.clientData.nome?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      };

      console.log('📧 Enviando email via EmailJS...');
      
      // Enviar email usando EmailJS
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('✅ Email enviado com sucesso:', response);

      return {
        success: true,
        message: `Ficha enviada com sucesso para ${this.config.destinationEmail}`,
        messageId: response.text
      };

    } catch (error: any) {
      console.error('❌ Erro no envio da ficha:', error);
      
      let errorMessage = 'Erro desconhecido no envio da ficha';
      
      if (error.text) {
        errorMessage = `Erro do EmailJS: ${error.text}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  private static validarPayload(payload: EmailJsPayload): void {
    if (!payload.clientData) {
      throw new Error('Dados do cliente são obrigatórios');
    }
    
    if (!payload.fichaData) {
      throw new Error('Dados da negociação são obrigatórios');
    }
    
    if (!payload.clientData.nome) {
      throw new Error('Nome do cliente é obrigatório');
    }
    
    console.log('✅ Payload validado com sucesso');
  }

  static updateConfig(newConfig: Partial<EmailJsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.publicKey) {
      emailjs.init(this.config.publicKey);
    }
  }

  static getConfig(): EmailJsConfig {
    return { ...this.config };
  }
}

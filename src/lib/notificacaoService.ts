import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export interface NotificacaoConfig {
  whatsappAdmin: string;
  whatsappCliente?: string;
  emailAdmin: string;
  telegramBot?: string;
  telegramChat?: string;
}

export interface NotificacaoResult {
  success: boolean;
  message: string;
  canaisUsados: string[];
  errors: string[];
}

export class NotificacaoService {
  private static readonly CONFIG_PADRAO: NotificacaoConfig = {
    whatsappAdmin: '5511999999999', // Número do administrador
    emailAdmin: 'admudrive2025@gavresorts.com.br',
    // telegramBot e telegramChat podem ser configurados se necessário
  };

  // Notificação principal quando o email automático falha
  static async notificarFalhaEmail(
    clientData: DadosCliente,
    fichaData: DadosNegociacao,
    erroDetalhes?: string,
    config?: Partial<NotificacaoConfig>
  ): Promise<NotificacaoResult> {
    const configFinal = { ...this.CONFIG_PADRAO, ...config };
    const canaisUsados: string[] = [];
    const errors: string[] = [];
    
    try {
      console.log('📢 Iniciando notificação de falha no email automático...');
      
      // 1. WhatsApp do Administrador
      try {
        const resultWhatsApp = await this.enviarWhatsAppAdmin(clientData, fichaData, erroDetalhes, configFinal);
        if (resultWhatsApp.success) {
          canaisUsados.push('WhatsApp Admin');
        } else {
          errors.push(`WhatsApp Admin: ${resultWhatsApp.message}`);
        }
      } catch (error: any) {
        errors.push(`WhatsApp Admin: ${error.message}`);
      }
      
      // 2. WhatsApp do Cliente (se telefone disponível)
      if (clientData.telefone) {
        try {
          const resultWhatsAppCliente = await this.enviarWhatsAppCliente(clientData, configFinal);
          if (resultWhatsAppCliente.success) {
            canaisUsados.push('WhatsApp Cliente');
          } else {
            errors.push(`WhatsApp Cliente: ${resultWhatsAppCliente.message}`);
          }
        } catch (error: any) {
          errors.push(`WhatsApp Cliente: ${error.message}`);
        }
      }
      
      // 3. SMS (caso WhatsApp não funcione)
      if (clientData.telefone) {
        try {
          const resultSMS = await this.enviarSMSCliente(clientData);
          if (resultSMS.success) {
            canaisUsados.push('SMS Cliente');
          } else {
            errors.push(`SMS: ${resultSMS.message}`);
          }
        } catch (error: any) {
          errors.push(`SMS: ${error.message}`);
        }
      }
      
      return {
        success: canaisUsados.length > 0,
        message: `Notificações enviadas via: ${canaisUsados.join(', ')}`,
        canaisUsados,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ Erro no sistema de notificação:', error);
      return {
        success: false,
        message: `Erro no sistema de notificação: ${error.message}`,
        canaisUsados,
        errors: [error.message]
      };
    }
  }

  // WhatsApp para o administrador
  private static async enviarWhatsAppAdmin(
    clientData: DadosCliente,
    fichaData: DadosNegociacao,
    erroDetalhes?: string,
    config: NotificacaoConfig = this.CONFIG_PADRAO
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Enviando WhatsApp para administrador...');
      
      const mensagem = encodeURIComponent(`
🚨 *ALERTA: FALHA NO ENVIO AUTOMÁTICO*

🏖️ *GAV RESORTS - SISTEMA DE FICHAS*

⚠️ *PROBLEMA:* O sistema automático de email falhou

📋 *DADOS DO CLIENTE:*
• Nome: ${clientData.nome || 'Não informado'}
• CPF: ${clientData.cpf || 'Não informado'}
• Telefone: ${clientData.telefone || 'Não informado'}
• Email: ${clientData.email || 'Não informado'}

🤝 *DADOS DA NEGOCIAÇÃO:*
• Liner: ${fichaData.liner || 'Não informado'}
• Closer: ${fichaData.closer || 'Não informado'}
• Tipo de Venda: ${fichaData.tipoVenda || 'Não informado'}

❌ *ERRO TÉCNICO:*
${erroDetalhes || 'Erro não especificado'}

🔧 *AÇÃO NECESSÁRIA:*
1. Os PDFs foram gerados no sistema do usuário
2. Verificar configurações do email automático
3. Solicitar reenvio manual se necessário

📧 *Email destino:* admudrive2025@gavresorts.com.br

🕒 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}

*Sistema:* Ficha de Negociação V2 - GAV Resorts
      `);
      
      const whatsappUrl = `https://wa.me/${config.whatsappAdmin}?text=${mensagem}`;
      
      // Abrir WhatsApp em nova aba
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        message: 'WhatsApp do administrador aberto com sucesso'
      };
      
    } catch (error: any) {
      console.error('❌ Erro no WhatsApp admin:', error);
      return {
        success: false,
        message: `Erro no WhatsApp admin: ${error.message}`
      };
    }
  }

  // WhatsApp para o cliente
  private static async enviarWhatsAppCliente(
    clientData: DadosCliente,
    config: NotificacaoConfig = this.CONFIG_PADRAO
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Enviando WhatsApp para cliente...');
      
      // Extrair apenas os números do telefone
      const telefone = clientData.telefone?.replace(/\D/g, '') || '';
      
      if (!telefone || telefone.length < 10) {
        throw new Error('Telefone inválido ou não informado');
      }
      
      // Garantir que tem código do país (55 para Brasil)
      const telefoneCompleto = telefone.startsWith('55') ? telefone : `55${telefone}`;
      
      const mensagem = encodeURIComponent(`
🏖️ *GAV RESORTS - CONFIRMAÇÃO*

Olá, ${clientData.nome}! 

✅ Sua ficha de negociação foi processada com sucesso!

📋 *Seus dados foram registrados:*
• Nome: ${clientData.nome}
• CPF: ${clientData.cpf || 'Não informado'}
• Email: ${clientData.email || 'Não informado'}

📧 *Próximos passos:*
• Nosso sistema está processando sua ficha
• Em breve você receberá um contato da nossa equipe
• Todos os documentos serão enviados por email

💼 *Dúvidas?*
Entre em contato conosco através deste WhatsApp ou pelo telefone da central.

*Obrigado por escolher a GAV Resorts!* 🌴

🕒 ${new Date().toLocaleString('pt-BR')}
      `);
      
      const whatsappUrl = `https://wa.me/${telefoneCompleto}?text=${mensagem}`;
      
      // Abrir WhatsApp em nova aba
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        message: 'WhatsApp do cliente aberto com sucesso'
      };
      
    } catch (error: any) {
      console.error('❌ Erro no WhatsApp cliente:', error);
      return {
        success: false,
        message: `Erro no WhatsApp cliente: ${error.message}`
      };
    }
  }

  // SMS para o cliente (simulado via API de SMS)
  private static async enviarSMSCliente(
    clientData: DadosCliente
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Simulando envio de SMS para cliente...');
      
      // Em um ambiente real, você integraria com uma API de SMS como Twilio, etc.
      // Por agora, vamos simular
      
      const telefone = clientData.telefone?.replace(/\D/g, '') || '';
      
      if (!telefone || telefone.length < 10) {
        throw new Error('Telefone inválido para SMS');
      }
      
      const mensagemSMS = `GAV Resorts: Ola ${clientData.nome}, sua ficha de negociacao foi processada! Aguarde contato da nossa equipe. Central: (11) 1234-5678`;
      
      // Simulação: mostrar o que seria enviado
      console.log(`📱 SMS simulado para ${telefone}:`, mensagemSMS);
      
      // Em produção, aqui você faria a chamada para a API de SMS
      // const resultSMS = await smsAPI.send(telefone, mensagemSMS);
      
      return {
        success: true,
        message: `SMS simulado enviado para ${telefone}`
      };
      
    } catch (error: any) {
      console.error('❌ Erro no SMS:', error);
      return {
        success: false,
        message: `Erro no SMS: ${error.message}`
      };
    }
  }

  // Notificação de sucesso (quando tudo funciona)
  static async notificarSucesso(
    clientData: DadosCliente,
    fichaData: DadosNegociacao,
    messageId?: string
  ): Promise<NotificacaoResult> {
    const canaisUsados: string[] = [];
    const errors: string[] = [];
    
    try {
      console.log('🎉 Enviando notificações de sucesso...');
      
      // WhatsApp para o cliente confirmando sucesso
      if (clientData.telefone) {
        try {
          const result = await this.enviarWhatsAppSucesso(clientData, messageId);
          if (result.success) {
            canaisUsados.push('WhatsApp Sucesso');
          } else {
            errors.push(`WhatsApp Sucesso: ${result.message}`);
          }
        } catch (error: any) {
          errors.push(`WhatsApp Sucesso: ${error.message}`);
        }
      }
      
      return {
        success: canaisUsados.length > 0,
        message: `Notificações de sucesso enviadas via: ${canaisUsados.join(', ')}`,
        canaisUsados,
        errors
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Erro nas notificações de sucesso: ${error.message}`,
        canaisUsados,
        errors: [error.message]
      };
    }
  }

  // WhatsApp de confirmação de sucesso
  private static async enviarWhatsAppSucesso(
    clientData: DadosCliente,
    messageId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const telefone = clientData.telefone?.replace(/\D/g, '') || '';
      const telefoneCompleto = telefone.startsWith('55') ? telefone : `55${telefone}`;
      
      const mensagem = encodeURIComponent(`
🎉 *SUCESSO - GAV RESORTS*

Ótimas notícias, ${clientData.nome}!

✅ *Sua ficha foi enviada com sucesso!*

📧 *Confirmação:*
• Documentos enviados por email
• Processamento concluído
${messageId ? `• ID de confirmação: ${messageId}` : ''}

📋 *Próximos passos:*
• Nossa equipe analisará sua ficha
• Você receberá um retorno em breve
• Acompanhe seu email cadastrado

💬 *Dúvidas?*
Responda este WhatsApp ou ligue para nossa central.

*Muito obrigado por escolher a GAV Resorts!* 🏖️

🕒 ${new Date().toLocaleString('pt-BR')}
      `);
      
      const whatsappUrl = `https://wa.me/${telefoneCompleto}?text=${mensagem}`;
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        message: 'WhatsApp de sucesso enviado'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no WhatsApp de sucesso: ${error.message}`
      };
    }
  }

  // Função para testar o sistema de notificação
  static async testarNotificacao(clientData: DadosCliente): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testando sistema de notificação...');
      
      const dadosTesteFicha: DadosNegociacao = {
        liner: 'Teste Liner',
        closer: 'Teste Closer',
        tipoVenda: 'Teste',
        parcelasPagasSala: [],
        contratos: [],
        informacoesPagamento: []
      };
      
      const resultado = await this.notificarFalhaEmail(
        clientData,
        dadosTesteFicha,
        'Teste do sistema de notificação - ignore esta mensagem'
      );
      
      return {
        success: resultado.success,
        message: `Teste concluído. Canais: ${resultado.canaisUsados.join(', ')}. Erros: ${resultado.errors.join(', ')}`
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no teste: ${error.message}`
      };
    }
  }
}

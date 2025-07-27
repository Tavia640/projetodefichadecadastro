import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export interface EmailAlternativoOptions {
  clientData: DadosCliente;
  fichaData: DadosNegociacao;
  pdfBlob1: Blob;
  pdfBlob2: Blob;
}

export class EmailAlternativo {
  // Método 1: mailto com dados no corpo do email
  static async enviarViaMailto(options: EmailAlternativoOptions): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Tentando envio via mailto...');
      
      const { clientData, fichaData } = options;
      
      // Preparar o corpo do email
      const subject = encodeURIComponent(`Nova Ficha de Negociação - ${clientData.nome}`);
      const body = encodeURIComponent(`
Olá! 

Uma nova ficha de negociação foi preenchida:

📋 DADOS DO CLIENTE:
Nome: ${clientData.nome || 'Não informado'}
CPF: ${clientData.cpf || 'N��o informado'}
Email: ${clientData.email || 'Não informado'}
Telefone: ${clientData.telefone || 'Não informado'}

🤝 DADOS DA NEGOCIAÇÃO:
Liner: ${fichaData.liner || 'Não informado'}
Closer: ${fichaData.closer || 'Não informado'}
Tipo de Venda: ${fichaData.tipoVenda || 'Não informado'}

⚠️ ATENÇÃO: Os PDFs foram baixados automaticamente em seu computador. 
Por favor, anexe os arquivos PDF a este email antes de enviar.

📎 Arquivos para anexar:
• Ficha_Cadastro_${clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_')}_[data].pdf
• Ficha_Negociacao_${clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_')}_[data].pdf

Sistema: GAV Resorts - Ficha de Negociação
Data: ${new Date().toLocaleString('pt-BR')}
      `);
      
      // Criar link mailto
      const mailtoUrl = `mailto:admudrive2025@gavresorts.com.br?subject=${subject}&body=${body}`;
      
      // Tentar abrir o cliente de email padrão
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.click();
      
      return {
        success: true,
        message: 'Cliente de email aberto. Complete o envio anexando os PDFs baixados.'
      };
      
    } catch (error: any) {
      console.error('❌ Erro no mailto:', error);
      return {
        success: false,
        message: `Erro ao abrir cliente de email: ${error.message}`
      };
    }
  }
  
  // Método 2: Compartilhamento via Web Share API (para dispositivos móveis)
  static async enviarViaWebShare(options: EmailAlternativoOptions): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Tentando compartilhamento via Web Share API...');
      
      if (!navigator.share) {
        throw new Error('Web Share API não suportada neste navegador');
      }
      
      const { clientData, fichaData } = options;
      
      const shareData = {
        title: `Ficha de Negociação - ${clientData.nome}`,
        text: `
📋 Nova ficha de negociação para ${clientData.nome}

Cliente: ${clientData.nome || 'Não informado'}
CPF: ${clientData.cpf || 'Não informado'}
Liner: ${fichaData.liner || 'Não informado'}
Closer: ${fichaData.closer || 'Não informado'}

⚠️ PDFs foram baixados. Anexe-os ao envio.
        `,
        url: window.location.href
      };
      
      await navigator.share(shareData);
      
      return {
        success: true,
        message: 'Compartilhamento iniciado via Web Share API'
      };
      
    } catch (error: any) {
      console.error('❌ Erro no Web Share:', error);
      return {
        success: false,
        message: `Erro no compartilhamento: ${error.message}`
      };
    }
  }
  
  // Método 3: Criar um link de download com instruções
  static async criarLinkComInstrucoes(options: EmailAlternativoOptions): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
    try {
      console.log('🔗 Criando link com instruções...');
      
      const { clientData, fichaData } = options;
      
      // Criar um arquivo de texto com instruções
      const instrucoes = `
INSTRUÇÕES PARA ENVIO DA FICHA DE NEGOCIAÇÃO
============================================

📧 Email de destino: admudrive2025@gavresorts.com.br

📋 DADOS DO CLIENTE:
Nome: ${clientData.nome || 'Não informado'}
CPF: ${clientData.cpf || 'Não informado'}
Email: ${clientData.email || 'Não informado'}
Telefone: ${clientData.telefone || 'Não informado'}

🤝 DADOS DA NEGOCIAÇÃO:
Liner: ${fichaData.liner || 'Não informado'}
Closer: ${fichaData.closer || 'Não informado'}
Tipo de Venda: ${fichaData.tipoVenda || 'Não informado'}

📎 ARQUIVOS PARA ANEXAR:
• Ficha_Cadastro_${clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_')}_[data].pdf
• Ficha_Negociacao_${clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_')}_[data].pdf

✅ PASSOS PARA ENVIO:
1. Os PDFs foram baixados automaticamente
2. Abra seu cliente de email (Gmail, Outlook, etc.)
3. Crie um novo email para: admudrive2025@gavresorts.com.br
4. Assunto: "Nova Ficha de Negociação - ${clientData.nome}"
5. Anexe os 2 arquivos PDF baixados
6. Cole estas informações no corpo do email
7. Envie o email

Data de geração: ${new Date().toLocaleString('pt-BR')}
Sistema: GAV Resorts - Ficha de Negociação V2
      `;
      
      // Criar e baixar arquivo de instruções
      const blob = new Blob([instrucoes], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Instrucoes_Envio_${clientData.nome?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
      link.click();
      
      return {
        success: true,
        message: 'Arquivo de instruções baixado com sucesso',
        downloadUrl: url
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao criar instruções:', error);
      return {
        success: false,
        message: `Erro ao criar instruções: ${error.message}`
      };
    }
  }
  
  // Método 4: Backup com notificação WhatsApp
  static async notificarViaWhatsApp(clientData: DadosCliente): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Preparando notificação via WhatsApp...');
      
      const numeroAdmin = '5511999999999'; // Número do administrador (exemplo)
      const mensagem = encodeURIComponent(`
🏖️ *GAV RESORTS - NOVA FICHA*

📋 Cliente: ${clientData.nome || 'Não informado'}
📞 Telefone: ${clientData.telefone || 'Não informado'}
📧 Email: ${clientData.email || 'Não informado'}

⚠️ *ATENÇÃO:* Os PDFs foram gerados mas não puderam ser enviados automaticamente por email. 

Por favor, verifique o sistema ou solicite o reenvio manual.

🕒 ${new Date().toLocaleString('pt-BR')}
      `);
      
      const whatsappUrl = `https://wa.me/${numeroAdmin}?text=${mensagem}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      return {
        success: true,
        message: 'Notificação via WhatsApp enviada para administrador'
      };
      
    } catch (error: any) {
      console.error('❌ Erro no WhatsApp:', error);
      return {
        success: false,
        message: `Erro na notificação WhatsApp: ${error.message}`
      };
    }
  }
  
  // Método principal que tenta várias alternativas
  static async enviarComAlternativas(options: EmailAlternativoOptions): Promise<{ success: boolean; message: string; tentativas: string[] }> {
    const tentativas: string[] = [];
    
    try {
      console.log('🔄 Iniciando envio com múltiplas alternativas...');
      
      // Tentativa 1: mailto
      console.log('📧 Tentativa 1: mailto...');
      const resultMailto = await this.enviarViaMailto(options);
      tentativas.push(`Mailto: ${resultMailto.success ? '✅' : '❌'} - ${resultMailto.message}`);
      
      if (resultMailto.success) {
        return {
          success: true,
          message: 'Email preparado via cliente padrão',
          tentativas
        };
      }
      
      // Tentativa 2: Web Share API (se disponível)
      if (navigator.share) {
        console.log('📱 Tentativa 2: Web Share API...');
        const resultShare = await this.enviarViaWebShare(options);
        tentativas.push(`Web Share: ${resultShare.success ? '✅' : '❌'} - ${resultShare.message}`);
        
        if (resultShare.success) {
          return {
            success: true,
            message: 'Compartilhamento iniciado',
            tentativas
          };
        }
      }
      
      // Tentativa 3: Criar instruções
      console.log('🔗 Tentativa 3: Arquivo de instruções...');
      const resultInstrucoes = await this.criarLinkComInstrucoes(options);
      tentativas.push(`Instruções: ${resultInstrucoes.success ? '✅' : '❌'} - ${resultInstrucoes.message}`);
      
      // Tentativa 4: Notificação WhatsApp (como backup)
      console.log('📱 Tentativa 4: Notificação WhatsApp...');
      const resultWhatsApp = await this.notificarViaWhatsApp(options.clientData);
      tentativas.push(`WhatsApp: ${resultWhatsApp.success ? '✅' : '❌'} - ${resultWhatsApp.message}`);
      
      return {
        success: true,
        message: 'Múltiplas alternativas executadas. Verifique as instruções baixadas.',
        tentativas
      };
      
    } catch (error: any) {
      console.error('❌ Erro nas alternativas:', error);
      tentativas.push(`Erro geral: ${error.message}`);
      
      return {
        success: false,
        message: `Todas as alternativas falharam: ${error.message}`,
        tentativas
      };
    }
  }
}

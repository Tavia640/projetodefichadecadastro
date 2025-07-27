import { supabase } from '@/integrations/supabase/client';
import { DadosCliente, DadosNegociacao, PDFGenerator } from './pdfGenerator';

export interface ResultadoEmail {
  sucesso: boolean;
  mensagem: string;
  detalhes?: string;
}

export class EmailSimples {
  // Configurações fixas para evitar problemas
  private static readonly EMAIL_DESTINO = 'admudrive2025@gavresorts.com.br';
  private static readonly EMAIL_REMETENTE = 'GAV Resorts <onboarding@resend.dev>';
  private static readonly API_KEY = 're_SmQE7h9x_8gJ7nxVBZiv81R4YWEamyVTs';

  // Função principal - simples e direta
  static async enviarPDFs(
    dadosCliente: DadosCliente, 
    dadosNegociacao: DadosNegociacao
  ): Promise<ResultadoEmail> {
    
    console.log('📧 Iniciando envio simples de PDFs...');

    try {
      // 1. Validar dados básicos
      if (!dadosCliente.nome) {
        return {
          sucesso: false,
          mensagem: 'Nome do cliente é obrigatório'
        };
      }

      // 2. Gerar PDFs
      console.log('📄 Gerando PDFs...');
      const pdf1Base64 = PDFGenerator.gerarPDFCadastroClienteBase64(dadosCliente);
      const pdf2Base64 = PDFGenerator.gerarPDFNegociacaoBase64(dadosCliente, dadosNegociacao);

      if (!pdf1Base64 || !pdf2Base64) {
        return {
          sucesso: false,
          mensagem: 'Erro ao gerar PDFs'
        };
      }

      // 3. Preparar dados para envio
      const nomeArquivo = dadosCliente.nome.replace(/[^a-zA-Z0-9]/g, '_');
      const dataHoje = new Date().toISOString().slice(0, 10);

      const dadosEmail = {
        from: this.EMAIL_REMETENTE,
        to: this.EMAIL_DESTINO,
        subject: `Nova Ficha de Negociação - ${dadosCliente.nome}`,
        html: this.criarCorpoEmail(dadosCliente, dadosNegociacao),
        attachments: [
          {
            filename: `Cadastro_${nomeArquivo}_${dataHoje}.pdf`,
            content: pdf1Base64,
            encoding: 'base64',
            contentType: 'application/pdf'
          },
          {
            filename: `Negociacao_${nomeArquivo}_${dataHoje}.pdf`,
            content: pdf2Base64,
            encoding: 'base64',
            contentType: 'application/pdf'
          }
        ]
      };

      // 4. Enviar via Supabase Edge Function
      console.log('📨 Enviando email...');
      const { data, error } = await supabase.functions.invoke('enviar-email-simples', {
        body: {
          emailData: dadosEmail,
          apiKey: this.API_KEY
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        return {
          sucesso: false,
          mensagem: 'Erro no servidor de email',
          detalhes: error.message
        };
      }

      if (!data || !data.success) {
        console.error('❌ Falha no envio:', data);
        return {
          sucesso: false,
          mensagem: data?.error || 'Falha no envio do email',
          detalhes: JSON.stringify(data)
        };
      }

      console.log('✅ Email enviado com sucesso!');
      return {
        sucesso: true,
        mensagem: `Email enviado com sucesso para ${this.EMAIL_DESTINO}`,
        detalhes: data.messageId
      };

    } catch (error: any) {
      console.error('❌ Erro geral:', error);
      return {
        sucesso: false,
        mensagem: 'Erro interno do sistema',
        detalhes: error.message
      };
    }
  }

  // Criar corpo do email
  private static criarCorpoEmail(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nova Ficha de Negociação</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="margin: 0;">🏖️ GAV RESORTS</h1>
          <p style="margin: 10px 0 0 0;">Nova Ficha de Negociação</p>
        </div>

        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">👤 Dados do Cliente</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nome:</td>
              <td style="padding: 8px 0;">${dadosCliente.nome || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">CPF:</td>
              <td style="padding: 8px 0;">${dadosCliente.cpf || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${dadosCliente.email || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px 0;">${dadosCliente.telefone || 'Não informado'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h2 style="color: #856404; margin-top: 0;">🤝 Dados da Negociação</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Liner:</td>
              <td style="padding: 8px 0;">${dadosNegociacao.liner || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Closer:</td>
              <td style="padding: 8px 0;">${dadosNegociacao.closer || 'Não informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tipo de Venda:</td>
              <td style="padding: 8px 0;">${dadosNegociacao.tipoVenda || 'Não informado'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #d1ecf1; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #0c5460; margin-top: 0;">📎 Documentos Anexados</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Ficha de Cadastro do Cliente</li>
            <li>Ficha de Negociação Completa</li>
          </ul>
          <p style="margin: 15px 0 0 0; color: #0c5460; font-weight: bold;">
            ✅ Total: 2 documentos PDF anexados
          </p>
        </div>

        <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #155724; font-weight: bold;">
            ✅ Processamento Concluído com Sucesso!
          </p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">
            📧 Email gerado automaticamente pelo Sistema GAV Resorts<br>
            🕒 Data: ${new Date().toLocaleString('pt-BR')}<br>
            💻 Sistema Simplificado V2
          </p>
        </div>

      </body>
      </html>
    `;
  }

  // Função de teste
  static async testarSistema(): Promise<ResultadoEmail> {
    console.log('🧪 Testando sistema de email...');

    const dadosTestCliente: DadosCliente = {
      nome: 'Cliente Teste',
      cpf: '123.456.789-00',
      email: 'teste@exemplo.com',
      telefone: '(11) 99999-9999'
    };

    const dadosTestNegociacao: DadosNegociacao = {
      liner: 'Teste Liner',
      closer: 'Teste Closer',
      tipoVenda: 'teste',
      parcelasPagasSala: [],
      contratos: [],
      informacoesPagamento: []
    };

    return this.enviarPDFs(dadosTestCliente, dadosTestNegociacao);
  }

  // Baixar PDFs localmente (alternativa)
  static baixarPDFsLocal(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): void {
    try {
      console.log('💾 Baixando PDFs localmente...');

      const blob1 = PDFGenerator.gerarPDFCadastroClienteBlob(dadosCliente);
      const blob2 = PDFGenerator.gerarPDFNegociacaoBlob(dadosCliente, dadosNegociacao);

      const nomeArquivo = dadosCliente.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
      const dataHoje = new Date().toISOString().slice(0, 10);

      // Download PDF 1
      const url1 = URL.createObjectURL(blob1);
      const link1 = document.createElement('a');
      link1.href = url1;
      link1.download = `Cadastro_${nomeArquivo}_${dataHoje}.pdf`;
      link1.click();
      URL.revokeObjectURL(url1);

      // Download PDF 2 (com delay)
      setTimeout(() => {
        const url2 = URL.createObjectURL(blob2);
        const link2 = document.createElement('a');
        link2.href = url2;
        link2.download = `Negociacao_${nomeArquivo}_${dataHoje}.pdf`;
        link2.click();
        URL.revokeObjectURL(url2);
      }, 500);

      console.log('✅ PDFs baixados com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao baixar PDFs:', error);
      throw error;
    }
  }
}

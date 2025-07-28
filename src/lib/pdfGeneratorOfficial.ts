import jsPDF from 'jspdf';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export class PDFGeneratorOfficial {
  
  static gerarPDFCadastroOficial(dadosCliente: DadosCliente): Blob {
    console.log('🔍 Iniciando geração PDF Cadastro...');
    console.log('📊 Dados do cliente:', dadosCliente);

    if (!dadosCliente) {
      throw new Error('Dados do cliente não fornecidos para PDF de cadastro');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Configurações
    const margin = 15;
    const lineHeight = 6;
    let currentY = margin;

    // Função auxiliar para quebrar linha
    const nextLine = (lines = 1) => {
      currentY += lineHeight * lines;
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
    };

    // Função para desenhar caixa
    const drawBox = (x: number, y: number, w: number, h: number) => {
      pdf.rect(x, y, w, h);
    };

    // CABEÇALHO - Layout mais próximo ao original
    pdf.setFontSize(9);
    pdf.text('FORMULÁRIO', margin, currentY);
    pdf.text('Código: FOR.02.01.002', pageWidth - 65, currentY);
    nextLine();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FICHA DE CADASTRO DE CLIENTE', pageWidth/2, currentY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');

    pdf.setFontSize(9);
    pdf.text('Rev.: 24/07/2025 - Ver.02', pageWidth - 65, currentY);
    nextLine();
    pdf.text('Página: 1 de 2', pageWidth - 35, currentY);
    nextLine(2);

    // Linha divisória
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    nextLine(2);

    // DADOS DO CLIENTE
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO CLIENTE:', margin, currentY);
    nextLine(2);

    // Criar tabela para dados do cliente - estilo mais próximo ao original
    const tableWidth = pageWidth - 2 * margin;
    const rowHeight = 10;
    
    // Nome
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nome:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.nome || '', margin + 20, currentY + 6);
    nextLine(1.7);

    // CPF
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CPF:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.cpf || '', margin + 20, currentY + 6);
    nextLine(1.7);

    // RG, Órgão, UF
    const rgWidth = tableWidth * 0.5;
    const orgaoWidth = tableWidth * 0.25;
    const ufWidth = tableWidth * 0.25;

    drawBox(margin, currentY, rgWidth, rowHeight);
    drawBox(margin + rgWidth, currentY, orgaoWidth, rowHeight);
    drawBox(margin + rgWidth + orgaoWidth, currentY, ufWidth, rowHeight);

    pdf.setFont('helvetica', 'bold');
    pdf.text('RG:', margin + 2, currentY + 6);
    pdf.text('ÓRGÃO:', margin + rgWidth + 2, currentY + 6);
    pdf.text('UF:', margin + rgWidth + orgaoWidth + 2, currentY + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.rg || '', margin + 15, currentY + 6);
    pdf.text(dadosCliente.orgaoEmissor || '', margin + rgWidth + 25, currentY + 6);
    pdf.text(dadosCliente.estadoEmissor || '', margin + rgWidth + orgaoWidth + 15, currentY + 6);
    nextLine(1.7);

    // Profissão
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Profissão:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.profissao || '', margin + 30, currentY + 6);
    nextLine(1.7);

    // Estado Civil
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Estado Civil:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.estadoCivil || '', margin + 35, currentY + 6);
    nextLine(1.7);

    // E-mail
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('E-mail:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.email || '', margin + 25, currentY + 6);
    nextLine(1.7);

    // Telefone
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Telefone:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.telefone || '', margin + 30, currentY + 6);
    nextLine(2);

    // DADOS DO CÔNJUGE
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO CÔNJUGE:', margin, currentY);
    nextLine(2);

    // Nome do cônjuge
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nome:', margin + 2, currentY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dadosCliente.nomeConjuge || '', margin + 20, currentY + 6);
    nextLine(1.7);

    // CPF do cônjuge
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CPF:', margin + 2, currentY + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dadosCliente.cpfConjuge || '', margin + 15, currentY + 5);
    nextLine(1.5);

    // RG, Órgão, UF do cônjuge
    drawBox(margin, currentY, rgWidth, rowHeight);
    drawBox(margin + rgWidth, currentY, orgaoWidth, rowHeight);
    drawBox(margin + rgWidth + orgaoWidth, currentY, ufWidth, rowHeight);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('RG:', margin + 2, currentY + 5);
    pdf.text('ÓRGÃO:', margin + rgWidth + 2, currentY + 5);
    pdf.text('UF:', margin + rgWidth + orgaoWidth + 2, currentY + 5);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(dadosCliente.rgConjuge || '', margin + 10, currentY + 5);
    pdf.text(dadosCliente.orgaoEmissorConjuge || '', margin + rgWidth + 20, currentY + 5);
    pdf.text(dadosCliente.estadoEmissorConjuge || '', margin + rgWidth + orgaoWidth + 10, currentY + 5);
    nextLine(1.5);

    // Demais campos do cônjuge...
    const camposConjuge = [
      { label: 'Profissão:', valor: dadosCliente.profissaoConjuge },
      { label: 'Estado Civil:', valor: dadosCliente.estadoCivilConjuge },
      { label: 'E-mail:', valor: dadosCliente.emailConjuge },
      { label: 'Telefone:', valor: dadosCliente.telefoneConjuge }
    ];

    camposConjuge.forEach(campo => {
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'normal');
      pdf.text(campo.label, margin + 2, currentY + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(campo.valor || '', margin + 25, currentY + 5);
      nextLine(1.5);
    });

    nextLine();

    // ENDEREÇO
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENDEREÇO:', margin, currentY);
    nextLine(2);

    // Logradouro e Número
    const logradouroWidth = tableWidth * 0.7;
    const numeroWidth = tableWidth * 0.3;
    
    drawBox(margin, currentY, logradouroWidth, rowHeight);
    drawBox(margin + logradouroWidth, currentY, numeroWidth, rowHeight);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Logradouro:', margin + 2, currentY + 5);
    pdf.text('Nº:', margin + logradouroWidth + 2, currentY + 5);
    
    pdf.setFont('helvetica', 'bold');
    const enderecoCompleto = dadosCliente.logradouro || '';
    pdf.text(enderecoCompleto, margin + 25, currentY + 5);
    pdf.text(dadosCliente.numero || '', margin + logradouroWidth + 10, currentY + 5);
    nextLine(1.5);

    // Bairro
    drawBox(margin, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Bairro:', margin + 2, currentY + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dadosCliente.bairro || '', margin + 20, currentY + 5);
    nextLine(1.5);

    // Complemento e CEP
    const complementoWidth = tableWidth * 0.6;
    const cepWidth = tableWidth * 0.4;
    
    drawBox(margin, currentY, complementoWidth, rowHeight);
    drawBox(margin + complementoWidth, currentY, cepWidth, rowHeight);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('Complemento:', margin + 2, currentY + 5);
    pdf.text('CEP:', margin + complementoWidth + 2, currentY + 5);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(dadosCliente.complemento || '', margin + 30, currentY + 5);
    pdf.text(dadosCliente.cep || '', margin + complementoWidth + 15, currentY + 5);
    nextLine(1.5);

    // Cidade e UF
    const cidadeWidth = tableWidth * 0.7;
    const ufEnderecoWidth = tableWidth * 0.3;
    
    drawBox(margin, currentY, cidadeWidth, rowHeight);
    drawBox(margin + cidadeWidth, currentY, ufEnderecoWidth, rowHeight);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('Cidade:', margin + 2, currentY + 5);
    pdf.text('UF:', margin + cidadeWidth + 2, currentY + 5);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(dadosCliente.cidade || '', margin + 20, currentY + 5);
    pdf.text(dadosCliente.estado || '', margin + cidadeWidth + 10, currentY + 5);
    nextLine(3);

    // SALA DE VENDAS
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('SALA DE VENDAS:', margin, currentY);
    
    // Checkbox BEEBACK
    pdf.rect(margin + 90, currentY - 3, 3, 3);
    pdf.text('X', margin + 91, currentY - 1); // Marcado por padrão
    pdf.text('BEEBACK', margin + 95, currentY);
    nextLine(2);

    // Campos da sala de vendas
    const camposSala = [
      'LINER: ____',
      'EMPRESA (Liner): ',
      'CLOSER: ',
      'EMPRESA (Closer):',
      'PEP:',
      'EMPRESA (PEP): ',
      'LÍDER DE SALA: ___________________________________________________________________________________________',
      'SUB LÍDER DE SALA: ________________________________________________________________________________________'
    ];

    camposSala.forEach(campo => {
      pdf.text(campo, margin, currentY);
      nextLine();
    });

    console.log('✅ PDF de Cadastro gerado com sucesso');
    const blob = pdf.output('blob');
    console.log('📦 Blob de Cadastro criado:', blob.size, 'bytes');
    return blob;
  }

  static gerarPDFNegociacaoOficial(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): Blob {
    console.log('🔍 Iniciando geração PDF Negociação...');
    console.log('📊 Dados do cliente:', dadosCliente);
    console.log('📊 Dados da negociação:', dadosNegociacao);

    // Verificar se os dados essenciais existem
    if (!dadosCliente) {
      throw new Error('Dados do cliente não fornecidos');
    }
    if (!dadosNegociacao) {
      throw new Error('Dados da negociação não fornecidos');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    const margin = 15;
    const lineHeight = 6;
    let currentY = margin;

    const nextLine = (lines = 1) => {
      currentY += lineHeight * lines;
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
    };

    const drawBox = (x: number, y: number, w: number, h: number) => {
      pdf.rect(x, y, w, h);
    };

    // CABEÇALHO - Layout mais próximo ao original
    pdf.setFontSize(9);
    pdf.text('FORMULÁRIO', margin, currentY);
    pdf.text('Código: FOR.02.01.002', pageWidth - 65, currentY);
    nextLine();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FICHA DE NEGOCIAÇÃO DE COTA', pageWidth/2, currentY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');

    pdf.setFontSize(9);
    pdf.text('Rev.: 24/07/2025 - Ver.02', pageWidth - 65, currentY);
    nextLine();
    pdf.text('Página: 2 de 2', pageWidth - 35, currentY);
    nextLine(2);

    // Linha divisória
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    nextLine(2);

    // DADOS BÁSICOS
    pdf.setFontSize(10);
    pdf.text(`CLIENTE: ${dadosCliente.nome}`, margin, currentY);
    nextLine();
    pdf.text(`CPF: ${dadosCliente.cpf}`, margin, currentY);
    nextLine();
    pdf.text('SALA DE VENDAS: ', margin, currentY);
    nextLine(2);

    // TIPO DE VENDA - Checkboxes
    const tiposVenda = ['PADRÃO', 'SEMESTRAL', 'ANUAL', 'À VISTA', 'ATÉ 36x', 'LINEAR'];
    let xPos = margin;
    
    tiposVenda.forEach(tipo => {
      pdf.rect(xPos, currentY - 3, 3, 3);
      if (dadosNegociacao.tipoVenda?.toUpperCase() === tipo) {
        pdf.text('X', xPos + 0.5, currentY - 1);
      }
      pdf.text(tipo, xPos + 5, currentY);
      xPos += 30;
    });
    nextLine(3);

    // TABELA DE PARCELAS PAGAS EM SALA
    const tableY = currentY;
    const colWidths = [40, 35, 25, 40, 40];
    const headers = [
      'Tipo de Parcela Paga em Sala',
      'Valor Total Pago em Sala', 
      'Quantidade de cotas',
      'Valor distribuído para cada Unidade',
      'Forma de Pagamento'
    ];

    // Cabeçalho da tabela
    let xPos2 = margin;
    headers.forEach((header, i) => {
      drawBox(xPos2, currentY, colWidths[i], 8);
      pdf.setFontSize(8);
      pdf.text(header, xPos2 + 1, currentY + 5);
      xPos2 += colWidths[i];
    });
    nextLine(1.5);

    // Dados da tabela - com tratamento de dados seguro
    const parcelasPagasSala = dadosNegociacao.parcelasPagasSala || [];
    parcelasPagasSala.forEach(parcela => {
      xPos2 = margin;
      const valores = [
        parcela.tipo,
        `R$ ${parcela.valorTotal}`,
        parcela.quantidadeCotas,
        `R$ ${parcela.valorDistribuido}`,
        (parcela.formasPagamento || []).join(', ')
      ];
      
      valores.forEach((valor, i) => {
        drawBox(xPos2, currentY, colWidths[i], 6);
        pdf.setFontSize(8);
        pdf.text(valor || '', xPos2 + 1, currentY + 4);
        xPos2 += colWidths[i];
      });
      nextLine();
    });

    nextLine(2);

    // TABELA DE CONTRATOS
    pdf.setFontSize(10);
    pdf.text('Contratos:', margin, currentY);
    nextLine();

    const contratoHeaders = ['Contrato', 'Empreendimento', 'Torre/Bloco', 'Apt.', 'Cota', 'Vista da UH.', 'PCD', 'Valor'];
    const contratoWidths = [20, 35, 25, 15, 15, 20, 15, 25];

    // Cabeçalho contratos
    xPos2 = margin;
    contratoHeaders.forEach((header, i) => {
      drawBox(xPos2, currentY, contratoWidths[i], 8);
      pdf.setFontSize(8);
      pdf.text(header, xPos2 + 1, currentY + 5);
      xPos2 += contratoWidths[i];
    });
    nextLine(1.5);

    // Dados dos contratos - com tratamento de dados seguro
    const contratos = dadosNegociacao.contratos || [];
    contratos.forEach((contrato, index) => {
      xPos2 = margin;
      const contratoValues = [
        '( ) Físico ( ) Digital',
        contrato.empreendimento,
        contrato.torre,
        contrato.apartamento,
        contrato.cota,
        '( ) Sim ( ) Não',
        '( ) Sim ( ) Não', 
        `R$ ${contrato.valor}`
      ];
      
      contratoValues.forEach((valor, i) => {
        drawBox(xPos2, currentY, contratoWidths[i], 6);
        pdf.setFontSize(7);
        pdf.text(valor || '', xPos2 + 1, currentY + 4);
        xPos2 += contratoWidths[i];
      });
      nextLine();
    });

    nextLine(2);

    // TABELA DE PAGAMENTOS
    pdf.setFontSize(9);
    pdf.text('O financeiro descrito abaixo é referente a cada unidade separadamente.', margin, currentY);
    nextLine(2);

    const pagamentoHeaders = ['Tipo', 'Total', 'Qtd. Parcelas', 'Valor Parcela', 'Forma de Pag.', '1º Vencimento'];
    const pagamentoWidths = [30, 25, 25, 25, 25, 30];

    // Cabeçalho pagamentos
    xPos2 = margin;
    pagamentoHeaders.forEach((header, i) => {
      drawBox(xPos2, currentY, pagamentoWidths[i], 8);
      pdf.setFontSize(8);
      pdf.text(header, xPos2 + 1, currentY + 5);
      xPos2 += pagamentoWidths[i];
    });
    nextLine(1.5);

    // Dados dos pagamentos - com tratamento de dados seguro
    const informacoesPagamento = dadosNegociacao.informacoesPagamento || [];
    informacoesPagamento
      .filter(info => info && info.total && parseFloat(info.total || '0') > 0)
      .forEach(info => {
        xPos2 = margin;
        const pagamentoValues = [
          info.tipo,
          `R$ ${info.total}`,
          info.qtdParcelas,
          `R$ ${info.valorParcela}`,
          info.formaPagamento,
          info.primeiroVencimento ? new Date(info.primeiroVencimento).toLocaleDateString('pt-BR') : ''
        ];
        
        pagamentoValues.forEach((valor, i) => {
          drawBox(xPos2, currentY, pagamentoWidths[i], 6);
          pdf.setFontSize(8);
          pdf.text(valor || '', xPos2 + 1, currentY + 4);
          xPos2 += pagamentoWidths[i];
        });
        nextLine();
      });

    console.log('✅ PDF de Negociação gerado com sucesso');
    const blob = pdf.output('blob');
    console.log('📦 Blob de Negociação criado:', blob.size, 'bytes');
    return blob;
  }
}

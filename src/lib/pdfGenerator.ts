import jsPDF from 'jspdf';

export interface DadosCliente {
  nome?: string;
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  estadoEmissor?: string;
  profissao?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  email?: string;
  telefone?: string;
  [key: string]: any;
}

export interface DadosNegociacao {
  liner?: string;
  closer?: string;
  tipoVenda?: string;
  parcelasPagasSala: Array<{
    tipo: string;
    valorTotal: string;
    valorDistribuido: string;
    quantidadeCotas: string;
    formasPagamento: string[];
  }>;
  contratos: Array<{
    empreendimento: string;
    categoriaPreco: string;
    valor: string;
    torre?: string;
    apartamento?: string;
    cota?: string;
    [key: string]: any;
  }>;
  informacoesPagamento: Array<{
    tipo: string;
    total: string;
    qtdParcelas: string;
    valorParcela: string;
    formaPagamento: string;
    primeiroVencimento: string;
  }>;
}

export class PDFGenerator {
  private static drawBorderedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, fill: boolean = false) {
    if (fill) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, w, h, 'F');
    }
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, y, w, h);
  }

  private static drawHeader(pdf: jsPDF, title: string, pageInfo: string) {
    // Header com bordas
    this.drawBorderedRect(pdf, 10, 10, 30, 15);
    this.drawBorderedRect(pdf, 40, 10, 110, 15);
    this.drawBorderedRect(pdf, 150, 10, 50, 15);

    // Logo GAV
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("GAV", 20, 20);
    pdf.setFontSize(8);
    pdf.text("RESORTS", 17, 23);

    // Título
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("FORMULÁRIO", 85, 15);
    pdf.text(title, 70, 21);

    // Info do documento
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Código:FOR.02.01.002", 152, 14);
    pdf.text("Rev.: 24/07/2025-Ver.02", 152, 17);
    pdf.text(pageInfo, 152, 20);
  }

  private static createInputField(pdf: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number = 6) {
    this.drawBorderedRect(pdf, x, y, w, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label + ":", x + 1, y + 4);
    if (value) {
      pdf.text(value, x + 1, y + h - 1);
    }
  }

  private static createTableCell(pdf: jsPDF, text: string, x: number, y: number, w: number, h: number, bold: boolean = false) {
    this.drawBorderedRect(pdf, x, y, w, h);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(7);
    
    // Quebrar texto se muito longo
    const lines = pdf.splitTextToSize(text, w - 2);
    const startY = y + 3;
    
    for (let i = 0; i < lines.length && i < 2; i++) {
      pdf.text(lines[i], x + 1, startY + (i * 3));
    }
  }

  static gerarPDFCadastroCliente(dadosCliente: DadosCliente): string {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('datauristring');
  }

  static gerarPDFCadastroClienteBlob(dadosCliente: DadosCliente): Blob {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('blob');
  }

  private static createPDFCadastroCliente(dadosCliente: DadosCliente): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Header
      this.drawHeader(pdf, "Ficha de Cadastro de Cliente", "Página: 1 de 2");

      let yPos = 35;

      // DADOS DO CLIENTE
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("DADOS DO CLIENTE:", 10, yPos);
      yPos += 5;

      // Tabela de dados do cliente
      this.drawBorderedRect(pdf, 10, yPos, 190, 80);
      
      // Nome
      this.createInputField(pdf, "Nome", dadosCliente.nome || "", 10, yPos, 190, 10);
      yPos += 10;

      // CPF
      this.createInputField(pdf, "CPF", dadosCliente.cpf || "", 10, yPos, 190, 10);
      yPos += 10;

      // RG, Órgão, UF
      this.createInputField(pdf, "RG", dadosCliente.rg || "", 10, yPos, 100, 10);
      this.createInputField(pdf, "ÓRGÃO", dadosCliente.orgaoEmissor || "", 110, yPos, 40, 10);
      this.createInputField(pdf, "UF", dadosCliente.estadoEmissor || "", 150, yPos, 50, 10);
      yPos += 10;

      // Profissão
      this.createInputField(pdf, "Profissão", dadosCliente.profissao || "", 10, yPos, 190, 10);
      yPos += 10;

      // Estado Civil
      this.createInputField(pdf, "Estado Civil", dadosCliente.estadoCivil || "", 10, yPos, 190, 10);
      yPos += 10;

      // E-mail
      this.createInputField(pdf, "E-mail", dadosCliente.email || "", 10, yPos, 190, 10);
      yPos += 10;

      // Telefone
      this.createInputField(pdf, "Telefone", dadosCliente.telefone || "", 10, yPos, 190, 10);
      yPos += 20;

      // DADOS DO CÔNJUGE
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("DADOS DO CÔNJUGE:", 10, yPos);
      yPos += 5;

      // Tabela de dados do cônjuge
      this.drawBorderedRect(pdf, 10, yPos, 190, 80);
      
      // Nome
      this.createInputField(pdf, "Nome", "", 10, yPos, 190, 10);
      yPos += 10;

      // CPF
      this.createInputField(pdf, "CPF", "", 10, yPos, 190, 10);
      yPos += 10;

      // RG, Órgão, UF
      this.createInputField(pdf, "RG", "", 10, yPos, 100, 10);
      this.createInputField(pdf, "ÓRGÃO", "", 110, yPos, 40, 10);
      this.createInputField(pdf, "UF", "", 150, yPos, 50, 10);
      yPos += 10;

      // Profissão
      this.createInputField(pdf, "Profissão", "", 10, yPos, 190, 10);
      yPos += 10;

      // Estado Civil
      this.createInputField(pdf, "Estado Civil", "", 10, yPos, 190, 10);
      yPos += 10;

      // E-mail
      this.createInputField(pdf, "E-mail", "", 10, yPos, 190, 10);
      yPos += 10;

      // Telefone
      this.createInputField(pdf, "Telefone", "", 10, yPos, 190, 10);
      yPos += 20;

      // ENDEREÇO
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("ENDEREÇO:", 10, yPos);
      yPos += 5;

      // Logradouro e Nº
      this.createInputField(pdf, "Logradouro", "", 10, yPos, 140, 10);
      this.createInputField(pdf, "Nº", "", 150, yPos, 50, 10);
      yPos += 10;

      // Bairro
      this.createInputField(pdf, "Bairro", "", 10, yPos, 190, 10);
      yPos += 10;

      // Complemento e CEP
      this.createInputField(pdf, "Complemento", "", 10, yPos, 140, 10);
      this.createInputField(pdf, "CEP", "", 150, yPos, 50, 10);
      yPos += 10;

      // Cidade e UF
      this.createInputField(pdf, "Cidade", "", 10, yPos, 140, 10);
      this.createInputField(pdf, "UF", "", 150, yPos, 50, 10);
      yPos += 20;

      // SALA DE VENDAS
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("SALA DE VENDAS:", 10, yPos);
      this.drawBorderedRect(pdf, 180, yPos - 5, 20, 7);
      pdf.text("BEEBACK", 182, yPos);
      yPos += 15;

      // LINER
      pdf.text("LINER:", 10, yPos);
      pdf.line(35, yPos, 200, yPos);
      yPos += 8;

      // EMPRESA (Liner)
      pdf.text("EMPRESA (Liner):", 10, yPos);
      pdf.line(55, yPos, 200, yPos);
      yPos += 8;

      // CLOSER
      pdf.text("CLOSER:", 10, yPos);
      pdf.line(35, yPos, 200, yPos);
      yPos += 8;

      // EMPRESA (Closer)
      pdf.text("EMPRESA (Closer):", 10, yPos);
      pdf.line(55, yPos, 200, yPos);
      yPos += 8;

      // PEP
      pdf.text("PEP:", 10, yPos);
      pdf.line(25, yPos, 200, yPos);
      yPos += 8;

      // EMPRESA (PEP)
      pdf.text("EMPRESA (PEP):", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 8;

      // LIDER DE SALA
      pdf.text("LIDER DE SALA:", 10, yPos);
      pdf.line(45, yPos, 200, yPos);
      yPos += 8;

      // SUB LIDER DE SALA
      pdf.text("SUB LIDER DE SALA:", 10, yPos);
      pdf.line(60, yPos, 200, yPos);

      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de cadastro:', error);
      throw new Error('Falha na geração do PDF de cadastro do cliente');
    }
  }

  static gerarPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): string {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('datauristring');
  }

  static gerarPDFNegociacaoBlob(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): Blob {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('blob');
  }

  private static createPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Header
      this.drawHeader(pdf, "Ficha de Negociação de Cota", "Página: 2 de 2");

      let yPos = 35;

      // CLIENTE
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("CLIENTE:", 10, yPos);
      pdf.line(30, yPos, 200, yPos);
      if (dadosCliente.nome) {
        pdf.setFont("helvetica", "normal");
        pdf.text(dadosCliente.nome, 32, yPos);
      }
      yPos += 8;

      // CPF
      pdf.setFont("helvetica", "bold");
      pdf.text("CPF:", 10, yPos);
      pdf.line(25, yPos, 200, yPos);
      if (dadosCliente.cpf) {
        pdf.setFont("helvetica", "normal");
        pdf.text(dadosCliente.cpf, 27, yPos);
      }
      yPos += 8;

      // SALA DE VENDAS
      pdf.setFont("helvetica", "bold");
      pdf.text("SALA DE VENDAS:", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 12;

      // Tipos de venda
      const tipos = [
        { label: "PADRÃO", value: "padrao" },
        { label: "SEMESTRAL", value: "semestral" },
        { label: "ANUAL", value: "anual" },
        { label: "À VISTA", value: "a-vista" },
        { label: "ATÉ 36x", value: "ate-36x" },
        { label: "LINEAR", value: "linear" }
      ];

      let xPos = 10;
      tipos.forEach(tipo => {
        const isSelected = dadosNegociacao.tipoVenda === tipo.value;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`(${isSelected ? 'X' : ' '}) ${tipo.label}`, xPos, yPos);
        xPos += 30;
      });
      yPos += 15;

      // Tabela de Parcelas Pagas em Sala
      const tableHeaders = [
        "Tipo de Parcela Paga em Sala",
        "Valor Total Pago em Sala", 
        "Quantidade de cotas",
        "Valor distribuido para cada Unidade",
        "Forma de Pagamento"
      ];
      const colWidths = [38, 38, 38, 38, 38];

      // Cabeçalho da tabela
      let currentX = 10;
      tableHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, colWidths[i], 15, true);
        currentX += colWidths[i];
      });
      yPos += 15;

      // Linhas da tabela (3 linhas fixas)
      const tiposFixos = ["( ) Entrada", "( ) Sinal", "( ) Saldo"];
      for (let i = 0; i < 3; i++) {
        currentX = 10;
        const parcela = dadosNegociacao.parcelasPagasSala[i];
        
        this.createTableCell(pdf, tiposFixos[i], currentX, yPos, colWidths[0], 10);
        currentX += colWidths[0];
        
        this.createTableCell(pdf, parcela?.valorTotal || "", currentX, yPos, colWidths[1], 10);
        currentX += colWidths[1];
        
        this.createTableCell(pdf, parcela?.quantidadeCotas || "", currentX, yPos, colWidths[2], 10);
        currentX += colWidths[2];
        
        this.createTableCell(pdf, parcela?.valorDistribuido || "", currentX, yPos, colWidths[3], 10);
        currentX += colWidths[3];
        
        this.createTableCell(pdf, parcela?.formasPagamento?.[0] || "", currentX, yPos, colWidths[4], 10);
        
        yPos += 10;
      }
      yPos += 10;

      // Tabela de Contratos
      const contratoHeaders = ["Contrato", "Empreendimento", "Torre/Bloco", "Apt.", "Cota", "Vista da UH.", "PCD", "Valor"];
      const contratoWidths = [20, 35, 25, 20, 20, 25, 20, 25];

      // Cabeçalho
      currentX = 10;
      contratoHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, contratoWidths[i], 10, true);
        currentX += contratoWidths[i];
      });
      yPos += 10;

      // 4 linhas de contratos
      for (let i = 0; i < 4; i++) {
        currentX = 10;
        const contrato = dadosNegociacao.contratos[i];
        
        this.createTableCell(pdf, "( ) Físico\n( ) Digital", currentX, yPos, contratoWidths[0], 15);
        currentX += contratoWidths[0];
        
        this.createTableCell(pdf, contrato?.empreendimento || "", currentX, yPos, contratoWidths[1], 15);
        currentX += contratoWidths[1];
        
        this.createTableCell(pdf, contrato?.torre || "", currentX, yPos, contratoWidths[2], 15);
        currentX += contratoWidths[2];
        
        this.createTableCell(pdf, contrato?.apartamento || "", currentX, yPos, contratoWidths[3], 15);
        currentX += contratoWidths[3];
        
        this.createTableCell(pdf, contrato?.cota || "", currentX, yPos, contratoWidths[4], 15);
        currentX += contratoWidths[4];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[5], 15);
        currentX += contratoWidths[5];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[6], 15);
        currentX += contratoWidths[6];
        
        this.createTableCell(pdf, contrato?.valor || "", currentX, yPos, contratoWidths[7], 15);
        
        yPos += 15;
      }
      yPos += 5;

      // Texto explicativo
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("O financeiro descrito abaixo é referente a cada unidade separadamente.", 10, yPos);
      yPos += 10;

      // Tabela de Informações de Pagamento
      const pagHeaders = ["Tipo", "Total", "Qtd. Parcelas", "Valor Parcela", "Forma de Pag.", "1º Vencimento"];
      const pagWidths = [30, 25, 25, 25, 25, 30];

      // Cabeçalho
      currentX = 10;
      pagHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, pagWidths[i], 8, true);
        currentX += pagWidths[i];
      });
      yPos += 8;

      // Linhas fixas
      const tiposPagamento = ["Entrada", "Entrada", "Entrada Restante", "Sinal", "Saldo"];
      for (let i = 0; i < 5; i++) {
        currentX = 10;
        const info = dadosNegociacao.informacoesPagamento.find(inf => 
          inf.tipo === tiposPagamento[i] || 
          (tiposPagamento[i] === "Entrada" && inf.tipo.includes("ª Entrada"))
        );
        
        this.createTableCell(pdf, tiposPagamento[i], currentX, yPos, pagWidths[0], 8);
        currentX += pagWidths[0];
        
        this.createTableCell(pdf, info?.total || "", currentX, yPos, pagWidths[1], 8);
        currentX += pagWidths[1];
        
        this.createTableCell(pdf, info?.qtdParcelas || "", currentX, yPos, pagWidths[2], 8);
        currentX += pagWidths[2];
        
        this.createTableCell(pdf, info?.valorParcela || "", currentX, yPos, pagWidths[3], 8);
        currentX += pagWidths[3];
        
        this.createTableCell(pdf, info?.formaPagamento || "", currentX, yPos, pagWidths[4], 8);
        currentX += pagWidths[4];
        
        this.createTableCell(pdf, info?.primeiroVencimento || "", currentX, yPos, pagWidths[5], 8);
        
        yPos += 8;
      }

      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de negociação:', error);
      throw new Error('Falha na geração do PDF de negociação');
    }
  }
}

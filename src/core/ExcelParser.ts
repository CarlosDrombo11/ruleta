// src/core/ExcelParser.ts

import * as XLSX from 'xlsx';
import { ExcelData } from '../types';

export interface ParseResult {
  success: boolean;
  data?: ExcelData;
  error?: string;
  preview?: {
    premios: string[];
    participantes: string[];
  };
}

export class ExcelParser {
  private readonly REQUIRED_SHEETS = ['Premios', 'Participantes'];
  private readonly MAX_PREVIEW_ITEMS = 5;

  public async parseFile(file: File): Promise<ParseResult> {
    try {
      console.log('Iniciando parseo del archivo:', file.name);
      
      const buffer = await this.readFileAsArrayBuffer(file);
      const workbook = XLSX.read(buffer, {
        // Usar solo opciones válidas de ParsingOptions
        cellDates: true,
        cellNF: true,
        cellStyles: true,
        sheetStubs: true,
        bookDeps: false,
        bookFiles: false,
        bookProps: false,
        bookSheets: false,
        bookVBA: false
      });

      // Validar estructura del workbook
      const validationResult = this.validateWorkbook(workbook);
      if (!validationResult.success) {
        return validationResult;
      }

      // Parsear datos
      const data = this.extractData(workbook);
      const preview = this.generatePreview(data);

      console.log('Archivo parseado exitosamente');
      console.log(`Premios encontrados: ${data.premios.length}`);
      console.log(`Participantes encontrados: ${data.participantes.length}`);

      return {
        success: true,
        data,
        preview
      };

    } catch (error) {
      console.error('Error parseando archivo Excel:', error);
      return {
        success: false,
        error: `Error procesando el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error('Error leyendo el archivo'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  private validateWorkbook(workbook: XLSX.WorkBook): ParseResult {
    const sheetNames = Object.keys(workbook.Sheets);
    
    // Verificar que existan las hojas requeridas
    for (const requiredSheet of this.REQUIRED_SHEETS) {
      if (!sheetNames.includes(requiredSheet)) {
        return {
          success: false,
          error: `Falta la hoja requerida: "${requiredSheet}". Hojas encontradas: ${sheetNames.join(', ')}`
        };
      }
    }

    // Verificar que las hojas tengan datos
    for (const sheetName of this.REQUIRED_SHEETS) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet['!ref']) {
        return {
          success: false,
          error: `La hoja "${sheetName}" está vacía`
        };
      }
      
      const range = XLSX.utils.decode_range(sheet['!ref']);
      
      if (range.e.r < 1) { // Menos de 2 filas (header + al menos 1 dato)
        return {
          success: false,
          error: `La hoja "${sheetName}" está vacía o no contiene datos válidos`
        };
      }
    }

    console.log('Validación del workbook exitosa');
    return { success: true };
  }

  private extractData(workbook: XLSX.WorkBook): ExcelData {
    const premiosSheet = workbook.Sheets['Premios'];
    const participantesSheet = workbook.Sheets['Participantes'];

    const premios = this.parseColumn(premiosSheet, 'A');
    const participantes = this.parseColumn(participantesSheet, 'A');

    return {
      premios: this.cleanAndValidateArray(premios, 'premio'),
      participantes: this.cleanAndValidateArray(participantes, 'participante')
    };
  }

  private parseColumn(worksheet: XLSX.WorkSheet, column: string): string[] {
    if (!worksheet['!ref']) {
      return [];
    }

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const result: string[] = [];

    // Empezar desde la fila 2 (asumiendo que la fila 1 es header)
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = column + (row + 1);
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        const value = String(cell.v).trim();
        if (value) {
          result.push(value);
        }
      }
    }

    return result;
  }

  private cleanAndValidateArray(items: string[], type: string): string[] {
    const cleaned = items
      .filter(item => item.length > 0)
      .map(item => item.trim())
      .filter((item, index, arr) => arr.indexOf(item) === index); // Remover duplicados

    if (cleaned.length === 0) {
      throw new Error(`No se encontraron ${type}s válidos`);
    }

    console.log(`${cleaned.length} ${type}s únicos procesados`);
    return cleaned;
  }

  private generatePreview(data: ExcelData) {
    return {
      premios: data.premios.slice(0, this.MAX_PREVIEW_ITEMS),
      participantes: data.participantes.slice(0, this.MAX_PREVIEW_ITEMS)
    };
  }

  public validateFileType(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Fallback para algunos navegadores
    ];

    const validExtensions = ['.xlsx', '.xls'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    return hasValidType || hasValidExtension;
  }

  public getFileInfo(file: File): { name: string; size: string; type: string } {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file.name,
      size: `${sizeInMB} MB`,
      type: file.type || 'Tipo desconocido'
    };
  }

  // Método para generar template de Excel
  public generateTemplate(): ArrayBuffer {
    const wb = XLSX.utils.book_new();

    // Hoja de Premios
    const premiosData = [
      ['Premio'],
      ['iPhone 15 Pro'],
      ['MacBook Air'],
      ['AirPods Pro'],
      ['iPad'],
      ['Apple Watch'],
      ['HomePod'],
      ['Gift Card $100'],
      ['Gift Card $50']
    ];
    
    const premiosWs = XLSX.utils.aoa_to_sheet(premiosData);
    XLSX.utils.book_append_sheet(wb, premiosWs, 'Premios');

    // Hoja de Participantes
    const participantesData = [
      ['Participante'],
      ['María González'],
      ['Juan Pérez'],
      ['Ana Martínez'],
      ['Carlos López'],
      ['Laura Rodríguez'],
      ['Miguel Sánchez'],
      ['Carmen Díaz'],
      ['José García']
    ];
    
    const participantesWs = XLSX.utils.aoa_to_sheet(participantesData);
    XLSX.utils.book_append_sheet(wb, participantesWs, 'Participantes');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }
}
import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface CSVUploadProps {
  onCardsImported: (cards: { id: number; text: string }[], replaceAll?: boolean) => void;
  onClose: () => void;
  existingCardsCount: number;
}

interface ParsedCard {
  text: string;
  valid: boolean;
  error?: string;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onCardsImported, onClose, existingCardsCount }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [csvFormat, setCsvFormat] = useState<'auto' | 'single-column' | 'with-headers'>('auto');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.txt');
    
    if (!isValidType) {
      setParseError('Please upload a CSV or TXT file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setParseError('File size must be less than 5MB');
      return;
    }

    setFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const cards = processCSVData(results.data as string[][]);
          setParsedCards(cards);
          setParseError('');
        } catch (error) {
          setParseError(error instanceof Error ? error.message : 'Error parsing CSV file');
          setParsedCards([]);
        }
      },
      error: (error) => {
        setParseError(`CSV parsing error: ${error.message}`);
        setParsedCards([]);
      },
      skipEmptyLines: true,
      transform: (value) => value.trim()
    });
  };

  const processCSVData = (data: string[][]): ParsedCard[] => {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty');
    }

    let cards: ParsedCard[] = [];
    let startRow = 0;

    // Auto-detect format or use specified format
    if (csvFormat === 'auto') {
      // Check if first row looks like headers
      const firstRow = data[0];
      const hasHeaders = firstRow.some(cell => 
        cell.toLowerCase().includes('card') || 
        cell.toLowerCase().includes('text') || 
        cell.toLowerCase().includes('content') ||
        cell.toLowerCase().includes('item')
      );
      
      if (hasHeaders) {
        startRow = 1;
      }
    } else if (csvFormat === 'with-headers') {
      startRow = 1;
    }

    // Process each row
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Try to extract card text from the row
      let cardText = '';
      
      if (csvFormat === 'single-column' || row.length === 1) {
        // Single column format
        cardText = row[0];
      } else {
        // Multi-column - find the best column
        // Look for columns that aren't numbers or very short
        const textColumn = row.find(cell => 
          cell && 
          cell.length > 2 && 
          !/^\d+$/.test(cell) && // Not just a number
          !/^(id|#|\d+)$/i.test(cell) // Not an ID column
        );
        cardText = textColumn || row[0] || '';
      }

      // Validate card text
      if (!cardText || cardText.trim().length === 0) {
        cards.push({
          text: `(Empty card from row ${i + 1})`,
          valid: false,
          error: 'Empty card text'
        });
        continue;
      }

      if (cardText.length > 200) {
        cards.push({
          text: cardText.substring(0, 200) + '...',
          valid: false,
          error: 'Card text too long (max 200 characters)'
        });
        continue;
      }

      cards.push({
        text: cardText.trim(),
        valid: true
      });
    }

    if (cards.length === 0) {
      throw new Error('No valid cards found in CSV file');
    }

    return cards;
  };

  const handleImport = () => {
    const validCards = parsedCards.filter(card => card.valid);
    if (validCards.length === 0) {
      setParseError('No valid cards to import');
      return;
    }

    const cards = validCards.map((card, index) => ({
      id: Date.now() + index,
      text: card.text
    }));

    onCardsImported(cards, importMode === 'replace');
  };

  const downloadSample = () => {
    const sampleData = [
      ['Card Text'],
      ['Product Reviews'],
      ['Shipping Information'],
      ['Return Policy'],
      ['Size Guide'],
      ['Customer Support'],
      ['User Account Settings']
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-cards.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCardsCount = parsedCards.filter(card => card.valid).length;
  const invalidCardsCount = parsedCards.length - validCardsCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Import Cards from CSV</h2>
            <p className="text-sm text-gray-600">Upload a CSV file with your card content</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">CSV Format</label>
            <div className="flex space-x-4">
              {[
                { value: 'auto', label: 'Auto-detect' },
                { value: 'single-column', label: 'Single column' },
                { value: 'with-headers', label: 'With headers' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="csvFormat"
                    value={option.value}
                    checked={csvFormat === option.value}
                    onChange={(e) => setCsvFormat(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Import Mode Selection */}
          {existingCardsCount > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Import Mode</label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="mr-3 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Add to existing cards</span>
                    <p className="text-xs text-gray-600">Keep your {existingCardsCount} existing cards and add the new ones</p>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="mr-3 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-red-600">Replace all existing cards</span>
                    <p className="text-xs text-gray-600">Remove all {existingCardsCount} existing cards and replace with new ones</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium">Drop your CSV file here, or click to browse</p>
                <p className="text-sm text-gray-600">Supports CSV and TXT files up to 5MB</p>
              </div>
              
              {file && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Sample */}
          <div className="text-center">
            <button
              onClick={downloadSample}
              className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Download sample CSV format</span>
            </button>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Parse Error</p>
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Parse Results */}
          {parsedCards.length > 0 && !parseError && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Parse Successful</p>
                    <p className="text-sm text-green-700">
                      Found {validCardsCount} valid cards
                      {invalidCardsCount > 0 && ` (${invalidCardsCount} invalid)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards Preview */}
              <div className="space-y-2">
                <h3 className="font-medium">Card Preview:</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {parsedCards.map((card, index) => (
                    <div
                      key={index}
                      className={`p-3 border-b last:border-b-0 ${
                        card.valid ? 'bg-white' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-sm ${card.valid ? 'text-gray-900' : 'text-red-600'}`}>
                          {card.text}
                        </span>
                        {!card.valid && (
                          <span className="text-xs text-red-500 ml-2">
                            {card.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {parsedCards.length > 0 && (
              <span>{validCardsCount} cards ready to import</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={validCardsCount === 0}
              className={`px-4 py-2 rounded-lg ${
                validCardsCount > 0
                  ? (importMode === 'replace' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700') + ' text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {importMode === 'replace' ? 'Replace All with' : 'Import'} {validCardsCount} Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;
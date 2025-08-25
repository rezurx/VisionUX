import React, { useState } from 'react';
import { Download, FileText, Database, Table, Video, Play } from 'lucide-react';
import { ExportOptions, ExportResult, Study } from '../../types';
import VideoExporter from './VideoExporter';

interface DataExporterProps {
  data: any;
  studyName?: string;
  studies?: Study[];
  onExport?: (result: ExportResult) => void;
}

const DataExporter: React.FC<DataExporterProps> = ({
  data,
  studyName = 'research-data',
  studies = [],
  onExport
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeVisualizations: false,
    aggregationLevel: 'participant'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'video'>('general');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const result = await exportData(data, exportOptions, studyName);
      
      // Trigger download
      downloadFile(result);
      
      if (onExport) {
        onExport(result);
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (onExport) {
        onExport({
          success: false,
          filename: '',
          size: 0,
          error: error instanceof Error ? error.message : 'Export failed'
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportData = async (
    sourceData: any,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}-${timestamp}.${options.format}`;
    
    let content: string;
    let mimeType: string;
    
    switch (options.format) {
      case 'json':
        content = JSON.stringify(processDataForExport(sourceData, options), null, 2);
        mimeType = 'application/json';
        break;
        
      case 'csv':
        content = convertToCSV(sourceData, options);
        mimeType = 'text/csv';
        break;
        
      case 'xlsx':
        // Would integrate with a library like xlsx for actual Excel export
        content = convertToCSV(sourceData, options); // Fallback to CSV
        mimeType = 'text/csv';
        break;
        
      case 'pdf':
        content = await generatePDFReport(sourceData, options);
        mimeType = 'application/pdf';
        break;
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    return {
      success: true,
      filename: fullFilename,
      size: new Blob([content]).size,
      downloadUrl: URL.createObjectURL(new Blob([content], { type: mimeType }))
    };
  };

  const processDataForExport = (sourceData: any, options: ExportOptions) => {
    const exportData: any = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: options.format,
        aggregationLevel: options.aggregationLevel,
        filters: {
          methods: options.filterByMethod,
          dateRange: options.dateRange
        }
      }
    };

    if (options.includeMetadata) {
      exportData.metadata = {
        studyName: studyName,
        exportOptions: options,
        dataTypes: Object.keys(sourceData)
      };
    }

    // Process based on aggregation level
    switch (options.aggregationLevel) {
      case 'participant':
        exportData.data = aggregateByParticipant(sourceData);
        break;
      case 'study':
        exportData.data = aggregateByStudy(sourceData);
        break;
      case 'method':
        exportData.data = aggregateByMethod(sourceData);
        break;
      default:
        exportData.data = sourceData;
    }

    return exportData;
  };

  const aggregateByParticipant = (sourceData: any) => {
    const participants: { [key: string]: any } = {};
    
    // Aggregate card sorting data
    if (sourceData.cardSortResults) {
      sourceData.cardSortResults.forEach((result: any) => {
        if (!participants[result.participantId]) {
          participants[result.participantId] = { participantId: result.participantId };
        }
        participants[result.participantId].cardSorting = result;
      });
    }

    // Aggregate survey data
    if (sourceData.surveyResults) {
      sourceData.surveyResults.forEach((result: any) => {
        if (!participants[result.participantId]) {
          participants[result.participantId] = { participantId: result.participantId };
        }
        participants[result.participantId].survey = result;
      });
    }

    // Aggregate accessibility data
    if (sourceData.accessibilityResults) {
      sourceData.accessibilityResults.forEach((result: any) => {
        if (!participants[result.participantId]) {
          participants[result.participantId] = { participantId: result.participantId };
        }
        participants[result.participantId].accessibility = result;
      });
    }

    // Aggregate design system data
    if (sourceData.designSystemResults) {
      sourceData.designSystemResults.forEach((result: any) => {
        if (!participants[result.participantId]) {
          participants[result.participantId] = { participantId: result.participantId };
        }
        participants[result.participantId].designSystem = result;
      });
    }

    return Object.values(participants);
  };

  const aggregateByStudy = (sourceData: any) => {
    const studies: { [key: number]: any } = {};
    
    // Process each data type
    Object.keys(sourceData).forEach(dataType => {
      if (Array.isArray(sourceData[dataType])) {
        sourceData[dataType].forEach((result: any) => {
          if (result.studyId) {
            if (!studies[result.studyId]) {
              studies[result.studyId] = { studyId: result.studyId, data: {} };
            }
            if (!studies[result.studyId].data[dataType]) {
              studies[result.studyId].data[dataType] = [];
            }
            studies[result.studyId].data[dataType].push(result);
          }
        });
      }
    });

    return Object.values(studies);
  };

  const aggregateByMethod = (sourceData: any) => {
    const methods: { [key: string]: any } = {};
    
    Object.keys(sourceData).forEach(dataType => {
      if (Array.isArray(sourceData[dataType]) && sourceData[dataType].length > 0) {
        methods[dataType] = {
          methodType: dataType,
          totalResults: sourceData[dataType].length,
          data: sourceData[dataType]
        };
      }
    });

    return Object.values(methods);
  };

  const convertToCSV = (sourceData: any, _options: ExportOptions): string => {
    const rows: string[] = [];
    
    // Add header row
    const headers = ['participantId', 'studyId', 'method', 'timestamp', 'results'];
    rows.push(headers.join(','));

    // Convert each data type to CSV rows
    Object.keys(sourceData).forEach(dataType => {
      if (Array.isArray(sourceData[dataType])) {
        sourceData[dataType].forEach((result: any) => {
          const row = [
            `"${result.participantId || ''}"`,
            `"${result.studyId || ''}"`,
            `"${dataType}"`,
            `"${new Date().toISOString()}"`,
            `"${JSON.stringify(result).replace(/"/g, '""')}"`
          ];
          rows.push(row.join(','));
        });
      }
    });

    return rows.join('\n');
  };

  const generatePDFReport = async (sourceData: any, options: ExportOptions): Promise<string> => {
    // Simplified PDF generation - would use a library like jsPDF in production
    const reportContent = [
      'RESEARCH DATA EXPORT REPORT',
      '==========================',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Study: ${studyName}`,
      '',
      'DATA SUMMARY:',
      '-------------'
    ];

    Object.keys(sourceData).forEach(dataType => {
      if (Array.isArray(sourceData[dataType])) {
        reportContent.push(`${dataType}: ${sourceData[dataType].length} records`);
      }
    });

    reportContent.push('', 'NOTE: This is a simplified text report. For full PDF generation, additional libraries are required.');

    return reportContent.join('\n');
  };

  const downloadFile = (result: ExportResult) => {
    if (result.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(result.downloadUrl!), 100);
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: Database, description: 'Structured data format' },
    { value: 'csv', label: 'CSV', icon: Table, description: 'Spreadsheet format' },
    { value: 'xlsx', label: 'Excel', icon: FileText, description: 'Excel workbook' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Report format' }
  ];

  const aggregationOptions = [
    { value: 'participant', label: 'By Participant' },
    { value: 'study', label: 'By Study' },
    { value: 'method', label: 'By Method' }
  ];

  const hasData = Object.values(data).some((value: any) => Array.isArray(value) && value.length > 0);
  const hasVideoData = studies.some(study => study.type === 'video-analysis') && 
                      Object.keys(data).some(key => key.includes('video') || data[key]?.some?.((item: any) => item.videoId));

  if (!hasData) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <Database className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No data available for export</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Export Research Data</h3>
          </div>
        </div>

        {/* Tab Navigation */}
        {hasVideoData && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                General Export
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'video'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Video className="w-4 h-4 inline mr-2" />
                Video Analytics
              </button>
            </nav>
          </div>
        )}

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.value}
                  className={`relative rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 ${
                      exportOptions.format === format.value ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`ml-2 font-medium ${
                      exportOptions.format === format.value ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {format.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{format.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregation Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Aggregation
          </label>
          <select
            value={exportOptions.aggregationLevel}
            onChange={(e) => setExportOptions(prev => ({ 
              ...prev, 
              aggregationLevel: e.target.value as any 
            }))}
            className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            {aggregationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Include Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeMetadata: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Include metadata and export information</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeVisualizations}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeVisualizations: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Include visualization data (when applicable)</span>
            </label>
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Data Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600">
            {Object.entries(data).map(([key, value]) => {
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <div key={key}>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="ml-1">{value.length} records</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </>
            )}
          </button>
        </div>
            </div>
          )}

          {activeTab === 'video' && hasVideoData && (
            <VideoExporter
              studies={studies}
              videoResults={data}
              selectedStudyId={undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExporter;
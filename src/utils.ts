// Utility functions for the Card Sorting Application

export const generateCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const cell = row[header];
      if (typeof cell === 'object' && cell !== null) {
        return '"' + JSON.stringify(cell).replace(/"/g, '""') + '"';
      }
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }
      return cell || '';
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateParticipantId = (): string => {
  return 'P' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
};

export const generateAccessCode = (): string => {
  return Math.random().toString().substring(2, 8);
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};
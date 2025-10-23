// CSV export functionality for results

export interface CSVRow {
  'Product Name': string;
  'Selected Image URL': string;
  'Source Page URL': string;
  'Matched Domain': string;
  'Score': string;
}

export function generateCSV(results: Record<string, any>): string {
  const rows: CSVRow[] = [];
  
  // Process each product
  for (const [productName, image] of Object.entries(results)) {
    if (image) {
      rows.push({
        'Product Name': productName,
        'Selected Image URL': image.url || '',
        'Source Page URL': image.source_url || '',
        'Matched Domain': image.matched_domain || image.source_domain || '',
        'Score': image.score ? image.score.toString() : ''
      });
    } else {
      // No image found - add row with empty fields
      rows.push({
        'Product Name': productName,
        'Selected Image URL': '',
        'Source Page URL': '',
        'Matched Domain': '',
        'Score': ''
      });
    }
  }
  
  // Convert to CSV string
  const headers = ['Product Name', 'Selected Image URL', 'Source Page URL', 'Matched Domain', 'Score'];
  const csvHeaders = headers.join(',');
  
  const csvRows = rows.map(row => {
    return headers.map(header => {
      const value = row[header as keyof CSVRow] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string = 'selected_images.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

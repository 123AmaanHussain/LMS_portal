/**
 * Export an array of objects to a CSV file and trigger browser download.
 *
 * @param {string}   filename - Name of the downloaded file (e.g. "books.csv")
 * @param {Object[]} rows     - Array of plain objects to export
 * @param {string[]} columns  - Ordered list of object keys to include
 * @param {string[]} headers  - Human-readable column headers (same order as columns)
 */
export function exportToCsv(filename, rows, columns, headers) {
  if (!rows || rows.length === 0) return

  const escape = (val) => {
    const str = val == null ? '' : String(val)
    // Wrap in quotes if the value contains a comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvLines = [
    headers.map(escape).join(','),
    ...rows.map(row => columns.map(col => escape(row[col])).join(',')),
  ]

  const csvContent = csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

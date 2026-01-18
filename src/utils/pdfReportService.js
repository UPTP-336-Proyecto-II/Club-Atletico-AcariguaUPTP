import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Register fonts
// Fix for different build environments (Webpack vs others)
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs
} else {
  pdfMake.vfs = pdfFonts
}

const COMPANY_NAME = 'Club Atlético Deportivo Acarigua'

export const PdfReportService = {
  /**
         * Base configuration for all reports
         */
  _getBaseDocDefinition(content, title, subtitle) {
    return {
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60], // [left, top, right, bottom]

      header: (currentPage, pageCount) => {
        return {
          columns: [
            // Logo (placeholder or text if image fails)
            {
              text: 'CADA',
              style: 'headerLogo',
              width: 50
            },
            // Title and Date
            {
              stack: [
                { text: COMPANY_NAME, style: 'headerCompany' },
                { text: new Date().toLocaleDateString(), alignment: 'right', style: 'headerDate' }
              ],
              width: '*'
            }
          ],
          margin: [40, 20, 40, 0]
        }
      },

      footer: (currentPage, pageCount) => {
        return {
          columns: [
            { text: 'Generado por Sistema de Gestión CADA', style: 'footerText', alignment: 'left' },
            { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', style: 'footerText' }
          ],
          margin: [40, 20, 40, 0]
        }
      },

      content: [
        // Main Title of the Report
        { text: title, style: 'reportTitle' },
        subtitle ? { text: subtitle, style: 'reportSubtitle' } : null,
        { text: ' ', fontSize: 10 }, // Spacer

        // Actual Content
        ...content
      ],

      styles: {
        headerLogo: {
          fontSize: 18,
          bold: true,
          color: '#E51D22'
        },
        headerCompany: {
          fontSize: 10,
          bold: true,
          alignment: 'center',
          color: '#555'
        },
        headerDate: {
          fontSize: 8,
          color: '#888',
          margin: [0, 5, 0, 0]
        },
        footerText: {
          fontSize: 8,
          color: '#aaa'
        },
        reportTitle: {
          fontSize: 22,
          bold: true,
          color: '#E51D22',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        reportSubtitle: {
          fontSize: 14,
          color: '#1a3a5f',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white',
          fillColor: '#E51D22',
          alignment: 'center'
        },
        tableCell: {
          fontSize: 9,
          color: '#333'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#1a3a5f',
          margin: [0, 15, 0, 10],
          decoration: 'underline',
          decorationColor: '#E51D22'
        },
        label: {
          bold: true,
          fontSize: 10
        },
        value: {
          fontSize: 10
        }
      }
    }
  },

  /**
         * Generates and opens a PDF for Athlete Performance
         * @param {Object} employeeData - Basic data
         * @param {Object} chartsImages - { performance: 'base64...', radar: 'base64...', anthropometric: 'base64...' }
         * @param {Array} statsData - Computed statistics
         */
  generatePerformanceReport(atleta, chartsImages, statsData, photoBase64) {
    const content = []

    // 1. Athlete Summary Section
    content.push({
      columns: [
        // Avatar
        photoBase64
          ? { image: photoBase64, width: 80, fit: [80, 80], alignment: 'center', margin: [0, 5, 0, 0] }
          : { width: 80, text: 'Sin Foto', alignment: 'center', margin: [0, 20, 0, 0], fontSize: 8 },
        {
          width: '*',
          stack: [
            { text: 'Datos Personales', style: 'sectionHeader' },
            {
              columns: [
                { width: 'auto', text: 'Categoría: ', style: 'label' },
                { width: '*', text: atleta.categoria_nombre || 'N/A', style: 'value' },
                { width: 'auto', text: 'Posición: ', style: 'label' },
                { width: '*', text: atleta.posicion_de_juego || 'N/A', style: 'value' }
              ],
              columnGap: 10,
              margin: [0, 0, 0, 5]
            },
            {
              columns: [
                { width: 'auto', text: 'Pierna Dominante: ', style: 'label' },
                { width: '*', text: atleta.pierna_dominante || 'Derecha', style: 'value' }
              ]
            }
          ]
        }
      ],
      columnGap: 20,
      margin: [0, 0, 0, 20]
    })

    // 2. Stats / Trends Table
    if (statsData && statsData.length > 0) {
      const tableBody = [
        statsData.map(s => ({ text: s.label, style: 'tableHeader', fontSize: 9 }))
      ]
      const valuesRow = statsData.map(s => ({
        text: `${s.value} ${s.unit}\n(${s.diff > 0 ? '+' : ''}${s.diff}%)`,
        style: 'tableCell',
        alignment: 'center',
        color: s.status === 'up' ? 'green' : 'red'
      }))
      tableBody.push(valuesRow)

      content.push({
        table: {
          headerRows: 1,
          widths: Array(statsData.length).fill('*'),
          body: tableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      })

      // Re-implement simplified widths since we don't have Matrix helper active here
      content[content.length - 1].table.widths = Array(statsData.length).fill('*')
    }

    // 3. Charts Section
    if (chartsImages.performance) {
      content.push({ text: 'Evolución de Rendimiento', style: 'sectionHeader' })
      content.push({ image: chartsImages.performance, width: 500, alignment: 'center', margin: [0, 0, 0, 15] })
    }

    if (chartsImages.radar) {
      content.push({ text: 'Perfil Competitivo', style: 'sectionHeader', pageBreak: 'before' })
      content.push({ image: chartsImages.radar, width: 400, alignment: 'center', margin: [0, 0, 0, 15] })
    }

    if (chartsImages.anthropometric) {
      content.push({ text: 'Histórico de Medidas Corporales', style: 'sectionHeader', pageBreak: 'before' })
      content.push({ image: chartsImages.anthropometric, width: 520, alignment: 'center' })
    }

    const docDef = this._getBaseDocDefinition(content, 'Reporte de Rendimiento', `${atleta.nombre} ${atleta.apellido}`)
    pdfMake.createPdf(docDef).open()
  },

  /**
         * Generates Athlete List Report
         */
  generateAthleteListReport(athletes) {
    const tableBody = [
      // Header Row
      [
        { text: 'Nombre y Apellido', style: 'tableHeader' },
        { text: 'Categoría', style: 'tableHeader' },
        { text: 'Posición', style: 'tableHeader' },
        { text: 'Estatus', style: 'tableHeader' }
      ]
    ]

    // Data Rows
    athletes.forEach(a => {
      tableBody.push([
        { text: `${a.nombre} ${a.apellido}`, style: 'tableCell' },
        { text: a.categoria_nombre || '', style: 'tableCell' },
        { text: a.posicion_de_juego || '', style: 'tableCell' },
        { text: a.estatus || 'Activo', style: 'tableCell' }
      ])
    })

    const content = [
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]

    const docDef = this._getBaseDocDefinition(content, 'Lista de Atletas', 'Club Atlético Deportivo Acarigua')
    pdfMake.createPdf(docDef).open()
  },

  /**
         * Generates Individual Athlete Card Report
         */
  generateAthleteCardReport(atleta, medical, metrics, tests, tutor, photoBase64) {
    const content = []

    // 1. Header Info (Personal)
    content.push({
      columns: [
        // Avatar Placeholder
        photoBase64
          ? { image: photoBase64, width: 80, fit: [80, 80], alignment: 'center', margin: [0, 5, 0, 0] }
          : { width: 80, text: 'Sin Foto', alignment: 'center', margin: [0, 20, 0, 0], fontSize: 8 },
        {
          width: '*',
          stack: [
            { text: 'Datos Personales', style: 'sectionHeader' },
            {
              columns: [
                { width: 'auto', text: 'Edad: ', style: 'label' },
                { width: '*', text: atleta.fecha_nacimiento || '-', style: 'value' },
                { width: 'auto', text: 'Télefono: ', style: 'label' },
                { width: '*', text: atleta.telefono || 'N/A', style: 'value' }
              ],
              columnGap: 10,
              margin: [0, 0, 0, 5]
            },
            {
              columns: [
                { width: 'auto', text: 'Dirección: ', style: 'label' },
                { width: '*', text: atleta.direccion || 'No registrada', style: 'value' }
              ]
            }
          ]
        }
      ],
      columnGap: 20
    })

    // 2. Medical Info
    content.push({ text: 'Información Médica', style: 'sectionHeader' })
    if (medical) {
      content.push({
        columns: [
          { text: [{ text: 'Tipo Sanguíneo: ', style: 'label' }, { text: medical.tipo_sanguineo || 'N/A', style: 'value' }] },
          { text: [{ text: 'Alergias: ', style: 'label' }, { text: medical.alergias || 'Ninguna', style: 'value' }] },
          { text: [{ text: 'Condición: ', style: 'label' }, { text: medical.condicion_medica || 'Ninguna', style: 'value' }] }
        ],
        margin: [0, 0, 0, 5]
      })
      content.push({ text: [{ text: 'Lesiones: ', style: 'label' }, { text: medical.lesion || 'Sin registro', style: 'value' }], margin: [0, 5, 0, 0] })
    } else {
      content.push({ text: 'No hay información médica registrada.', style: 'value', italics: true })
    }

    // 3. Metrics & Tests in 2 columns
    content.push({
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'Antropometría', style: 'sectionHeader' },
            metrics ? {
              columns: [
                { stack: [{ text: 'Peso', style: 'label' }, { text: metrics.peso + ' kg', style: 'value' }] },
                { stack: [{ text: 'Altura', style: 'label' }, { text: metrics.altura + ' cm', style: 'value' }] },
                { stack: [{ text: 'IMC', style: 'label' }, { text: metrics.indice_de_masa, style: 'value' }] }
              ]
            } : { text: 'Sin registros.', style: 'value', italics: true }
          ]
        },
        {
          width: '50%',
          stack: [
            { text: 'Último Rendimiento', style: 'sectionHeader' },
            tests ? {
              columns: [
                { stack: [{ text: 'Fuerza', style: 'label' }, { text: tests.test_de_fuerza, style: 'value' }] },
                { stack: [{ text: 'Velocidad', style: 'label' }, { text: tests.test_velocidad, style: 'value' }] },
                { stack: [{ text: 'Resistencia', style: 'label' }, { text: tests.test_resistencia, style: 'value' }] }
              ]
            } : { text: 'Sin tests.', style: 'value', italics: true }
          ]
        }
      ],
      columnGap: 20
    })

    // 4. Tutor
    content.push({ text: 'Información del Tutor', style: 'sectionHeader' })
    if (tutor) {
      content.push({
        columns: [
          { text: [{ text: 'Nombre: ', style: 'label' }, { text: tutor.nombre_completo, style: 'value' }] },
          { text: [{ text: 'Relación: ', style: 'label' }, { text: tutor.tipo_relacion, style: 'value' }] },
          { text: [{ text: 'Teléfono: ', style: 'label' }, { text: tutor.telefono, style: 'value' }] }
        ]
      })
    } else {
      content.push({ text: 'No hay tutor asignado.', style: 'value', italics: true })
    }

    const docDef = this._getBaseDocDefinition(content, 'Ficha Técnica de Atleta', `${atleta.nombre} ${atleta.apellido}`)
    pdfMake.createPdf(docDef).open()
  },

  /**
         * Generates Attendance Report (General Table)
         */
  generateAttendanceReport(attendanceData, categoryName, dates) {
    const tableBody = [
      [
        { text: 'Atleta', style: 'tableHeader' },
        { text: 'Presente', style: 'tableHeader' },
        { text: 'Ausente', style: 'tableHeader' },
        { text: 'Justificado', style: 'tableHeader' },
        { text: '% Asistencia', style: 'tableHeader' }
      ]
    ]

    attendanceData.forEach(row => {
      let percentColor = '#333'
      const p = parseFloat(row.percentage)
      if (p < 50) percentColor = 'red'
      else if (p < 80) percentColor = 'orange'
      else percentColor = 'green'

      tableBody.push([
        { text: row.athlete_name, style: 'tableCell' },
        { text: row.present_count, style: 'tableCell', alignment: 'center' },
        { text: row.absent_count, style: 'tableCell', alignment: 'center' },
        { text: row.justified_count, style: 'tableCell', alignment: 'center' },
        { text: row.percentage + '%', style: 'tableCell', alignment: 'center', color: percentColor, bold: true }
      ])
    })

    const content = [
      { text: `Rango: ${dates ? dates.join(' al ') : 'Todo el periodo'}`, style: 'reportSubtitle', margin: [0, -10, 0, 10], fontSize: 10 },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]

    const docDef = this._getBaseDocDefinition(content, 'Reporte de Asistencia', categoryName || 'Todas las Categorías')
    pdfMake.createPdf(docDef).open()
  },

  /**
         * Generates Individual Attendance Detail
         */
  generateIndividualAttendanceReport(athleteName, attendanceList) {
    const tableBody = [
      [
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Estatus', style: 'tableHeader' },
        { text: 'Observación', style: 'tableHeader' }
      ]
    ]

    attendanceList.forEach(item => {
      let statusColor = 'black'
      if (item.estatus === 'PRESENTE') statusColor = 'green'
      if (item.estatus === 'AUSENTE') statusColor = 'red'
      if (item.estatus === 'JUSTIFICADO') statusColor = 'orange'

      tableBody.push([
        { text: new Date(item.fecha).toLocaleDateString(), style: 'tableCell' },
        { text: item.estatus, style: 'tableCell', color: statusColor, bold: true },
        { text: item.observacion || '-', style: 'tableCell' }
      ])
    })

    const content = [
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      }
    ]

    const docDef = this._getBaseDocDefinition(content, 'Detalle de Asistencia', athleteName)
    pdfMake.createPdf(docDef).open()
  }
}

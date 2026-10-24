const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, ImageRun, LevelFormat, BorderStyle,
  Footer, PageNumber, PageBreak,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Times New Roman';
const PAGE_W = 11906, MARGIN = 1304; // A4, ~2.3 cm margins
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9298

// ---------- inline markup: **bold**, *italic*, `code`, [[FILL: ...]] ----------
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\[[^\]]+\]\])/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('[[')) out.push(new TextRun({ text: '[' + t.slice(2, -2) + ']', highlight: 'yellow', ...base }));
    else if (t.startsWith('`')) out.push(new TextRun({ ...base, text: t.slice(1, -1), font: 'Consolas', size: (base.size || 24) - 3 }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const P = (text, opts = {}) => new Paragraph({
  children: runs(text, opts.run || {}),
  spacing: { after: 120, line: 300 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  ...(opts.indent ? { indent: opts.indent } : {}),
});
const H1 = (t) => new Paragraph({ keepNext: true, heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], spacing: { before: 300, after: 140 } });
const H2 = (t) => new Paragraph({ keepNext: true, heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], spacing: { before: 200, after: 100 } });
const B = (text, level = 0) => new Paragraph({
  children: runs(text), numbering: { reference: 'bullets', level },
  spacing: { after: 60, line: 290 }, alignment: AlignmentType.LEFT,
});
const N = (text, ref = 'steps') => new Paragraph({
  children: runs(text), numbering: { reference: ref, level: 0 },
  spacing: { after: 60, line: 290 }, alignment: AlignmentType.LEFT,
});
const Caption = (t) => new Paragraph({ children: runs(t, { italics: true, size: 20 }), spacing: { before: 60, after: 160 }, alignment: AlignmentType.LEFT });

function code(src) {
  return src.replace(/\t/g, '  ').split('\n').map((line, i, arr) => new Paragraph({
    children: [new TextRun({ text: line.length ? line : ' ', font: 'Consolas', size: 16 })],
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
    spacing: { after: 0, line: 220, before: i === 0 ? 60 : 0 },
    ...(i === arr.length - 1 ? { spacing: { after: 160, line: 220 } } : {}),
    alignment: AlignmentType.LEFT,
  }));
}

const border = { style: BorderStyle.SINGLE, size: 4, color: '8C8C8C' };
const borders = { top: border, bottom: border, left: border, right: border };

function table(header, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = CONTENT_W / total;
  const w = widths.map((x) => Math.floor(x * scale));
  w[w.length - 1] += CONTENT_W - w.reduce((a, b) => a + b, 0);
  const size = opts.size || 19;
  const cell = (text, i, head) => new TableCell({
    width: { size: w[i], type: WidthType.DXA },
    borders,
    shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'DCE6F0' } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: String(text).split('\n').map((t) => new Paragraph({
      children: runs(t, { size, ...(head ? { bold: true } : {}) }),
      spacing: { after: 20, line: 250 }, alignment: AlignmentType.LEFT,
    })),
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 80 } });

function image(file, widthPx, heightPx) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: widthPx, height: heightPx } })],
  });
}

const content = require('./report_content.js')({ P, H1, H2, B, N, Caption, code, table, gap, image, ROOT, PageBreak, Paragraph, TextRun, runs, AlignmentType });

const doc = new Document({
  creator: 'Ashkenov Nurgaly, Orazbek Ulan',
  title: 'Assignment 3. Methodology and Core Practical Implementation',
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: '1F3864' }, paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, font: FONT, color: '2E4A7A' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } },
      ] },
      ...['steps', 'steps2', 'steps3', 'steps4'].map((ref) => ({ reference: ref, levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
      ] })),
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1134, bottom: 1134, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
    children: content,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, 'Assignment3_Ashkenov_Orazbek.docx');
  fs.writeFileSync(out, buf);
  console.log('written', out);
});

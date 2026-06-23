const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// PDF generation endpoint
app.post('/api/generate-pdf', (req, res) => {
    const data = req.body;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ergebnis_${(data.name || 'Unbekannt').replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`);
    doc.pipe(res);

    const pw = 495; // page width usable
    const blue = '#1B4F72';
    const accent = '#2E86C1';
    const green = '#27AE60';
    const red = '#C0392B';
    const gray = '#666666';

    // Header
    doc.rect(50, 50, pw, 80).fill(blue);
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff');
    doc.text('HTML & CSS Prüfungstrainer', 70, 65);
    doc.fontSize(11).font('Helvetica').fillColor('#D6EAF8');
    doc.text('Ergebnisbericht zum Lebenslauf-Projekt', 70, 95);

    // Name + Date box
    let y = 155;
    doc.roundedRect(50, y, pw, 50, 5).fill('#F0F4F8');
    doc.font('Helvetica-Bold').fontSize(12).fillColor(blue);
    doc.text('Name:', 65, y + 10);
    doc.font('Helvetica').fillColor('#333');
    doc.text(data.name || 'Nicht angegeben', 115, y + 10);

    const dateStr = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.font('Helvetica-Bold').fillColor(blue);
    doc.text('Datum:', 350, y + 10);
    doc.font('Helvetica').fillColor('#333');
    doc.text(dateStr, 400, y + 10);

    doc.font('Helvetica-Bold').fillColor(blue);
    doc.text('Klasse:', 65, y + 28);
    doc.font('Helvetica').fillColor('#333');
    doc.text(data.klasse || '-', 115, y + 28);

    // Score overview
    y = 230;
    const totalPct = data.maxPoints > 0 ? Math.round((data.totalPoints / data.maxPoints) * 100) : 0;
    const scoreColor = totalPct >= 90 ? green : totalPct >= 70 ? '#2E86C1' : totalPct >= 50 ? '#E67E22' : red;

    doc.roundedRect(50, y, pw, 65, 5).fill(scoreColor);
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff');
    doc.text(`${data.totalPoints} / ${data.maxPoints} Punkte`, 0, y + 8, { width: pw + 100, align: 'center' });
    doc.fontSize(14);
    doc.text(`${totalPct}%`, 0, y + 40, { width: pw + 100, align: 'center' });

    // Category breakdown
    y = 320;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(blue);
    doc.text('Ergebnisse nach Kategorie', 50, y);
    y += 25;

    const categories = data.categories || [];
    categories.forEach((cat, i) => {
        const bg = i % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
        doc.rect(50, y, pw, 22).fill(bg);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(blue);
        doc.text(cat.name, 60, y + 5);

        const catPct = cat.max > 0 ? Math.round((cat.points / cat.max) * 100) : 0;
        const barW = 150;
        const barH = 10;
        const barX = 300;
        doc.rect(barX, y + 6, barW, barH).fill('#E8E8E8');
        const fillCol = catPct >= 70 ? green : catPct >= 40 ? '#E67E22' : red;
        doc.rect(barX, y + 6, barW * catPct / 100, barH).fill(fillCol);

        doc.font('Helvetica').fontSize(10).fillColor('#333');
        doc.text(`${cat.points}/${cat.max} (${catPct}%)`, barX + barW + 10, y + 5);
        y += 22;
    });

    // Question details
    y += 20;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(blue);
    doc.text('Einzelne Aufgaben', 50, y);
    y += 20;

    const questions = data.questions || [];
    questions.forEach((q, i) => {
        if (y > 720) {
            doc.addPage();
            y = 50;
        }

        const bg = q.correct ? '#F0FAF0' : '#FFF0F0';
        const icon = q.correct ? '✓' : '✗';
        const iconCol = q.correct ? green : red;

        const qHeight = Math.max(35, 15 + (q.answer ? 15 : 0));
        doc.rect(50, y, pw, qHeight).fill(bg);

        doc.font('Helvetica-Bold').fontSize(10).fillColor(iconCol);
        doc.text(icon, 58, y + 4);

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333');
        doc.text(`${i + 1}. ${q.title}`, 75, y + 4, { width: 350 });

        doc.font('Helvetica').fontSize(9).fillColor(gray);
        doc.text(`${q.points}/${q.max} P.`, pw - 10, y + 4, { width: 60, align: 'right' });

        if (q.answer) {
            doc.font('Helvetica').fontSize(8).fillColor(gray);
            doc.text(`Antwort: ${q.answer}`, 75, y + 18, { width: 400 });
        }

        y += qHeight + 3;
    });

    // Footer
    if (y > 700) { doc.addPage(); y = 50; }
    y = Math.max(y + 20, 700);
    doc.moveTo(50, y).lineTo(50 + pw, y).strokeColor('#ddd').stroke();
    doc.font('Helvetica').fontSize(9).fillColor(gray);
    doc.text(`Erstellt am ${dateStr} | HTML & CSS Prüfungstrainer | BPI Mödling - GINF`, 0, y + 10, { width: pw + 100, align: 'center' });

    doc.end();
});

app.listen(PORT, () => {
    console.log(`HTML/CSS Prüfungstrainer läuft auf Port ${PORT}`);
});

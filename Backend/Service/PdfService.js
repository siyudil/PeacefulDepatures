// Service/pdfService.js
const PDFDocument = require('pdfkit');

class PDFService {
    static generatePackagePDF(pkg) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Header
                doc.rect(0, 0, 612, 100).fill('#2c3e50');
                doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff')
                   .text('PACKAGE DETAILS', 0, 40, { align: 'center' });

                let y = 120;

                const safeText = (text) => text || 'N/A';

                // Package Name
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#e74c3c')
                   .text(safeText(pkg.PackageName), 100, y);
                y += 40;

                // Package ID & Type
                doc.fontSize(12).font('Helvetica').fillColor('#7f8c8d')
                   .text(`Package ID: ${safeText(pkg.PackageId)}`, 100, y);
                doc.text(`Type: ${safeText(pkg.PackageType)}`, 300, y);
                y += 25;

                // Pricing
                const basePrice = pkg.BasePrice || 0;
                const finalPrice = pkg.FinalPrice || 0;
                const discount = basePrice > finalPrice ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

                doc.fontSize(16).fillColor('#2c3e50').text('Pricing:', 100, y);
                y += 25;

                if (discount > 0) {
                    doc.fontSize(14).fillColor('#7f8c8d').text(`Base Price: $${basePrice}`, 120, y, { strike: true });
                    y += 20;
                }

                doc.fontSize(18).fillColor('#27ae60').text(`Final Price: $${finalPrice}`, 120, y);
                if (discount > 0) doc.fontSize(12).fillColor('#e74c3c').text(`(${discount}% OFF)`, 250, y);
                y += 40;

                // Duration & Availability
                doc.fontSize(14).fillColor('#2c3e50').text(`Duration: ${pkg.Duration || 0} days`, 100, y);
                doc.text(`Availability: ${safeText(pkg.Availability)}`, 300, y);
                y += 40;

                // Description
                doc.fontSize(16).fillColor('#2c3e50').text('Description:', 100, y);
                y += 25;
                doc.fontSize(11).fillColor('#34495e').text(safeText(pkg.Description), 100, y, {
                    width: 400,
                    align: 'justify',
                    lineGap: 5
                });

                y += doc.heightOfString(safeText(pkg.Description), { width: 400, lineGap: 5 }) + 30;

                // Highlights
                doc.fontSize(16).fillColor('#2c3e50').text('Package Highlights:', 100, y);
                y += 25;
                const highlights = [
                    `✅ ${pkg.Duration || 0}-day package duration`,
                    `✅ ${safeText(pkg.PackageType)} type package`,
                    `✅ ${safeText(pkg.Availability)} for booking`,
                    `✅ Competitive pricing with ${discount > 0 ? discount + '% discount' : 'best rates'}`,
                    `✅ Package ID: ${safeText(pkg.PackageId)}`,
                    `✅ Created: ${new Date(pkg.createdAt || new Date()).toLocaleDateString()}`
                ];
                highlights.forEach(h => {
                    if (y > 700) { doc.addPage(); y = 100; }
                    doc.fontSize(11).fillColor('#2c3e50').text(h, 120, y);
                    y += 20;
                });

                // Footer
                doc.fontSize(10).fillColor('#95a5a6')
                   .text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 750);
                doc.text('Package Management System', 400, 750, { align: 'right' });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static generateAllPackagesPDF(packages) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                doc.rect(0, 0, 612, 80).fill('#2c3e50');
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
                   .text('ALL PACKAGES CATALOG', 0, 30, { align: 'center' });

                let y = 100;
                packages.forEach((pkg, i) => {
                    if (y > 700) { doc.addPage(); y = 100; }

                    const safeText = (text) => text || 'N/A';
                    const basePrice = pkg.BasePrice || 0;
                    const finalPrice = pkg.FinalPrice || 0;
                    const discount = basePrice > finalPrice ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

                    doc.fontSize(16).font('Helvetica-Bold').fillColor('#2c3e50').text(`${i + 1}. ${safeText(pkg.PackageName)}`, 50, y);
                    y += 25;

                    doc.fontSize(10).fillColor('#7f8c8d')
                       .text(`ID: ${safeText(pkg.PackageId)} | Type: ${safeText(pkg.PackageType)} | Duration: ${pkg.Duration || 0} days`, 70, y);
                    y += 20;

                    doc.fontSize(12).fillColor('#27ae60').text(`Price: $${finalPrice}`, 70, y);
                    if (discount > 0) doc.text(`(${discount}% OFF from $${basePrice})`, 150, y);
                    y += 20;

                    doc.fontSize(10).fillColor(pkg.Availability === 'Available' ? '#27ae60' : '#e74c3c')
                       .text(`Status: ${safeText(pkg.Availability)}`, 70, y);
                    y += 25;

                    const shortDesc = pkg.Description && pkg.Description.length > 100 ?
                        pkg.Description.substring(0, 100) + '...' : pkg.Description || 'No description available';
                    doc.fontSize(9).fillColor('#7f8c8d').text(`Description: ${shortDesc}`, 70, y, { width: 450 });
                    y += 35;

                    doc.moveTo(50, y).lineTo(550, y).stroke('#bdc3c7');
                    y += 30;
                });

                doc.fontSize(10).fillColor('#95a5a6')
                   .text(`Generated on: ${new Date().toLocaleDateString()} | Total Packages: ${packages.length}`, 50, 750, { align: 'center' });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static generateSelectedPackagesPDF(packages) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                doc.rect(0, 0, 612, 80).fill('#2c3e50');
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
                   .text('SELECTED PACKAGES', 0, 30, { align: 'center' });

                let y = 100;
                packages.forEach((pkg, i) => {
                    if (y > 700) { doc.addPage(); y = 100; }

                    const safeText = (text) => text || 'N/A';
                    const basePrice = pkg.BasePrice || 0;
                    const finalPrice = pkg.FinalPrice || 0;

                    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(`${i + 1}. ${safeText(pkg.PackageName)}`, 50, y);
                    y += 20;

                    doc.fontSize(10).fillColor('#7f8c8d').text(`ID: ${safeText(pkg.PackageId)} | Type: ${safeText(pkg.PackageType)}`, 70, y);
                    y += 15;

                    doc.fontSize(12).fillColor('#27ae60').text(`Price: $${finalPrice} | Duration: ${pkg.Duration || 0} days`, 70, y);
                    y += 20;

                    doc.fontSize(10).fillColor(pkg.Availability === 'Available' ? '#27ae60' : '#e74c3c')
                       .text(`Availability: ${safeText(pkg.Availability)}`, 70, y);
                    y += 25;

                    doc.moveTo(50, y).lineTo(550, y).stroke('#bdc3c7');
                    y += 30;
                });

                doc.fontSize(10).fillColor('#95a5a6')
                   .text(`Generated on: ${new Date().toLocaleDateString()} | Selected Packages: ${packages.length}`, 50, 750, { align: 'center' });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = PDFService;

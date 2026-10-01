const PDFDocument = require('pdfkit');

const generatePDFInvoice = (order, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // Header
  doc
    .fillColor('#1A1A1A')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('CLAYVISTA', 40, 45)
    .fontSize(9)
    .fillColor('#C46A4A')
    .text('PREMIUM PORCELAIN & CERAMIC TABLEWARE', 40, 72)
    .fillColor('#666666')
    .text('GSTIN: 07AAACC4298M1Z8 | FSSAI: 10020011003412', 40, 85)
    .text(process.env.STORE_ADDRESS || 'House no. 4, Gali no. 7, Shiv Shakti Enclave, Titu Colony, Faridabad, Haryana, India, 121003', 40, 97);

  // Invoice Title & Meta (Right aligned)
  doc
    .fontSize(16)
    .fillColor('#1A1A1A')
    .font('Helvetica-Bold')
    .text('TAX INVOICE', 380, 45, { align: 'right' })
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#444444')
    .text(`Invoice No: INV-${order.orderNumber}`, 380, 68, { align: 'right' })
    .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 380, 81, { align: 'right' })
    .text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})`, 380, 94, { align: 'right' });

  // Divider
  doc
    .strokeColor('#C46A4A')
    .lineWidth(2)
    .moveTo(40, 115)
    .lineTo(555, 115)
    .stroke();

  // Customer / Billing / Shipping Info
  let topInfoY = 130;
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#1A1A1A')
    .text('BILLED & SHIPPED TO:', 40, topInfoY);

  const ship = order.customerDetails.shippingAddress;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#444444')
    .text(`Customer: ${order.customerDetails.name}`, 40, topInfoY + 16)
    .text(`Email: ${order.customerDetails.email} | Phone: ${order.customerDetails.phone}`, 40, topInfoY + 28)
    .text(`Address: ${ship.street}${ship.apartment ? ', ' + ship.apartment : ''}`, 40, topInfoY + 40)
    .text(`${ship.city}, ${ship.state} - ${ship.pincode}, ${ship.country || 'India'}`, 40, topInfoY + 52);

  // Table Header
  const tableTop = 205;
  doc
    .rect(40, tableTop, 515, 22)
    .fill('#F7F7F5');

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#1A1A1A')
    .text('SL', 48, tableTop + 6)
    .text('ITEM DESCRIPTION', 75, tableTop + 6)
    .text('QTY', 360, tableTop + 6, { width: 35, align: 'center' })
    .text('RATE (INR)', 410, tableTop + 6, { width: 65, align: 'right' })
    .text('TOTAL (INR)', 485, tableTop + 6, { width: 65, align: 'right' });

  let y = tableTop + 26;
  order.orderItems.forEach((item, index) => {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#333333')
      .text(`${index + 1}`, 48, y)
      .text(item.name, 75, y, { width: 275 })
      .text(`${item.quantity}`, 360, y, { width: 35, align: 'center' })
      .text(`₹${item.price.toLocaleString('en-IN')}`, 410, y, { width: 65, align: 'right' })
      .text(`₹${item.total.toLocaleString('en-IN')}`, 485, y, { width: 65, align: 'right' });

    y += 24;
  });

  // Table footer line
  doc
    .strokeColor('#E0E0E0')
    .lineWidth(1)
    .moveTo(40, y + 5)
    .lineTo(555, y + 5)
    .stroke();

  y += 15;

  // Totals Breakdown
  const totalsX = 350;
  doc
    .fontSize(9)
    .font('Helvetica')
    .text('Subtotal:', totalsX, y, { width: 110, align: 'right' })
    .text(`₹${order.subtotal.toLocaleString('en-IN')}`, 470, y, { width: 85, align: 'right' });

  y += 16;
  doc
    .text('CGST (9%) + SGST (9%):', totalsX, y, { width: 110, align: 'right' })
    .text(`₹${order.taxGst.toLocaleString('en-IN')}`, 470, y, { width: 85, align: 'right' });

  y += 16;
  doc
    .text('Insured Shipping:', totalsX, y, { width: 110, align: 'right' })
    .text(order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`, 470, y, { width: 85, align: 'right' });

  if (order.discountAmount > 0) {
    y += 16;
    doc
      .fillColor('#C46A4A')
      .text(`Coupon (${order.couponApplied?.code || 'DISCOUNT'}):`, totalsX, y, { width: 110, align: 'right' })
      .text(`-₹${order.discountAmount.toLocaleString('en-IN')}`, 470, y, { width: 85, align: 'right' })
      .fillColor('#333333');
  }

  y += 20;
  doc
    .rect(totalsX - 10, y - 5, 215, 26)
    .fill('#F7F7F5');

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1A1A1A')
    .text('GRAND TOTAL:', totalsX, y + 2, { width: 110, align: 'right' })
    .fillColor('#C46A4A')
    .text(`₹${order.grandTotal.toLocaleString('en-IN')}`, 470, y + 2, { width: 85, align: 'right' });

  // Notes & Footer
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#777777')
    .text('Terms & Conditions:', 40, 680)
    .text('1. All items are hand-inspected for thermal resilience and zero transit fractures.', 40, 692)
    .text('2. Ceramic care: Dishwasher and microwave safe unless gilded with precious metal lustre.', 40, 702)
    .text(`3. For transit damage claims or returns, notify ${process.env.STORE_EMAIL || 'Clayvistaindia@gmail.com'} within 48 hours.`, 40, 712)
    .fontSize(9)
    .fillColor('#C46A4A')
    .text('Thank you for welcoming ClayVista craftsmanship into your home.', 40, 745, { align: 'center', width: 515 });

  doc.end();
};

module.exports = { generatePDFInvoice };

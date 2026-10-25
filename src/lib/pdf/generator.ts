import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Reservation, Invoice, Agency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function generateContractPdf(reservation: Reservation, agency: Agency): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark Navy #0F172A
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(agency.name.toUpperCase(), 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("MASTER VEHICLE RENTAL AGREEMENT & TERMS", 14, 22);
  doc.text(`REFERENCE: ${reservation.reference}`, 150, 15);
  doc.text(`DATE: ${formatDate(new Date())}`, 150, 22);

  // Agency & Customer Info Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RENTAL AGENCY:", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.text(`${agency.name}\n${agency.address || "Main Office"}\nPhone: ${agency.phone || "N/A"}\nEmail: ${agency.email}`, 14, 48);

  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER / RENTER:", 110, 42);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${reservation.customer?.full_name || "Guest Customer"}\n${reservation.customer?.email || "N/A"}\nPhone: ${reservation.customer?.phone || "N/A"}\nID/Passport: ${reservation.customer?.id_number || "Verified"}`,
    110,
    48
  );

  // Vehicle Specifications Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 68, 182, 25, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("ALLOCATED FLEET VEHICLE", 18, 75);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const vText = reservation.vehicle 
    ? `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model} (${reservation.vehicle.category.toUpperCase()}) | REG: ${reservation.vehicle.registration_number} | VIN: ${reservation.vehicle.vin}`
    : "Vehicle not assigned";
  doc.text(vText, 18, 82);
  doc.text(`Pickup: ${new Date(reservation.pickup_datetime).toLocaleString()} (${reservation.pickup_location})`, 18, 88);
  doc.text(`Return: ${new Date(reservation.return_datetime).toLocaleString()} (${reservation.return_location})`, 110, 88);

  // Itemized Financial Charges Table
  const tableRows = [
    ["Base Vehicle Rental Rate", `${reservation.rental_days} Day(s) @ ${formatCurrency(reservation.daily_rate, agency.default_currency)}/day`, formatCurrency(reservation.base_rental_amount, agency.default_currency)],
    ...(reservation.extras?.map(e => [e.name, `Qty: ${e.quantity} @ ${formatCurrency(e.unit_price, agency.default_currency)}`, formatCurrency(e.total_price, agency.default_currency)]) || []),
    ...(reservation.delivery_fee > 0 ? [["Curbside Delivery / Collection Fee", "Flat Location Dispatch", formatCurrency(reservation.delivery_fee, agency.default_currency)]] : []),
    ...(reservation.discount_amount > 0 ? [["Promotional / Corporate Discount", "Applied Special Rate", `-${formatCurrency(reservation.discount_amount, agency.default_currency)}`]] : []),
    ["State & Local Sales Tax", `${agency.tax_rate}% Standard Tax Rate`, formatCurrency(reservation.tax_amount, agency.default_currency)],
    ["REFUNDABLE SECURITY DEPOSIT", "Authorized Hold (Non-earned deposit)", formatCurrency(reservation.deposit_amount, agency.default_currency)],
  ];

  autoTable(doc, {
    startY: 98,
    head: [["Description", "Details / Breakdown", "Amount"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 65 },
      2: { cellWidth: 37, halign: "right" },
    },
  });

  // Summary Totals
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`TOTAL CONTRACT DUE: ${formatCurrency(reservation.total_amount, agency.default_currency)}`, 130, finalY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Amount Paid to Date: ${formatCurrency(reservation.amount_paid, agency.default_currency)}`, 130, finalY + 6);
  doc.text(`Balance Remaining: ${formatCurrency(reservation.total_amount - reservation.amount_paid, agency.default_currency)}`, 130, finalY + 11);

  // Contract Terms Highlights
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const terms = [
    "1. AUTHORIZED OPERATORS: Only drivers documented in this agreement with verified active licences may operate the vehicle.",
    "2. FUEL & MILEAGE POLICY: Vehicle must be returned with the same fuel/battery level as documented on departure inspection.",
    "3. DAMAGE LIABILITY & DEPOSIT: The customer authorizes deductions from the security deposit for missing equipment, late return, or damage.",
    "4. JURISDICTION: This contract is executed under and governed by the laws of the operating state.",
  ];
  let termY = finalY + 22;
  terms.forEach(t => {
    doc.text(t, 14, termY);
    termY += 4.5;
  });

  // Signature Blocks
  termY += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, termY + 15, 90, termY + 15);
  doc.line(110, termY + 15, 186, termY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("CUSTOMER SIGNATURE / ACKNOWLEDGEMENT", 14, termY + 20);
  doc.text("AUTHORIZED FLEET REPRESENTATIVE", 110, termY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Date signed: ____________________", 14, termY + 25);
  doc.text("Date executed: ____________________", 110, termY + 25);

  return doc;
}

export function generateInvoicePdf(invoice: Invoice, agency: Agency): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Banner
  doc.setFillColor(37, 99, 235); // Brand Blue #2563EB
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(agency.name.toUpperCase(), 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`TAX INVOICE / RECEIPT: ${invoice.invoice_number}`, 14, 22);
  doc.text(`ISSUE DATE: ${invoice.issue_date}`, 150, 14);
  doc.text(`STATUS: ${invoice.status.toUpperCase()}`, 150, 22);

  // Billing Party Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ISSUED BY:", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${agency.name}\n${agency.address || ""}\nTax Reg: ${agency.registration_number || "US-TAX-8812"}\nEmail: ${agency.email}`, 14, 46);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILLED TO:", 110, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${invoice.customer?.full_name || "Customer"}\n${invoice.customer?.email || ""}\n${invoice.customer?.address || "On File"}\nPhone: ${invoice.customer?.phone || ""}`, 110, 46);

  // Line Items Table
  const tableRows = [
    ["Vehicle Rental Service & Charges", "Standard reservation booking", formatCurrency(invoice.subtotal, agency.default_currency)],
    [`Sales & Operational Tax (${agency.tax_rate}%)`, "Applicable state VAT/Sales tax", formatCurrency(invoice.tax_amount, agency.default_currency)],
  ];

  autoTable(doc, {
    startY: 68,
    head: [["Item Description", "Details", "Amount"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 55 },
      2: { cellWidth: 37, halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`TOTAL AMOUNT: ${formatCurrency(invoice.total_amount, agency.default_currency)}`, 125, finalY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Amount Paid: ${formatCurrency(invoice.paid_amount, agency.default_currency)}`, 125, finalY + 6);
  doc.setFont("helvetica", "bold");
  doc.text(`OUTSTANDING BALANCE: ${formatCurrency(invoice.total_amount - invoice.paid_amount, agency.default_currency)}`, 125, finalY + 12);

  // Payment instructions footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business. For electronic payment questions, contact billing at " + agency.email, 14, finalY + 30);

  return doc;
}

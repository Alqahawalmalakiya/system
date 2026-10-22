import {totals} from './invoice-values.mjs';

// Stored basePrice remains VAT-inclusive for compatibility with existing invoices/API.
export function priceEntry(invoice) {
 const base = invoice.basePrice ?? invoice.price;
 const taxRate = invoice.taxRate || 0;
 const price = String(Math.round(base * 100 / (100 + taxRate)) / 100);
 return {price, originalPrice: {price, taxRate, base}};
}

export function enteredBase(form) {
 const original = form.originalPrice;
 if (original && form.price === original.price && form.taxRate === original.taxRate) return original.base;
 const net = Math.round(Number(form.price || 0) * 100);
 return net + Math.round(net * form.taxRate / 100);
}

export function enteredTotal(form) {
 return totals(enteredBase(form), Number(form.discountRate || 0)).price;
}

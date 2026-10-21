/** Monetary values are integer halalas; discount is applied to the VAT-inclusive price. */
export function totals(basePrice, discountRate = 0, taxRate = 0) {
 const discount = Math.round(basePrice * discountRate / 100);
 const price = basePrice - discount;
 const net = taxRate ? Math.round(price * 100 / (100 + taxRate)) : price;
 return {price, discount, net, tax: price - net};
}
export function validDate(value) {
 if (value === '') return true;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0,4)==='0000') return false;
 const date = new Date(value + 'T12:00:00Z');
 return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function validTime(value) {return value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
export function formatTime(value) {
 if (!value || !validTime(value)) return '';
 const [h,m] = value.split(':');
 return `${Number(h)%12 || 12}:${m} ${Number(h)<12?'صباحًا':'مساءً'}`;
}
export function timeRange(start, end = '') {
 return [formatTime(start),formatTime(end)].filter(Boolean).join(' إلى ') + (start && end && end < start ? ' (اليوم التالي)' : '');
}

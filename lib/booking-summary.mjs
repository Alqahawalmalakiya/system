export const isPendingQuote = row => row.documentType === 'quote' && row.status === 'confirmed';

export function balanceGroups(rows, today) {
 const groups = [
  {key:'past', label:'مناسبات مضى تاريخها', rows:[], total:0},
  {key:'today', label:'مناسبات اليوم', rows:[], total:0},
  {key:'future', label:'مناسبات قادمة', rows:[], total:0},
  {key:'undated', label:'بدون تاريخ محدد', rows:[], total:0},
 ];
 for (const row of rows) {
  if(row.documentType === 'quote' || row.status === 'completed' || row.price <= row.paid) continue;
  const index = !row.date ? 3 : row.date < today ? 0 : row.date === today ? 1 : 2;
  groups[index].rows.push(row);
  groups[index].total += row.price - row.paid;
 }
 for(const group of groups) group.rows.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.invoice.localeCompare(b.invoice));
 return groups;
}

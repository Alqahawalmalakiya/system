/** @param {{status:string,date:string}} booking @param {string} currentDate */
export function getBookingAppearance(booking,currentDate){
 if(booking.status==='cancelled')return {kind:'cancelled',label:'ملغى'};
 if(booking.status==='completed'||booking.date<currentDate)return {kind:'ended',label:'انتهت'};
 if(booking.date===currentDate)return {kind:'today',label:'اليوم'};
 return {kind:'upcoming',label:'مؤكد'};
}

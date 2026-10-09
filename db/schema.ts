import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const bookings=sqliteTable('bookings',{
 id:text('id').primaryKey(), invoice:text('invoice').notNull(), customer:text('customer').notNull(), phone:text('phone').notNull().default(''), occasion:text('occasion').notNull(), date:text('date').notNull(), time:text('time').notNull().default(''), place:text('place').notNull().default(''), price:integer('price').notNull(), paid:integer('paid').notNull(), notes:text('notes').notNull().default(''), status:text('status').notNull().default('confirmed'), mode:text('mode').notNull().default('hospitality'), items:text('items').notNull().default('[]'), taxRate:integer('tax_rate').notNull().default(0), createdAt:text('created_at').notNull()
});
export const foods=sqliteTable('foods',{name:text('name').primaryKey(),price:integer('price').notNull()});
export const invoiceNumbers=sqliteTable('invoice_numbers',{id:integer('id').primaryKey({autoIncrement:true}),bookingId:text('booking_id').notNull().unique()});

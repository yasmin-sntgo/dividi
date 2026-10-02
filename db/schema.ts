import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const accounts=sqliteTable('accounts',{owner:text('owner').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(0)});

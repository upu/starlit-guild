import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const gameSaves=sqliteTable('game_saves',{userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
export const gameSaveBackups=sqliteTable('game_save_backups',{userId:text('user_id').primaryKey(),data:text('data').notNull(),createdAt:integer('created_at').notNull()});

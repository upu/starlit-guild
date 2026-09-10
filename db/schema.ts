import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const gameSaves=sqliteTable('game_saves',{userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
export const gameSaveBackups=sqliteTable('game_save_backups',{userId:text('user_id').primaryKey(),data:text('data').notNull(),createdAt:integer('created_at').notNull()});
export const gameDeviceBackups=sqliteTable('game_device_backups',{id:text('id').primaryKey(),userId:text('user_id').notNull(),deviceId:text('device_id').notNull(),data:text('data').notNull(),updatedAt:integer('updated_at').notNull(),revision:integer('revision').notNull()});

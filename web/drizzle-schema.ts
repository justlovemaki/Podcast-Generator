import { sqliteTable, AnySQLiteColumn, foreignKey, check, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	check("points_accounts_check_1", sql`total_points >= 0`),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	uniqueIndex("session_token_unique").on(table.token),
	check("points_accounts_check_1", sql`total_points >= 0`),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").notNull(),
	image: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	username: text(),
	displayUsername: text("display_username"),
},
(table) => [
	uniqueIndex("user_username_unique").on(table.username),
	uniqueIndex("user_email_unique").on(table.email),
	check("points_accounts_check_1", sql`total_points >= 0`),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
	updatedAt: integer("updated_at"),
},
(table) => [
	check("points_accounts_check_1", sql`total_points >= 0`),
]);

export const pointsAccounts = sqliteTable("points_accounts", {
	accountId: integer("account_id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	totalPoints: integer("total_points").default(0).notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	index("idx_points_accounts_user_id").on(table.userId),
	uniqueIndex("points_accounts_user_id_unique").on(table.userId),
	check("points_accounts_check_1", sql`total_points >= 0`),
]);

export const pointsTransactions = sqliteTable("points_transactions", {
	transactionId: integer("transaction_id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	pointsChange: integer("points_change").notNull(),
	reasonCode: text("reason_code").notNull(),
	description: text(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
},
(table) => [
	index("idx_points_transactions_user_id").on(table.userId),
	check("points_accounts_check_1", sql`total_points >= 0`),
]);


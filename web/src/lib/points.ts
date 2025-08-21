import { db } from "@/lib/database";
import * as schema from "../../drizzle-schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * 创建用户的初始积分账户。
 * @param userId 用户ID
 * @param initialPoints 初始积分数量
 * @returns Promise<void>
 */
export async function createPointsAccount(userId: string, initialPoints: number = 100): Promise<void> {
  try {
    await db.insert(schema.pointsAccounts).values({
      userId: userId,
      totalPoints: initialPoints,
      updatedAt: new Date().toISOString(),
    });
    console.log(`用户 ${userId} 的积分账户初始化成功，初始积分：${initialPoints}`);
  } catch (error) {
    console.error(`初始化用户 ${userId} 积分账户失败:`, error);
    throw error; // 抛出错误以便调用方处理
  }
}

/**
 * 记录积分交易流水。
 * @param userId 用户ID
 * @param pointsChange 积分变动数量 (正数表示增加，负数表示减少)
 * @param reasonCode 交易原因代码 (例如: "initial_bonus", "purchase", "redeem")
 * @param description 交易描述 (可选)
 * @returns Promise<void>
 */
export async function recordPointsTransaction(
  userId: string,
  pointsChange: number,
  reasonCode: string,
  description?: string
): Promise<void> {
  try {
    await db.insert(schema.pointsTransactions).values({
      userId: userId,
      pointsChange: pointsChange,
      reasonCode: reasonCode,
      description: description,
      createdAt: new Date().toISOString(),
    });
    console.log(`用户 ${userId} 的积分流水记录成功: 变动 ${pointsChange}, 原因 ${reasonCode}`);
  } catch (error) {
    console.error(`记录用户 ${userId} 积分流水失败:`, error);
    throw error; // 抛出错误以便调用方处理
  }
}
/**
 * 检查用户是否已存在积分账户。
 * @param userId 用户ID
 * @returns Promise<boolean> 如果存在则返回 true，否则返回 false
 */
export async function checkUserPointsAccount(userId: string): Promise<boolean> {
  const existingPointsAccount = await db
    .select()
    .from(schema.pointsAccounts)
    .where(eq(schema.pointsAccounts.userId, userId))
    .limit(1);
  return existingPointsAccount.length > 0;
}

/**
 * 根据用户ID获取用户的当前积分。
 * @param userId 用户ID
 * @returns Promise<number | null> 返回用户当前积分数量，如果用户不存在则返回 null
 */
export async function getUserPoints(userId: string): Promise<number | null> {
  try {
    const account = await db
      .select({ totalPoints: schema.pointsAccounts.totalPoints })
      .from(schema.pointsAccounts)
      .where(eq(schema.pointsAccounts.userId, userId))
      .limit(1);

    if (account.length > 0) {
      return account[0].totalPoints;
    }
    return null; // 用户不存在积分账户
  } catch (error) {
    console.error(`获取用户 ${userId} 积分失败:`, error);
    throw error; // 抛出错误以便调用方处理
  }
}

/**
 * 扣减用户积分。
 * @param userId 用户ID
 * @param pointsToDeduct 要扣减的积分数量
 * @param reasonCode 交易原因代码 (例如: "redeem", "purchase_refund")
 * @param description 交易描述 (可选)
 * @returns Promise<void>
 * @throws Error 如果积分不足或操作失败
 */
export async function deductUserPoints(
  userId: string,
  pointsToDeduct: number,
  reasonCode: string,
  description?: string
): Promise<void> {
  if (pointsToDeduct <= 0) {
    throw new Error("扣减积分数量必须大于0。");
  }

  await db.transaction(async (tx) => {
    // 1. 获取用户当前积分
    const [account] = await tx
      .select({ totalPoints: schema.pointsAccounts.totalPoints })
      .from(schema.pointsAccounts)
      .where(eq(schema.pointsAccounts.userId, userId))
      .limit(1);

    if (!account) {
      throw new Error(`用户 ${userId} 不存在积分账户。`);
    }

    const currentPoints = account.totalPoints;

    // 2. 检查积分是否足够
    if (currentPoints < pointsToDeduct) {
      throw new Error(`用户 ${userId} 积分不足，当前积分 ${currentPoints}，需要扣减 ${pointsToDeduct}。`);
    }

    const newPoints = currentPoints - pointsToDeduct;

    // 3. 记录积分交易流水
    await tx.insert(schema.pointsTransactions).values({
      userId: userId,
      pointsChange: -pointsToDeduct, // 扣减为负数
      reasonCode: reasonCode,
      description: description,
      createdAt: new Date().toISOString(),
    });

    // 4. 更新积分账户
    await tx
      .update(schema.pointsAccounts)
      .set({
        totalPoints: newPoints,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pointsAccounts.userId, userId));

    console.log(`用户 ${userId} 积分成功扣减 ${pointsToDeduct}，当前积分 ${newPoints}`);
  });
}

/**
 * 增加用户积分。
 * @param userId 用户ID
 * @param pointsToAdd 要增加的积分数量
 * @param reasonCode 交易原因代码 (例如: "initial_bonus", "purchase")
 * @param description 交易描述 (可选)
 * @returns Promise<void>
 * @throws Error 如果操作失败
 */
export async function addPointsToUser(
  userId: string,
  pointsToAdd: number,
  reasonCode: string,
  description?: string
): Promise<void> {
  
  // if (pointsToAdd <= 0) {
  //   throw new Error("增加积分数量必须大于0。");
  // }

  await db.transaction(async (tx) => {
    // 1. 获取用户当前积分
    const [account] = await tx
      .select({ totalPoints: schema.pointsAccounts.totalPoints })
      .from(schema.pointsAccounts)
      .where(eq(schema.pointsAccounts.userId, userId))
      .limit(1);

    if (!account) {
      throw new Error(`用户 ${userId} 不存在积分账户。`);
    }

    const currentPoints = account.totalPoints;
    const newPoints = currentPoints + pointsToAdd;

    // 2. 记录积分交易流水
    await tx.insert(schema.pointsTransactions).values({
      userId: userId,
      pointsChange: pointsToAdd, // 增加为正数
      reasonCode: reasonCode,
      description: description,
      createdAt: new Date().toISOString(),
    });

    // 3. 更新积分账户
    await tx
      .update(schema.pointsAccounts)
      .set({
        totalPoints: newPoints,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pointsAccounts.userId, userId));

    console.log(`用户 ${userId} 积分成功增加 ${pointsToAdd}，当前积分 ${newPoints}`);
  });
}
/**
 * 查询用户积分明细。
 * @param userId 用户ID
 * @param page 页码 (默认为 1)
 * @param pageSize 每页数量 (默认为 10)
 * @returns Promise<PointsTransaction[]> 返回用户积分交易明细数组
 */
export async function getUserPointsTransactions(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<typeof schema.pointsTransactions.$inferSelect[]> {
  try {
    const offset = (page - 1) * pageSize;
    const transactions = await db
      .select()
      .from(schema.pointsTransactions)
      .where(eq(schema.pointsTransactions.userId, userId))
      .orderBy(desc(schema.pointsTransactions.createdAt)) // 按创建时间倒序
      .limit(pageSize)
      .offset(offset);

    return transactions;
  } catch (error) {
    console.error(`查询用户 ${userId} 积分明细失败:`, error);
    throw error; // 抛出错误以便调用方处理
  }
}
/**
 * 检查用户今天是否已签到。
 * @param userId 用户ID
 * @param reasonCode 交易原因代码 (例如: "sign_in")
 * @returns Promise<boolean> 如果今天已签到则返回 true，否则返回 false
 */
export async function hasUserSignedToday(userId: string, reasonCode: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为今天开始时间

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // 设置为明天开始时间

    const transactions = await db
      .select()
      .from(schema.pointsTransactions)
      .where(
        sql`${schema.pointsTransactions.userId} = ${userId} AND ${schema.pointsTransactions.reasonCode} = ${reasonCode} AND ${schema.pointsTransactions.createdAt} >= ${today.toISOString()} AND ${schema.pointsTransactions.createdAt} < ${tomorrow.toISOString()}`
      )
      .limit(1);

    return transactions.length > 0;
  } catch (error) {
    console.error(`检查用户 ${userId} 今日签到记录失败:`, error);
    throw error; // 抛出错误以便调用方处理
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { getSessionData } from "@/lib/server-actions";
import { createPointsAccount, recordPointsTransaction, checkUserPointsAccount } from "@/lib/points"; // 导入新封装的函数

export async function GET(request: NextRequest) {
  const sessionData = await getSessionData();
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "/";
  const pathname = request.nextUrl.searchParams.get('pathname');
  if(!!pathname){
    baseUrl += pathname.replace('/','');
  }

  // 如果没有获取到 session，直接重定向到根目录
  if (!sessionData?.user) {
    const url = new URL(baseUrl, request.url);
    return NextResponse.redirect(url);
  }


  const userId = sessionData.user.id; // 获取 userId

  // 检查用户是否已存在积分账户
  const userHasPointsAccount = await checkUserPointsAccount(userId);

  // 如果不存在积分账户，则初始化
  if (!userHasPointsAccount) {
    console.log(`用户 ${userId} 不存在积分账户，正在初始化...`);
    try {
      const pointsPerPodcastDay = parseInt(process.env.POINTS_PER_PODCAST_INIT || '100', 10);
      await createPointsAccount(userId, pointsPerPodcastDay); // 调用封装的创建积分账户函数
      await recordPointsTransaction(userId, pointsPerPodcastDay, "initial_bonus", "新用户注册，初始积分奖励"); // 调用封装的记录流水函数
    } catch (error) {
      console.error(`初始化用户 ${userId} 积分账户或记录流水失败:`, error);
      // 根据错误类型，可能需要更详细的错误处理或重定向
      // 例如，如果 userId 无效，可以重定向到错误页面
    }
  } else {
    console.log(`用户 ${userId} 已存在积分账户，无需初始化。`);
  }

  // 创建一个 URL 对象，指向要重定向到的根目录
  const url = new URL(baseUrl, request.url);
  // 返回重定向响应
  return NextResponse.redirect(url);
}
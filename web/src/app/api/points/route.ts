import { getUserPoints, deductUserPoints } from "@/lib/points"; // 导入 deductUserPoints
import { NextResponse, NextRequest } from "next/server"; // 导入 NextRequest
import { getSessionData } from "@/lib/server-actions"; // 导入 getSessionData

export async function GET() {
  const session = await getSessionData(); // 使用 getSessionData 获取 session
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const points = await getUserPoints(userId);

    if (points === null) {
      // 如果用户没有积分账户，可以返回0或者其他默认值，或者创建初始账户
      // 这里暂时返回0，因为getUserPoints会返回null
      return NextResponse.json({ success: true, points: 0 });
    }

    return NextResponse.json({ success: true, points: points });
  } catch (error) {
    console.error("Error fetching user points:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { task_id, auth_id, timestamp, status } = await request.json();
  try {
    if(status !== 'completed') {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // 1. 参数校验
    if (!task_id || !auth_id || typeof timestamp !== 'number') {
       console.log(task_id, auth_id, timestamp)
      return NextResponse.json({ success: false, error: "Invalid request parameters" }, { status: 400 });
    }

    // 2. 时间戳校验 (10秒内)
    const currentTime = Math.floor(Date.now() / 1000); // 秒级时间戳
    if (Math.abs(currentTime - timestamp) > 10) {
      console.log(currentTime, timestamp)
      return NextResponse.json({ success: false, error: "Request too old or in the future" }, { status: 400 });
    }
    
    // 3. 校验是否重复请求 (这里需要一个机制来判断 task_id 是否已被处理)
    // 理想情况下，这应该在数据库层面进行，例如在pointsTransactions表中添加task_id字段，
    // 并检查该task_id是否已经存在对应的扣减记录。
    // 为了不修改数据库schema，这里可以先简化处理：如果多次请求，扣减逻辑的幂等性需要由deductUserPoints或更上层保证。
    // 暂时先假设 deductUserPoints 本身或其调用方会处理重复扣减的场景。
    // For now, we'll assume the client ensures unique task_id for deduction, or deductUserPoints handles idempotency.
    // 或者，可以考虑使用 Redis 或其他缓存来存储已处理的 task_id，但为了保持简洁，暂时省略。

    // 4. 获取 userId (auth_id)
    const userId = auth_id; // 这里假设 auth_id 就是 userId

    // 5. 扣减积分
    const pointsToDeduct = parseInt(process.env.POINTS_PER_PODCAST || '10', 10); // 从环境变量获取，默认10
    const reasonCode = "podcast_generation";
    const description = `播客生成任务：${task_id}`;

    await deductUserPoints(userId, pointsToDeduct, reasonCode, description);

    return NextResponse.json({ success: true, message: "Points deducted successfully" });

  } catch (error) {
    console.error("Error deducting points:", error);
    if (error instanceof Error) {
        // 区分积分不足的错误
        if (error.message.includes("积分不足")) {
            console.error("积分不足错误: %s %s %s", auth_id, task_id, error);
            return NextResponse.json({ success: false, error: error.message }, { status: 402 }); // Forbidden
        }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
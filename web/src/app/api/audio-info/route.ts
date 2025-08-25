import { NextRequest, NextResponse } from 'next/server';
import { getAudioInfo, getUserInfo } from '@/lib/podcastApi';
import { getTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';


/**
 * 处理 GET 请求，用于代理查询后端 FastAPI 应用的 /get-audio-info 接口。
 * 查询参数：file_name
 */
export async function GET(req: NextRequest) {
  const lang = getLanguageFromRequest(req);
  const { t } = await getTranslation(lang, 'errors');
  // 从请求 URL 中获取查询参数
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file_name');

  // 检查是否提供了 fileName 参数
  if (!fileName) {
    return NextResponse.json(
      { success: false, error: t('missing_file_name_parameter') },
      { status: 400 }
    );
  }

  try {
    // 调用前端的 podcastApi 模块中的 getAudioInfo 函数
    const result = await getAudioInfo(fileName, lang);

    if (!result.success) {
      // 转发 getAudioInfo 返回的错误信息和状态码
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    const authId = result.data?.auth_id; // 确保 auth_id 存在且安全访问
    let userInfoData = null;


    if (authId) {
      const userInfo = await getUserInfo(authId, lang);
      if (userInfo.success && userInfo.data) {
        userInfoData = {
          name: userInfo.data.name,
          email: userInfo.data.email,
          image: userInfo.data.image,
        };
      }
    }

    // 合并 result.data 和 userInfoData
    const { auth_id, callback_url, ...restData } = result.data || {}; // 保留解构，但确保是来自 result.data
    const responseData = {
      ...restData,
      user: userInfoData // 将用户信息作为嵌套对象添加
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });

  } catch (error) {
    console.error('代理 /api/audio-info 失败:', error);
    return NextResponse.json(
      { success: false, error: t('internal_server_error_backend_connection') },
      { status: 500 }
    );
  }
}
import { getUserPointsTransactions } from "@/lib/points";
import { NextResponse, NextRequest } from "next/server";
import { getSessionData } from "@/lib/server-actions";
import { useTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await useTranslation(lang, 'errors');

  const session = await getSessionData();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, error: t("unauthorized") }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 校验 page 和 pageSize 是否为有效数字
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json({ success: false, error: t("invalid_pagination_parameters") }, { status: 400 });
    }

    const transactions = await getUserPointsTransactions(userId, page, pageSize);

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching user points transactions:", error);
    return NextResponse.json({ success: false, error: t("internal_server_error") }, { status: 500 });
  }
}
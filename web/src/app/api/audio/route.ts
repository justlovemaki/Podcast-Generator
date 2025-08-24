import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromRequest } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await useTranslation(lang, 'errors');
  const filename = request.nextUrl.searchParams.get('filename');
  
  // 验证文件名安全性
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json(
      { error: t('invalid_filename')},
      { status: 400 }
    );
  }

  // 构建文件路径
  const outputDir = path.join(process.cwd(), '..', 'server', 'output');
  const filePath = path.join(outputDir, filename);

  try {
    // 获取文件统计信息，检查文件是否存在
    const stats = fs.statSync(filePath);

    // 检查文件类型
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = ['.wav', '.mp3', '.m4a', '.ogg'];
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: t('unsupported_file_type')},
        { status: 400 }
      );
    }

    // 设置适当的Content-Type
    let contentType = 'audio/wav';
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.ogg':
        contentType = 'audio/ogg';
        break;
      default:
        contentType = 'audio/wav';
    }

    // 处理Range请求（支持音频流播放）
    const range = request.headers.get('range');
    
    // 检查Range请求头是否存在
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      const fileStream = fs.createReadStream(filePath, { start, end });
      
      return new NextResponse(fileStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } else {
      // 如果没有Range请求，则读取整个文件并返回
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) { // 明确指定 error 类型
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: t('file_not_found') },
        { status: 404 }
      );
    }
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: t('internal_server_error') },
      { status: 500 }
    );
  }
}
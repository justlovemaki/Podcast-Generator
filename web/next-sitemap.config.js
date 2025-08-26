// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // 必须项，你的网站域名
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/',

  // (可选) 自动生成 robots.txt 文件，默认为 false
  generateRobotsTxt: true,

  // (可选) 自定义 robots.txt 的内容
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        disallow: ['/private'],
      },
    ],
    // (可选) 在 robots.txt 中添加额外的 sitemap
    // additionalSitemaps: [
    //   'https://www.your-domain.com/server-sitemap.xml',
    // ],
  },
  
  // (可选) 排除特定的路由
  exclude: ['/api/*', '/_next/*', '/static/*'],

  // 支持多语言
  i18n: {
    locales: ['en', 'zh-CN', 'ja'],
    defaultLocale: 'en',
  },

  // 包含静态页面
  transform: async (config, path) => {
    // 为动态路由设置默认值
    if (path.includes('[fileName]')) {
      return null; // 这些将在 additionalPaths 中处理
    }
    
    return {
      loc: path,
      changefreq: 'daily',
      priority: path === '/' ? 1.0 : 0.8,
      lastmod: new Date().toISOString(),
    };
  },

  // 添加动态路由和多语言支持
  additionalPaths: async (config) => {
    const paths = [];
    
    // 支持的语言
    const languages = ['en', 'zh-CN', 'ja'];
    
    // 添加静态页面路径（包含多语言版本）
    const staticPaths = [
      '/',
      '/pricing',
      '/contact',
      '/privacy',
      '/terms'
    ];
    
    staticPaths.forEach(path => {
      // 添加默认语言路径
      paths.push({
        loc: path,
        changefreq: 'daily',
        priority: path === '/' ? 1.0 : 0.8,
        lastmod: new Date().toISOString(),
      });
      
      // 为每种语言添加本地化路径
      languages.forEach(lang => {
        const localizedPath = `/${lang}${path === '/' ? '' : path}`;
        paths.push({
          loc: localizedPath,
          changefreq: 'daily',
          priority: path === '/' ? 1.0 : 0.8,
          lastmod: new Date().toISOString(),
        });
      });
    });
    
    // 如果有播客文件，可以在这里添加动态路径
    // 示例：从数据库或文件系统获取播客文件名
    // const podcastFiles = await getPodcastFiles(); // 你需要实现这个函数
    // podcastFiles.forEach(fileName => {
    //   // 添加默认语言路径
    //   paths.push({
    //     loc: `/podcast/${fileName}`,
    //     changefreq: 'weekly',
    //     priority: 0.6,
    //     lastmod: new Date().toISOString(),
    //   });
    //
    //   // 为每种语言添加本地化路径
    //   languages.forEach(lang => {
    //     paths.push({
    //       loc: `/${lang}/podcast/${fileName}`,
    //       changefreq: 'weekly',
    //       priority: 0.6,
    //       lastmod: new Date().toISOString(),
    //     });
    //   });
    // });
    
    return paths;
  },
};
// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // 必须项，你的网站域名
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

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
  exclude: ['/api/*'],

  // 这个函数会在构建时执行
//   additionalPaths: async (config) => {
//     // 示例：从外部 API 获取所有博客文章的 slug
//     const response = await fetch('https://api.example.com/posts');
//     const posts = await response.json(); // 假设返回 [{ slug: 'post-1', updatedAt: '2023-01-01' }, ...]

//     // 将文章数据转换为 next-sitemap 需要的格式
//     const paths = posts.map(post => ({
//       loc: `/blog/${post.slug}`, // URL 路径
//       changefreq: 'weekly',
//       priority: 0.7,
//       lastmod: new Date(post.updatedAt).toISOString(), // 最后修改时间
//     }));

//     // 返回一个 Promise，解析为一个路径数组
//     return paths;
//   },
};
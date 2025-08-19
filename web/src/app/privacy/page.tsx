import React from 'react';
import { Metadata } from 'next';

/**
 * 设置页面元数据。
 */
export const metadata: Metadata = {
  title: '隐私政策 - PodcastHub',
  description: '了解 PodcastHub 如何保护您的隐私。我们致力于透明化地处理您的数据。',
};

/**
 * 隐私政策页面组件。
 * 提供了详细的隐私政策说明，涵盖信息收集、使用、共享、安全及用户权利。
 * 布局采用 Tailwind CSS 进行优化，`prose` 类用于美化排版，`break-words` 确保内容不会溢出容器。
 */
const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="container mx-auto p-6 md:p-8 max-w-4xl bg-white shadow-lg rounded-lg">
        <article className="prose max-w-full break-words">
          <h1 className="text-4xl font-extrabold mb-6 text-gray-900 border-b pb-4">
            PodcastHub 隐私政策
          </h1>
          <p className="text-gray-600">最近更新日期：2025年8月21日</p>
          <p>
            感谢您选择 PodcastHub！我们深知隐私对您的重要性。本隐私政策（以下简称“本政策”）旨在向您说明我们如何收集、使用、存储、共享和保护您的个人信息。请在使用我们的服务前仔细阅读并理解本政策。
          </p>

          <h2 id="info-we-collect">1. 我们收集的信息</h2>
          <p>为了向您提供和优化我们的服务，我们会收集以下类型的信息：</p>
          <ul>
            <li>
              <strong>您主动提供的信息</strong>
              ：当您注册账户、使用服务或与我们联系时，您可能会提供个人信息，如您的姓名、电子邮件地址、密码、以及您为生成播客而上传的文本内容。
            </li>
            <li>
              <strong>我们自动收集的信息</strong>
              ：当您使用服务时，我们的服务器会自动记录某些信息，包括您的 IP
              地址、浏览器类型与版本、操作系统、设备信息、访问日期和时间、以及您在服务中的交互数据（如点击流、功能使用频率等）。
            </li>
            <li>
              <strong>Cookies 和类似技术</strong>
              ：我们使用 Cookies
              来存储您的偏好设置、维持登录状态并分析使用情况，以改善用户体验。您可以根据自己的偏好管理或删除
              Cookies。
            </li>
          </ul>

          <h2 id="how-we-use-info">2. 我们如何使用您的信息</h2>
          <p>我们将在以下目的范围内使用您的个人信息：</p>
          <ul>
            <li>
              <strong>提供和维护服务</strong>：处理您的文本内容以生成播客，管理您的账户，并确保服务正常运行。
            </li>
            <li>
              <strong>改进和开发服务</strong>
              ：分析使用数据，以了解用户偏好，优化现有功能，并开发新的产品和服务。
            </li>
            <li>
              <strong>与您沟通</strong>
              ：向您发送重要的服务通知、账户安全提醒、更新说明或您可能感兴趣的市场营销信息（您可以选择退订）。
            </li>
            <li>
              <strong>安全保障</strong>
              ：保护我们的服务、用户和公众免受欺诈、滥用和安全威胁。
            </li>
            <li>
              <strong>遵守法律义务</strong>：履行适用的法律法规要求。
            </li>
          </ul>

          <h2 id="info-sharing">3. 信息的共享与披露</h2>
          <p>
            我们承诺对您的信息保密，除非存在以下情况，我们不会与任何第三方分享您的个人信息：
          </p>
          <ul>
            <li>
              <strong>获得您的明确同意</strong>：在获得您明确同意后，我们会与其他方共享您的信息。
            </li>
            <li>
              <strong>法律要求</strong>
              ：根据法律法规、法律程序的要求或政府主管部门的强制性要求，我们可能会对外披露您的个人信息。
            </li>
            <li>
              <strong>服务提供商</strong>
              ：我们可能会与可信赖的第三方服务提供商（如云存储、数据分析服务）共享必要的信息，以协助我们提供和改进服务。这些提供商有义务遵守我们的数据保护标准。
            </li>
            <li>
              <strong>保护我们的权利</strong>
              ：为执行我们的服务条款、保护我们的权利、财产或安全，以及保护我们的用户或公众免受伤害，我们可能会在必要的范围内共享信息。
            </li>
          </ul>

          <h2 id="data-security">4. 数据安全</h2>
          <p>
            我们采用了行业标准的安全措施来保护您的信息，防止未经授权的访问、披露、使用、修改或销毁。这些措施包括数据加密、访问控制和定期的安全审查。然而，没有任何互联网传输或电子存储方法是
            100% 安全的，因此我们无法保证其绝对安全。
          </p>

          <h2 id="user-rights">5. 您的权利</h2>
          <p>
            您对您的个人信息享有多种权利，包括访问、更正、删除您的账户信息。您可以通过账户设置或联系我们来行使这些权利。
          </p>

          <h2 id="policy-changes">6. 政策变更</h2>
          <p>
            我们可能会不时修订本隐私政策。任何重大变更，我们都会通过在网站上发布醒目通知或向您发送电子邮件的方式通知您。我们鼓励您定期查看本页面以获取最新信息。
          </p>

          <h2 id="contact-us">7. 联系我们</h2>
          <p>
            如果您对本隐私政策或我们的隐私实践有任何疑问或疑虑，请随时通过我们的联系页面与我们取得联系。
          </p>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
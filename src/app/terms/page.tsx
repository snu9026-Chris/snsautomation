export const metadata = {
  title: 'Terms of Service — LoopDrop',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-04-16</p>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          By using LoopDrop (&quot;the Service&quot;), you agree to these Terms of Service.
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Use of the Service</h2>
        <p>
          LoopDrop allows you to publish content to your own social media accounts through official APIs.
          You are responsible for the content you publish and must comply with each platform&apos;s
          community guidelines and terms.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Account Responsibility</h2>
        <p>
          You are solely responsible for maintaining the security of your accounts. LoopDrop does not
          store platform passwords — only OAuth tokens with scoped access.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Prohibited Uses</h2>
        <p>
          You may not use the Service to distribute spam, misinformation, illegal content, or material
          that violates any third party&apos;s rights. Violations may result in immediate termination of
          service.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Disclaimer</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind. We are not responsible
          for any loss of data, content rejection by platforms, or account suspensions resulting from
          use of the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Changes to These Terms</h2>
        <p>
          We may update these terms periodically. Continued use of the Service after changes constitutes
          acceptance of the new terms.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Contact</h2>
        <p>
          For questions about these terms, please contact: dydghks9026@nate.com
        </p>
      </section>
    </div>
  );
}

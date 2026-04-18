export const metadata = {
  title: 'Privacy Policy — LoopDrop',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-04-16</p>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          LoopDrop (&quot;the Service&quot;) is a multi-platform content publishing tool that allows users to publish
          videos and images to connected social media accounts (YouTube, Instagram, Threads, TikTok, X).
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
        <p>
          When you connect a social media account, we store OAuth access tokens and basic account identifiers
          (username, account ID) required for publishing content on your behalf. We do not collect personal
          information beyond what you voluntarily provide.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
        <p>
          OAuth tokens are used solely to publish content to your connected accounts as initiated by you.
          We do not sell, share, or distribute your data to any third party.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Data Storage</h2>
        <p>
          Access tokens and user-provided content are stored in encrypted form on Supabase infrastructure.
          Media files uploaded through the Service are stored in Supabase Storage.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Data Deletion</h2>
        <p>
          You may disconnect any platform at any time from the Accounts page. Upon disconnection, all
          associated tokens are deleted immediately. To delete all data, contact the administrator.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Third-Party Services</h2>
        <p>
          LoopDrop integrates with the following third-party APIs: YouTube Data API, Meta Graph API
          (Instagram/Threads), TikTok Open API, and X API. Your use of the Service is also subject to
          these providers&apos; respective terms and privacy policies.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Contact</h2>
        <p>
          For questions about this policy, please contact: dydghks9026@nate.com
        </p>
      </section>
    </div>
  );
}

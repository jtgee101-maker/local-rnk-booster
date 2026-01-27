import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - LocalRank.ai</title>
        <meta name="description" content="Terms of Service for LocalRank.ai. Review our terms and conditions." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-8 md:p-12"
        >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using LocalRank.ai, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p className="leading-relaxed">
              LocalRank.ai provides Google My Business optimization, audit services, and local SEO consulting. 
              We analyze your GMB profile and provide recommendations to improve your local search visibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use our service for any unlawful purpose</li>
              <li>Own or have authority to optimize the business profiles you submit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Payment Terms</h2>
            <p className="leading-relaxed">
              All payments are processed securely through Stripe. Prices are in USD and include all applicable taxes. 
              Payment is required before service delivery begins. All sales are final unless otherwise stated in our 
              refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Refund Policy</h2>
            <p className="leading-relaxed">
              We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 
              30 days of purchase for a full refund. Refunds are not available after work has been completed or 
              after 30 days from purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Service Limitations</h2>
            <p className="leading-relaxed">
              While we strive to improve your GMB ranking, we cannot guarantee specific results or rankings. 
              Search engine algorithms are outside our control. Results may vary based on competition, location, 
              and other factors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, features, and functionality of LocalRank.ai are owned by us and protected by copyright, 
              trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use or inability to use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p className="leading-relaxed">
              We may terminate or suspend your access to our service immediately, without prior notice, for any 
              reason, including breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes 
              via email or through our service.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Last Updated: January 18, 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact us: support@localrank.ai
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
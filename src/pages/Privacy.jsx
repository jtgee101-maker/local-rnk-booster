import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 md:p-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly to us, including your business name, email address, 
              phone number, and Google My Business profile data. We also automatically collect certain information 
              about your device and how you interact with our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>To provide and improve our GMB optimization services</li>
              <li>To communicate with you about your account and our services</li>
              <li>To send you marketing communications (you can opt-out anytime)</li>
              <li>To analyze usage patterns and improve our platform</li>
              <li>To process payments and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share your information with service providers 
              who assist us in operating our platform (e.g., payment processors, email services), and when 
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p className="leading-relaxed">
              You have the right to access, correct, or delete your personal information. You can also object to 
              or restrict certain processing of your data. Contact us at privacy@localrank.ai to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cookies</h2>
            <p className="leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage, and deliver 
              personalized content. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Last Updated: January 18, 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact us: privacy@localrank.ai
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
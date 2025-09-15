import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/GlassCard';
import { Button } from '../../ui/Button';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>

          <GlassCard className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent">
              Privacy Policy
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Ositos Bendecidos Non-profit Organization (referred to as "we," "us," or "our") is committed to protecting the privacy of our donors, volunteers, and website visitors. This Privacy Policy explains how we collect, use, disclose, and protect your information.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Information We Collect</h2>
              <p className="text-gray-600 mb-4">
                We may collect the following types of information: This includes information that you provide to us, such as your name, email address, phone number, mailing address, and payment information when you make a donation or sign up for our newsletter.We may collect information about how you access and use our website, including your IP address, browser type, pages visited, and the time and date of your visit.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use the information we collect for the following purposes :To manage and process your donations.To send you updates, newsletters, and information about our programs and events.
              </p>
              <p className="text-gray-600 mb-6">
                To analyze usage of our website and improve our services and outreach efforts.To fulfill any legal obligations we may have.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Information Sharing</h2>
              <p className="text-gray-600 mb-6">
                We do not sell or rent your personal information to third parties. We may share your information with:We may share your information with third-party vendors who perform services on our behalf (e.g., payment processors, email service providers) and are obligated to protect your information.We may disclose your information if required to do so by law or in response to legal requests.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Data Security</h2>
              <p className="text-gray-600 mb-6">
                We take reasonable measures to protect your personal information from unauthorized access, loss, misuse, or alteration. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Cookies</h2>
              <p className="text-gray-600 mb-6">
                Our website may use cookies and similar tracking technologies to enhance your experience. You can manage your cookie preferences through your browser settings. Please note that disabling cookies may affect your ability to use certain features of our website.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Your Rights</h2>
              <p className="text-gray-600 mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>The right to access your personal information.</li>
                <li>The right to request correction of inaccurate information.</li>
                <li>The right to request deletion of your personal information.</li>
              </ul>
              <p className="text-gray-600 mb-6">
                To exercise these rights, please contact us using the information provided below.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Changes to This Privacy Policy</h2>
              <p className="text-gray-600 mb-6">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on our website and updating the effective date. We encourage you to review this policy periodically for any changes.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mt-6 mb-8">
                <p className="font-semibold text-gray-800">Ositos Bendecidos</p>
                <p className="text-gray-600">9121 SUNRISE LAKES BLVD UNIT 119</p>
                <p className="text-gray-600">SUNRISE, FL 33322</p>
                <p className="text-gray-600 mt-2">
                  phone: (703)203-1362<br />
                  Email: info@ositosbendecidos.com
                </p>
              </div>

              <div className="border-t pt-8 mt-12">
                <p className="text-sm text-gray-500 text-center">
                  Copyright © 2025 OSITOS BENDECIDOS - All Rights Reserved.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
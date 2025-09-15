import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/Button';

const DonationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const _requestId = searchParams.get('requestId'); // Will be used for tracking

  useEffect(() => {
    // Redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/community');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
        >
          <CheckCircleIcon className="w-24 h-24 text-green-hope mx-auto mb-6" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Thank You for Your Donation!
        </h1>

        <p className="text-gray-300 mb-8">
          Your generous contribution has been received and will make a real difference
          in someone's life. You'll receive a confirmation email shortly.
        </p>

        <div className="space-y-3">
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate('/community')}
            className="w-full"
          >
            View More Community Requests
          </Button>

          <p className="text-sm text-gray-400">
            Redirecting to community page in 5 seconds...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DonationSuccess;
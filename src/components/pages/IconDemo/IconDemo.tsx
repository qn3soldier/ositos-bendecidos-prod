import React from 'react';
import { motion } from 'framer-motion';
import { PrayerIcon, DonateIcon, BearIcon, CommunityIcon, CartIcon } from '../../shared/CustomIcons';
import GlassCard from '../../shared/GlassCard';

const IconDemo: React.FC = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-primary to-gold-neon bg-clip-text text-transparent mb-4">
            🎨 Кастомные Иконки
          </h1>
          <p className="text-gray-300 text-lg">
            Анимированные SVG иконки в стиле проекта
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Prayer Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="flex justify-center mb-4">
                <PrayerIcon size="lg" animate className="text-gold-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gold-primary mb-2">
                Prayer Icon
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Руки в молитве с сердцем и сиянием
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Обычная:</span>
                  <PrayerIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Анимированная:</span>
                  <PrayerIcon size="sm" animate />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Donate Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="flex justify-center mb-4">
                <DonateIcon size="lg" animate className="text-gold-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gold-primary mb-2">
                Donate Icon
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Монета с сердцем и летящими монетами
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Обычная:</span>
                  <DonateIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Анимированная:</span>
                  <DonateIcon size="sm" animate />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bear Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="flex justify-center mb-4">
                <BearIcon size="lg" animate className="text-gold-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gold-primary mb-2">
                Bear Icon
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Милый мишка с анимацией моргания
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Обычная:</span>
                  <BearIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Анимированная:</span>
                  <BearIcon size="sm" animate />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Community Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="flex justify-center mb-4">
                <CommunityIcon size="lg" animate className="text-gold-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gold-primary mb-2">
                Community Icon
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Группа людей с сердцем и связями
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Обычная:</span>
                  <CommunityIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Анимированная:</span>
                  <CommunityIcon size="sm" animate />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Cart Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard padding="lg" className="text-center">
              <div className="flex justify-center mb-4">
                <CartIcon size="lg" animate itemCount={3} className="text-gold-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gold-primary mb-2">
                Cart Icon
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Корзина с товарами и счетчиком
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Пустая:</span>
                  <CartIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">С товарами:</span>
                  <CartIcon size="sm" itemCount={5} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Анимированная:</span>
                  <CartIcon size="sm" animate itemCount={2} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Код использования */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <GlassCard padding="lg">
            <h3 className="text-2xl font-semibold text-gold-primary mb-6 text-center">
              🔥 Как использовать
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gold-neon mb-3">
                  1. Импорт:
                </h4>
                <div className="bg-black/60 rounded-lg p-4 font-mono text-sm">
                  <span className="text-blue-400">import</span>{' '}
                  <span className="text-green-400">{'{ PrayerIcon, DonateIcon, CartIcon }'}</span>{' '}
                  <span className="text-blue-400">from</span>{' '}
                  <span className="text-yellow-300">'./shared/CustomIcons'</span>;
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gold-neon mb-3">
                  2. Использование:
                </h4>
                <div className="bg-black/60 rounded-lg p-4 font-mono text-sm">
                  <div><span className="text-red-400">&lt;CartIcon</span></div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">size</span>=<span className="text-yellow-300">"lg"</span></div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">animate</span>=<span className="text-blue-400">{'{true}'}</span></div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">itemCount</span>=<span className="text-blue-400">{'{5}'}</span></div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">className</span>=<span className="text-yellow-300">"text-gold-primary"</span></div>
                  <div><span className="text-red-400">/&gt;</span></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gold-neon mb-3">
                3. Параметры:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/60 rounded-lg p-4">
                  <span className="text-purple-400 font-semibold">size:</span>
                  <p className="text-gray-300 text-sm mt-1">
                    'sm' | 'md' | 'lg'
                  </p>
                </div>
                <div className="bg-black/60 rounded-lg p-4">
                  <span className="text-purple-400 font-semibold">animate:</span>
                  <p className="text-gray-300 text-sm mt-1">
                    true | false
                  </p>
                </div>
                <div className="bg-black/60 rounded-lg p-4">
                  <span className="text-purple-400 font-semibold">itemCount:</span>
                  <p className="text-gray-300 text-sm mt-1">
                    число (для CartIcon)
                  </p>
                </div>
                <div className="bg-black/60 rounded-lg p-4">
                  <span className="text-purple-400 font-semibold">className:</span>
                  <p className="text-gray-300 text-sm mt-1">
                    CSS классы
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default IconDemo;

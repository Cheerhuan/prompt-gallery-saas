import React, { ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';

interface FeatureGateProps {
  children: ReactNode;
  isProRequired?: boolean;
  userTier?: string;
}

export const FeatureGate = ({ children, isProRequired = true, userTier = 'free' }: FeatureGateProps) => {
  const { t } = useI18n();
  const isLocked = isProRequired && userTier === 'free';

  return (
    <div className="relative group">
      {isLocked && (
        <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/40 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/20 transition-all border border-zinc-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/50">
            <span className="text-white text-xs">🔒</span>
          </div>
          <span className="text-white text-xs font-bold mb-1">{t('featureGate.proTitle')}</span>
          <span className="text-zinc-400 text-[10px]">{t('featureGate.proDesc')}</span>
          <button
            onClick={() => window.plausible?.('UpgradeClick', {props: {feature: 'pro'}})}
            className="mt-3 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full hover:bg-zinc-200 transition-colors"
          >
            {t('featureGate.upgradeBtn')}
          </button>
        </div>
      )}
      <div className={isLocked ? 'opacity-30 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

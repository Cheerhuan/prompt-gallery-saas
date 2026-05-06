export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    creditsPerMonth: 10,
    features: ['Browse Gallery', 'Save 5 Favorites', 'Standard Uploads'],
    limit: 5,
  },
  PRO: {
    name: 'Pro',
    creditsPerMonth: 100,
    features: ['Everything in Free', 'Unlimited Favorites', 'Advanced Prompt Analysis', 'Early Access to New Models'],
    limit: Infinity,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    creditsPerMonth: 1000,
    features: ['Everything in Pro', 'Private Gallery', 'API Access', 'Priority Support'],
    limit: Infinity,
  }
};

export type UserTier = 'free' | 'pro' | 'enterprise';

export const checkFeatureAccess = (userTier: UserTier, feature: string): boolean => {
  // Simplified gating logic
  if (userTier === 'enterprise') return true;
  if (userTier === 'pro') return true;
  return feature === 'browse';
};

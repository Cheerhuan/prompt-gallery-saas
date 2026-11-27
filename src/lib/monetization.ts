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
  },
};

export const CHECKOUT_CONFIG = {
  proUrl: process.env.NEXT_PUBLIC_CHECKOUT_PRO_URL || '',
  vaultUrl: process.env.NEXT_PUBLIC_CHECKOUT_VAULT_URL || '',
  enterpriseUrl: process.env.NEXT_PUBLIC_CHECKOUT_ENT_URL || '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'cheerhuan@gmail.com',
  basePath: '/prompt-gallery-saas',
};

export type UserTier = 'free' | 'pro' | 'enterprise';

export const checkFeatureAccess = (userTier: UserTier, feature: string): boolean => {
  if (userTier === 'enterprise') return true;
  if (userTier === 'pro') return true;
  return feature === 'browse';
};

export interface ExportablePrompt {
  id: string | number;
  title: string;
  model?: string;
  full_prompt?: string;
}

export function exportPromptsToMarkdown(prompts: ExportablePrompt[]): string {
  const lines = [
    '# Prompt Gallery — Saved Vault Export',
    '',
    `Exported ${prompts.length} prompt(s) on ${new Date().toISOString().slice(0, 10)}.`,
    '',
    '---',
    '',
  ];
  prompts.forEach((p, idx) => {
    lines.push(`## ${idx + 1}. ${p.title}`);
    if (p.model) lines.push(`- **Model**: \`${p.model}\``);
    lines.push('', '```text', p.full_prompt || '', '```', '');
  });
  return lines.join('\n');
}

export function exportPromptsToCsv(prompts: ExportablePrompt[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['index', 'id', 'title', 'model', 'full_prompt'].join(',')];
  prompts.forEach((p, idx) => {
    rows.push(
      [
        String(idx + 1),
        esc(String(p.id)),
        esc(p.title || ''),
        esc(p.model || ''),
        esc(p.full_prompt || ''),
      ].join(',')
    );
  });
  return '\uFEFF' + rows.join('\n');
}

export function triggerTextDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

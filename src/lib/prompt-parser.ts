import React from 'react';

// Unified separator: supports both English and Chinese commas
const SEPARATOR = /[,，]\s*/;

export interface PromptBreakdown {
  [key: string]: string | any;
  subject: string;
  style: string;
  details: string;
  lighting: string;
  camera: string;
}

export const parsePrompt = (prompt: string): PromptBreakdown => {
  // For dual-language prompts (EN | ZH), parse the first language part
  const mainPart = prompt.split(' | ')[0] || prompt;
  const parts = mainPart.split(SEPARATOR);
  return {
    subject: parts[0] || 'Unknown',
    style: parts[1] || 'Standard',
    details: parts[2] || 'N/A',
    lighting: parts[3] || 'Natural',
    camera: parts[4] || 'Default',
  };
};

export const promptBreakdown = [
  { label: 'Subject', key: 'subject' },
  { label: 'Style', key: 'style' },
  { label: 'Details', key: 'details' },
  { label: 'Lighting', key: 'lighting' },
  { label: 'Camera', key: 'camera' },
] as const;

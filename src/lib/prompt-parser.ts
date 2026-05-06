import React from 'react';

export const parsePrompt = (prompt) => {
  // Simplified parser: In a real app, this would use a more complex regex or an AI model
  const patterns = {
    subject: / (?:subject: )?(.+?)(?:,|$)/i,
    style: / (?:style: )?(.+?)(?:,|$)/i,
    details: / (?:details: )?(.+?)(?:,|$)/i,
    lighting: / (?:lighting: )?(.+?)(?:,|$)/i,
    camera: / (?:camera: )?(.+?)(?:,|$)/i,
  };
  
  // If no explicit labels, we just split by comma as a fallback
  const parts = prompt.split(',').map(p => p.trim());
  
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
];

const fs = require('fs');
const promptsPath = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';
const tmpPath = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json.tmp';

const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
const newPrompts = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
const combined = prompts.concat(newPrompts);

fs.writeFileSync(promptsPath, JSON.stringify(combined, null, 2));
fs.unlinkSync(tmpPath);
console.log('Successfully merged prompts');

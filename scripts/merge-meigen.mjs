const fs = require('fs');
const promptsPath = '/Users/xiebinghuan/prompt-gallery-saas/src/data/prompts.json';
const newPromptsPath = '/Users/xiebinghuan/prompt-gallery-saas/scripts/new_prompts.json';

try {
    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    const newPrompts = JSON.parse(fs.readFileSync(newPromptsPath, 'utf8'));

    prompts.push(...newPrompts);
    fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2));
    console.log(`Successfully added ${newPrompts.length} prompts.`);
} catch (err) {
    console.error('Error updating prompts:', err);
    process.exit(1);
}

const resp = await fetch('https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main/cases/poster.md');
const text = await resp.text();

const blocks = text.split(/(?=### Case \d+:)/g);
console.log('Total blocks:', blocks.length);

// Find first real case block
const firstBlock = blocks.find(b => b.startsWith('### Case'));
if (firstBlock) {
  console.log('First block (first 200 chars):', firstBlock.substring(0, 200));
  
  const titleMatch = firstBlock.match(/### Case \d+: \[([^\]]+)\]/);
  console.log('Title found:', !!titleMatch, '->', titleMatch?.[1]);
  
  const imgMatch = firstBlock.match(/\[!\[Output image\]\(([^)]+)\)\]/);
  console.log('Image URL found:', !!imgMatch, '->', imgMatch?.[1]?.substring(0, 60));
  
  // The actual format uses <a><img> not markdown image!
  const imgTagMatch = firstBlock.match(/src=\"([^\"]+)\"/);
  console.log('Img tag found:', !!imgTagMatch, '->', imgTagMatch?.[1]?.substring(0, 60));
  
  const promptMatch = firstBlock.match(/```([\s\S]*?)```/);
  console.log('Prompt found:', !!promptMatch, '-> length:', promptMatch?.[1]?.length);
}

// Check actual image link format in raw markdown
console.log('\n--- Checking image format ---');
const imgParts = text.match(/src=\"https:\/\/raw\.githubusercontent\.com[^\"]+/g);
console.log('Image src patterns:', imgParts?.length || 0);
if (imgParts && imgParts.length > 0) {
  console.log('First img:', imgParts[0].substring(0, 100));
}

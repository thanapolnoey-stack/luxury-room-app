const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ALL_STYLES = [
  'modern luxury', 'classic european', 'minimalist japandi',
  'art deco', 'dark moody', 'scandinavian', 'hollywood regency',
  'wabi-sabi japanese', 'industrial loft', 'french country',
  'mediterranean villa', 'neoclassical grand'
];

app.post('/api/generate', upload.array('images', 10), async (req, res) => {
  try {
    const { openaiKey, anthropicKey, frame, style, orientations } = req.body;
    const files = req.files;

    if (!openaiKey) return res.status(400).json({ error: 'OpenAI API Key required' });
    if (!anthropicKey) return res.status(400).json({ error: 'Anthropic API Key required' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'No images uploaded' });

    const orientationList = JSON.parse(orientations || '[]');

    // Step 1: Claude analyzes images
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const imageContents = files.map((file, i) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: file.mimetype,
        data: file.buffer.toString('base64')
      }
    }));

    const isAuto = style === 'AUTO';
    const styleInstruction = isAuto
      ? `Choose the BEST room style from: ${ALL_STYLES.join(', ')}. Pick the one that creates the most harmonious and luxurious result with these artworks.`
      : `Room style: ${style} luxury interior`;

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `You are an expert luxury interior designer. Analyze these ${files.length} artwork(s) and create a detailed prompt for gpt-image-2.

${styleInstruction}
Frame: ${frame}
Orientations: ${orientationList.map((o, i) => `artwork ${i+1}: ${o}`).join(', ')}

Respond ONLY with valid JSON (no markdown):
{
  "chosen_style": "the room style selected",
  "prompt": "ultra-detailed photorealistic interior design prompt showing the luxury room with the artworks displayed on the wall in ${frame}s, professional architectural photography, 8K, perfect lighting, editorial quality"
}`
          }
        ]
      }]
    });

    const rawText = claudeRes.content.map(b => b.text || '').join('');
    let parsed;
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { chosen_style: style || 'modern luxury', prompt: rawText };
    }

    // Step 2: Generate room with gpt-image-2
    const openai = new OpenAI({ apiKey: openaiKey });

    const imageResponse = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: parsed.prompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
      response_format: 'b64_json'
    });

    res.json({
      success: true,
      image: imageResponse.data[0].b64_json,
      chosen_style: parsed.chosen_style,
      prompt: parsed.prompt
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

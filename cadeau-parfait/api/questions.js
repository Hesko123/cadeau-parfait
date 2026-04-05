export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: `Tu es un expert en cadeaux. À partir du profil fourni, génère EXACTEMENT 2 questions de filtrage oui/non très précises et utiles pour affiner les idées cadeaux. Les questions doivent être spécifiques au profil décrit (ex: "Est-elle quelqu'un d'éco-responsable ?", "Préfère-t-il les expériences aux objets ?"). Réponds UNIQUEMENT en JSON valide sans texte autour : {"questions":["...","..."]}`,
        messages: [{ role: 'user', content: `Profil : ${prompt}` }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });

    const text = data.content.map(c => c.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json\s?|```/g, '').trim());
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

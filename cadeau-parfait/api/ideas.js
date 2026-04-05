export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, questions, answers } = req.body;
  if (!prompt || !questions || !answers) return res.status(400).json({ error: 'Données manquantes' });

  const budgetLimited = answers[answers.length - 1];
  const budgetInstr = budgetLimited
    ? 'Budget STRICT : tous les cadeaux doivent coûter entre 0 et 100€ maximum.'
    : 'Propose un mélange varié : quelques idées économiques (0-50€), des idées intermédiaires (50-200€), et 2 options premium originales (200€+).';

  const qa = questions.map((q, i) => `- ${q} → ${answers[i] ? 'Oui' : 'Non'}`).join('\n');

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
        max_tokens: 1200,
        system: `Tu es un expert en cadeaux personnalisés. Génère 5 à 6 idées cadeaux originales, précises et vraiment adaptées au profil et aux réponses. ${budgetInstr} Réponds UNIQUEMENT en JSON valide sans texte autour : {"ideas":[{"titre":"...","description":"...","budget":"..."}]}`,
        messages: [{ role: 'user', content: `Profil : ${prompt}\n\nFiltres :\n${qa}` }]
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

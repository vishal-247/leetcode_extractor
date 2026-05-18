const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let problemsCache = null;

// Fetch all problems from LeetCode and cache them
async function fetchAllProblems() {
  if (problemsCache) return problemsCache;

  console.log('Fetching problem list from LeetCode...');
  const res = await axios.get('https://leetcode.com/api/problems/all/', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://leetcode.com',
    },
  });

  const map = {};
  for (const item of res.data.stat_status_pairs) {
    const id = item.stat.frontend_question_id;
    const slug = item.stat.question__title_slug;
    const title = item.stat.question__title;
    map[id] = { title, slug, link: `https://leetcode.com/problems/${slug}/` };
  }

  problemsCache = map;
  console.log(`Cached ${Object.keys(map).length} problems.`);
  return map;
}

// POST /api/fetch  body: { numbers: [1, 2, 3] }
app.post('/api/fetch', async (req, res) => {
  const { numbers } = req.body;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: 'Provide an array of question numbers.' });
  }

  try {
    const map = await fetchAllProblems();
    const results = numbers.map((n) => {
      const num = parseInt(n);
      if (isNaN(num)) return { number: n, error: 'Invalid number' };
      const found = map[num];
      if (!found) return { number: num, error: 'Not found' };
      return { number: num, title: found.title, link: found.link };
    });
    res.json({ results });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch from LeetCode: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

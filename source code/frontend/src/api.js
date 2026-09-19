const API_BASE = process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8000/api/v1';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

export const api = {
  getLearnerState: (id) => fetchAPI(`/learners/${id}/state`),
  getRecommendations: (id, count = 5) => fetchAPI(`/learners/${id}/recommendations?count=${count}`),
  getPath: (id, topic) => fetchAPI(`/learners/${id}/path/${topic}`),
  getMetrics: (id) => fetchAPI(`/learners/${id}/metrics`),
  getAnalytics: (id) => fetchAPI(`/learners/${id}/analytics`),
  getActivity: (id) => fetchAPI(`/learners/${id}/activity`),
  logEvent: (id, event) => fetchAPI(`/learners/${id}/events`, { method: 'POST', body: JSON.stringify(event) }),
  logOutcome: (id, itemId, completed, score) => fetchAPI(`/learners/${id}/outcomes?item_id=${itemId}&completed=${completed}&score=${score}`, { method: 'POST' }),
  getTopics: () => fetchAPI('/topics'),
  getTopic: (id) => fetchAPI(`/topics/${id}`),
  getGraph: () => fetchAPI('/graph'),
  getItems: () => fetchAPI('/items'),
  getEvaluation: (id) => fetchAPI(`/evaluation/${id}`),
};
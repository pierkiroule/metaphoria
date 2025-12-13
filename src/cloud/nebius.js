export async function callNebius({ prompt }) {
  // Placeholder for IA cloud call. In production, wire an actual SDK or fetch request.
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    provider: 'nebius',
    prompt,
    output: 'Réponse créative (mock). Branchez vos clés API pour activer l IA.',
  }
}

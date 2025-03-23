export type CommentData = { articleId: number; id: number; name: string; email: string; body: string };

export function createMockComments() {
  const mockComments: CommentData[] = [
    {
      id: 1,
      articleId: 3,
      name: 'Mark Rivera',
      email: 'mark.rivera@example.com',
      body: "Very informative! I'd love to read more about crypto security practices.",
    },
    {
      id: 2,
      articleId: 3,
      name: 'Ella Johnson',
      email: 'ella.johnson@example.com',
      body: 'Crypto can be tricky for beginners. Thanks for breaking it down!',
    },
    {
      id: 3,
      articleId: 3,
      name: 'Ryan Clark',
      email: 'ryan.clark@example.com',
      body: 'Is there a specific exchange you recommend for beginners?',
    },
    {
      id: 4,
      articleId: 0,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      body: 'Great insights! I wonder how AI will shape education in the next decade.',
    },
    {
      id: 5,
      articleId: 0,
      name: 'Liam Smith',
      email: 'liam.smith@example.com',
      body: 'AI in healthcare is fascinating. The potential for early diagnosis is promising.',
    },
    {
      id: 6,
      articleId: 2,
      name: 'Sophia Lee',
      email: 'sophia.lee@example.com',
      body: 'Thanks for the tips! Do you recommend any beginner-friendly plants for small spaces?',
    },
  ];

  return mockComments;
}

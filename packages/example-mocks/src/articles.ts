export type ArticleData = { id: number; title: string; body: string; userId: number };

export function createMockArticles() {
  const mockArticles: ArticleData[] = [
    {
      id: 0,
      userId: 0,
      title: 'Exploring the Future of AI',
      body: 'Artificial intelligence is transforming industries, from healthcare to finance. This article explores the latest advancements and future possibilities.',
    },
    {
      id: 1,
      userId: 0,
      title: '10 Tips for Better Time Management',
      body: 'Managing your time effectively can boost productivity and reduce stress. Here are ten practical tips to help you stay on top of your tasks.',
    },
    {
      id: 2,
      userId: 0,
      title: "A Beginner's Guide to Gardening",
      body: 'Starting a garden can be both fun and rewarding. This guide covers the basics, from choosing plants to maintaining healthy soil.',
    },
    {
      id: 3,
      userId: 0,
      title: 'Understanding Cryptocurrency',
      body: 'Cryptocurrency has gained popularity as an alternative form of investment. Learn how it works, its risks, and potential rewards.',
    },
    {
      id: 4,
      userId: 0,
      title: 'Top 5 Travel Destinations for 2025',
      body: 'Looking for your next adventure? Here are five must-visit destinations for 2025, each offering unique experiences and breathtaking views.',
    },
    {
      id: 5,
      userId: 0,
      title: 'The Benefits of a Plant-Based Diet',
      body: 'Discover the health benefits of a plant-based diet and how to get started.',
    },
    {
      id: 6,
      userId: 0,
      title: 'How to Start a Successful Blog',
      body: 'Learn the steps to create and grow a successful blog from scratch.',
    },
    {
      id: 7,
      userId: 0,
      title: 'The Future of Remote Work',
      body: 'Explore the trends and predictions for the future of remote work.',
    },
    {
      id: 8,
      userId: 0,
      title: 'Tips for Staying Productive While Working from Home',
      body: 'Boost your productivity with these tips for working from home.',
    },
    {
      id: 9,
      userId: 0,
      title: 'The Importance of Mental Health Awareness',
      body: 'Understand the importance of mental health awareness and how to support it.',
    },
    {
      id: 10,
      userId: 0,
      title: 'A Guide to Sustainable Living',
      body: 'Learn how to live a more sustainable and eco-friendly lifestyle.',
    },
    {
      id: 11,
      userId: 0,
      title: 'The Basics of Personal Finance',
      body: 'Get started with personal finance with these basic tips and strategies.',
    },
    {
      id: 12,
      userId: 0,
      title: 'How to Improve Your Public Speaking Skills',
      body: 'Enhance your public speaking skills with these practical tips.',
    },
    {
      id: 13,
      userId: 0,
      title: 'The Benefits of Regular Exercise',
      body: 'Discover the physical and mental benefits of regular exercise.',
    },
    {
      id: 14,
      userId: 0,
      title: 'How to Build a Strong Personal Brand',
      body: 'Learn the steps to create and maintain a strong personal brand.',
    },
  ];

  return mockArticles;
}

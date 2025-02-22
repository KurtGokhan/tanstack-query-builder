import { http, HttpResponse, delay } from 'msw';
import { setupWorker } from 'msw/browser';

export type UserData = { id: number; name: string; email: string; username: string; website: string };
export type PostData = { id: number; title: string; body: string; userId: number };
export type CommentData = { postId: number; id: number; name: string; email: string; body: string };

export const baseUrl = 'https://mock.blog.example.com';

function createMockData() {
  const users: UserData[] = [
    {
      id: 0,
      name: 'John Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      website: 'https://johndoe.example.com',
    },
  ];

  const posts: PostData[] = [
    {
      id: 7,
      userId: 0,
      title: 'Exploring the Future of AI',
      body: 'Artificial intelligence is transforming industries, from healthcare to finance. This post explores the latest advancements and future possibilities.',
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
  ];

  const comments: CommentData[] = [
    {
      id: 1,
      postId: 3,
      name: 'Mark Rivera',
      email: 'mark.rivera@example.com',
      body: "Very informative! I'd love to read more about crypto security practices.",
    },
    {
      id: 2,
      postId: 3,
      name: 'Ella Johnson',
      email: 'ella.johnson@example.com',
      body: 'Crypto can be tricky for beginners. Thanks for breaking it down!',
    },
    {
      id: 3,
      postId: 3,
      name: 'Ryan Clark',
      email: 'ryan.clark@example.com',
      body: 'Is there a specific exchange you recommend for beginners?',
    },
    {
      id: 4,
      postId: 0,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      body: 'Great insights! I wonder how AI will shape education in the next decade.',
    },
    {
      id: 5,
      postId: 0,
      name: 'Liam Smith',
      email: 'liam.smith@example.com',
      body: 'AI in healthcare is fascinating. The potential for early diagnosis is promising.',
    },
    {
      id: 6,
      postId: 2,
      name: 'Sophia Lee',
      email: 'sophia.lee@example.com',
      body: 'Thanks for the tips! Do you recommend any beginner-friendly plants for small spaces?',
    },
  ];

  return { users, posts, comments };
}

function saveMockData(saveData = { users, posts, comments }) {
  localStorage.setItem('mockData', JSON.stringify(saveData));
}

function recreateMockData() {
  const mock = createMockData();
  saveMockData(mock);
  return mock;
}

function getMockData() {
  const ls = localStorage.getItem('mockData');
  try {
    if (ls) {
      const data = JSON.parse(ls);
      if (data.users && data.posts && data.comments) return data as ReturnType<typeof createMockData>;
    }
  } catch (e) {}

  return recreateMockData();
}

let { users, posts, comments } = getMockData();

const handlers = [
  http.get(`${baseUrl}/reset`, async () => {
    await delay();
    const allData = recreateMockData();
    users = allData.users;
    posts = allData.posts;
    comments = allData.comments;

    return HttpResponse.json(undefined, { status: 204 });
  }),
  http.get(`${baseUrl}/users`, async () => {
    await delay();
    return HttpResponse.json(users);
  }),
  http.get(`${baseUrl}/posts`, async () => {
    await delay();
    return HttpResponse.json(posts);
  }),
  http.get(`${baseUrl}/posts/:id`, async (req) => {
    await delay();
    const { id } = req.params;
    const post = posts.find((post) => post.id === Number(id));
    if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(post);
  }),
  http.get(`${baseUrl}/comments`, async (req) => {
    await delay();
    const url = new URL(req.request.url);
    const postId = Number(url.searchParams.get('postId'));
    const postComments = comments.filter((comment) => comment.postId === postId);
    return HttpResponse.json(postComments);
  }),
  http.delete(`${baseUrl}/posts/:id`, async (req) => {
    await delay(2500);
    const { id } = req.params;
    const postIndex = posts.findIndex((post) => post.id === Number(id));
    if (postIndex === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

    posts.splice(postIndex, 1);
    saveMockData();
    return HttpResponse.json(undefined, { status: 204 });
  }),
  http.post(`${baseUrl}/posts`, async (req) => {
    await delay();
    const newPost = (await req.request.json()) as PostData;
    newPost.id = Math.max(...posts.map((x) => x.id)) + 1;
    posts.push(newPost);
    saveMockData();
    return HttpResponse.json(newPost, { status: 201 });
  }),
  http.put(`${baseUrl}/posts/:id`, async (req) => {
    await delay();
    const { id } = req.params;
    const updatedPost = (await req.request.json()) as PostData;
    const postIndex = posts.findIndex((post) => post.id === Number(id));
    if (postIndex === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    Object.assign(posts[postIndex], updatedPost);
    saveMockData();
    return HttpResponse.json(posts[postIndex]);
  }),
];

await setupWorker(...handlers).start({
  onUnhandledRequest: 'bypass',
  quiet: true,
});

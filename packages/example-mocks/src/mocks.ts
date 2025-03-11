import { http, HttpResponse, delay } from 'msw';
import { createMockComments } from './comments';
import { PostData, createMockPosts } from './posts';

export type UserData = { id: number; name: string; email: string; username: string; website: string };

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

  const posts = createMockPosts();
  const comments = createMockComments();

  return { users, posts, comments };
}

export function getMockHandlers(withLocalStorage = true) {
  function saveMockData(saveData = { users, posts, comments }) {
    if (!withLocalStorage) return;
    localStorage.setItem('mockData', JSON.stringify(saveData));
  }

  function recreateMockData() {
    const mock = createMockData();
    saveMockData(mock);
    return mock;
  }

  function getMockData() {
    try {
      if (withLocalStorage) {
        const ls = localStorage.getItem('mockData');
        if (ls) {
          const data = JSON.parse(ls);
          if (data.users && data.posts && data.comments) return data as ReturnType<typeof createMockData>;
        }
      }
    } catch (e) {}

    return recreateMockData();
  }

  let { users, posts, comments } = getMockData();

  window.addEventListener('storage', (event) => {
    if (event.key === 'mockData') {
      const { users: newUsers, posts: newPosts, comments: newComments } = getMockData();
      users = newUsers;
      posts = newPosts;
      comments = newComments;
    }
  });

  const mockHandlers = [
    http.post(`${baseUrl}/reset`, async () => {
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
    http.get(`${baseUrl}/posts`, async (req) => {
      await delay();
      const page = Number(new URL(req.request.url).searchParams.get('page')) || 0;
      const pageSize = 5;
      return HttpResponse.json(posts.slice(page * pageSize, (page + 1) * pageSize));
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
      await delay(1000);
      const { id } = req.params;
      if (id === '0') return HttpResponse.json({ error: '[Mock] Failed to delete' }, { status: 500 });

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

  return mockHandlers;
}

import { http, HttpResponse, delay } from 'msw';
import { ArticleData, createMockArticles } from './articles';
import { createMockComments } from './comments';

export type UserData = { id: number; name: string; email: string; username: string; website: string };

export const baseUrl = 'https://mock.blog.example.com';

const isTest = import.meta.env.MODE === 'test';

const stdDelay = () => (isTest ? delay(50) : delay(600 + Math.random() * 400));

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

  const articles = createMockArticles();
  const comments = createMockComments();

  return { users, articles, comments };
}

export function getMockHandlers(withLocalStorage = !isTest) {
  function saveMockData(saveData = { users, articles, comments }) {
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
          if (data.users && data.articles && data.comments) return data as ReturnType<typeof createMockData>;
        }
      }
    } catch (e) {}

    return recreateMockData();
  }

  let { users, articles, comments } = getMockData();

  window.addEventListener('storage', (event) => {
    if (event.key === 'mockData') {
      const { users: newUsers, articles: newArticles, comments: newComments } = getMockData();
      users = newUsers;
      articles = newArticles;
      comments = newComments;
    }
  });

  const mockHandlers = [
    http.post(`${baseUrl}/reset`, async () => {
      await stdDelay();
      const allData = recreateMockData();
      users = allData.users;
      articles = allData.articles;
      comments = allData.comments;

      return HttpResponse.json(undefined, { status: 204 });
    }),
    http.get(`${baseUrl}/users`, async () => {
      await stdDelay();
      return HttpResponse.json(users);
    }),
    http.get(`${baseUrl}/articles`, async (req) => {
      await stdDelay();
      const page = Number(new URL(req.request.url).searchParams.get('page')) || 0;
      const pageSize = 5;
      return HttpResponse.json(articles.slice(page * pageSize, (page + 1) * pageSize));
    }),
    http.get(`${baseUrl}/articles/:id`, async (req) => {
      await stdDelay();
      const { id } = req.params;
      const article = articles.find((article) => article.id === Number(id));
      if (!article) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      return HttpResponse.json(article);
    }),
    http.get(`${baseUrl}/comments`, async (req) => {
      await stdDelay();
      const url = new URL(req.request.url);
      const articleId = Number(url.searchParams.get('articleId'));
      const articleComments = comments.filter((comment) => comment.articleId === articleId);
      return HttpResponse.json(articleComments);
    }),
    http.delete(`${baseUrl}/articles/:id`, async (req) => {
      await delay(1000);
      const { id } = req.params;
      if (id === '0') return HttpResponse.json({ error: '[Mock] Failed to delete' }, { status: 500 });

      const articleIndex = articles.findIndex((article) => article.id === Number(id));
      if (articleIndex === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

      articles.splice(articleIndex, 1);
      saveMockData();
      return HttpResponse.json(undefined, { status: 204 });
    }),
    http.post(`${baseUrl}/articles`, async (req) => {
      await stdDelay();
      const newArticle = (await req.request.json()) as ArticleData;
      newArticle.id = Math.max(...articles.map((x) => x.id)) + 1;
      articles.push(newArticle);
      saveMockData();
      return HttpResponse.json(newArticle, { status: 201 });
    }),
    http.put(`${baseUrl}/articles/:id`, async (req) => {
      await stdDelay();
      const { id } = req.params;
      const updatedArticle = (await req.request.json()) as ArticleData;
      const articleIndex = articles.findIndex((article) => article.id === Number(id));
      if (articleIndex === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      Object.assign(articles[articleIndex], updatedArticle);
      saveMockData();
      return HttpResponse.json(articles[articleIndex]);
    }),
  ];

  return mockHandlers;
}

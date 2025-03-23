import { QueryClient } from '@tanstack/react-query';
import { HttpQueryBuilder } from 'tanstack-query-builder/http';

type ArticleData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const builder = new HttpQueryBuilder().withClient(client).withBaseUrl('https://api.example.com').withTagTypes<{
  articles: ArticleData[];
  refreshable: unknown;
}>();

const articlesQuery = builder.withTags('refreshable', 'articles').withPath('/articles').withData<ArticleData[]>();

const deleteArticleMutation = builder.withUpdates('articles').withMethod('delete').withPath('/articles/:id');

export function MyApp() {
  const [refresh, { isPending: isRefreshing }] = builder.tags.useOperation({ tags: 'refreshable' });
  const articles = articlesQuery.useQuery({});
  const deleteArticle = deleteArticleMutation.useMutation();

  const onDelete = (id: number) => deleteArticle.mutateAsync({ params: { id } });

  if (!articles.isSuccess) return <>Loading...</>;

  return (
    <>
      <button onClick={() => refresh()} disabled={isRefreshing}>
        Refresh all articles
      </button>

      {articles.data.map((article) => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.body}</p>

          <button onClick={() => onDelete(article.id)} disabled={deleteArticle.isPending}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
}

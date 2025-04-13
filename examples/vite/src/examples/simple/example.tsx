import { QueryClient } from '@tanstack/react-query';
import { HttpQueryBuilder } from 'tanstack-query-builder/http';

type ArticleData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const builder = new HttpQueryBuilder().withClient(client).withBaseUrl('https://api.example.com');

const articlesQuery = builder //
  .withPath('/articles')
  .withData<ArticleData[]>()
  .withTags('articles');

const deleteArticleMutation = builder //
  .withMethod('delete')
  .withPath('/articles/:id')
  .withUpdates('articles');

export function App() {
  const { isLoading, data } = articlesQuery.useQuery({});

  return (
    <>
      {isLoading && <p>Loading...</p>}

      {data?.map((article) => (
        <ArticleView key={article.id} article={article} />
      ))}
    </>
  );
}

function ArticleView({ article }: { article: ArticleData }) {
  const { mutateAsync, isPending } = deleteArticleMutation.useMutation();
  const onDelete = () => mutateAsync({ params: { id: article.id } });

  return (
    <div key={article.id}>
      <h2>{article.title}</h2>
      <p>{article.body}</p>

      <button disabled={isPending} onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}

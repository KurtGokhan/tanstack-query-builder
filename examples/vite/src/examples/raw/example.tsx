import { QueryClient, queryOptions, useMutation, useQuery } from '@tanstack/react-query';

type ArticleData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const articlesQuery = queryOptions<ArticleData[]>({
  queryKey: ['articles'],
  queryFn: () => fetch('https://api.example.com/articles').then((res) => res.json()),
});

export function App() {
  const { isLoading, data } = useQuery(articlesQuery);

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
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (params: { id: number }) => {
      return fetch(`https://api.example.com/articles/${params.id}`, { method: 'DELETE' });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: articlesQuery.queryKey }),
  });
  const onDelete = () => mutateAsync({ id: article.id });

  return (
    <div key={article.id}>
      <h2>{article.title}</h2>
      <p>{article.body}</p>

      <button onClick={onDelete} disabled={isPending}>
        Delete
      </button>
    </div>
  );
}

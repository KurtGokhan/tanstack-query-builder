import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { articleQuery, articlesQuery, builder, commentsQuery, deleteArticleMutation, resetMutation } from './example';

export function MainExample() {
  const [enablePrefetch, setEnablePrefetch] = useState(false);
  const nav = useNavigate();

  const articles = articlesQuery.useInfiniteQuery({});
  const reset = resetMutation.useMutation();

  const deleteErrors = deleteArticleMutation.useMutationState(undefined, { status: 'error' }, (x) => x.state.variables?.params.id);

  const reload = () => builder.tags.reset({ tags: 'refreshable' });

  return (
    <>
      <div className="p-4">
        <button onClick={reload} disabled={articles.isFetching} className="btn btn-primary mr-2">
          Reload
        </button>

        <button onClick={() => reset.mutateAsync({})} disabled={reset.isPending} className="btn btn-secondary mr-2">
          Reset
        </button>

        <label className="flex items-center">
          <input type="checkbox" onChange={(e) => setEnablePrefetch(e.target.checked)} checked={enablePrefetch} className="mr-2" />
          Enable prefetch on hover
        </label>
      </div>

      {articles.isLoading ? (
        <div className="text-center">Loading...</div>
      ) : articles.isError ? (
        <div className="text-red-500">{articles.error.message}</div>
      ) : (
        articles.data?.pages?.flat().map((article) => (
          <div key={article.id} className="p-4 border-b flex flex-row">
            <div className="flex flex-col grow">
              <a>
                <h2
                  className="link"
                  onClick={() => nav({ to: '/main/$id', params: { id: String(article.id) } })}
                  onMouseOver={() => {
                    if (!enablePrefetch) return;
                    articleQuery.client.prefetch({ id: article.id });
                    commentsQuery.client.prefetch({ search: { articleId: article.id } });
                  }}
                >
                  {article.id} - {article.title}
                </h2>
              </a>

              <p className="mt-2 whitespace-pre-wrap">{article.body}</p>
            </div>

            <div className="flex flex-col items-end">
              <button
                onClick={() => deleteArticleMutation.client.mutate({ params: { id: article.id } }).catch(() => {})}
                disabled={deleteArticleMutation.client.isMutating({ params: { id: article.id } }) > 0}
                className="btn btn-danger mt-2"
              >
                Delete
              </button>

              {deleteErrors.includes(article.id) && <span className="text-red-500 ml-4">Error deleting article</span>}
            </div>
          </div>
        ))
      )}

      {articles.hasNextPage && (
        <button onClick={() => articles.fetchNextPage()} disabled={articles.isFetching} className="btn btn-primary m-4">
          Load next page
          {articles.isFetching && <span className="loader" />}
        </button>
      )}
    </>
  );
}

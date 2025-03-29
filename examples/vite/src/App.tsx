import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRef, useState } from 'react';
import { ArticleData, CommentData, baseUrl, getMockHandlers } from 'tanstack-query-builder-example-mocks';
import { setupMSW } from 'tanstack-query-builder-example-mocks/setup-msw';
import { HttpQueryBuilder } from 'tanstack-query-builder/http';
import { queryClient } from './client';
import './index.css';

await setupMSW(...getMockHandlers()).start({ onUnhandledRequest: 'bypass', quiet: true, waitUntilReady: true });

const builder = new HttpQueryBuilder().withClient(queryClient).withBaseUrl(baseUrl).withTagTypes<{
  article: ArticleData;
  articles: ArticleData[];
  comments: CommentData;
  refreshable: unknown;
}>();

const resetMutation = builder.withPath('/reset').withMethod('post').withUpdates('*');

const articlesQuery = builder
  .withTags('refreshable', 'articles')
  .withPath('/articles')
  .withData<ArticleData[]>()
  .withSearch<{ page?: number }>()
  .withPagination({
    initialPageParam: { search: { page: 0 } },
    getNextPageParam: (prev, __, lastVars) => (!prev?.length ? null : { search: { page: (lastVars?.search?.page || 0) + 1 } }),
  });

const { useQuery: useArticle, ...articleQuery } = builder
  .withTags('refreshable')
  .withPath('/articles/:id')
  .withData<ArticleData>()
  .withTags((ctx) => ({ type: 'article', id: ctx.data.id }))
  .withPreprocessor<{ id: number }>((vars) => ({ ...vars, params: { id: vars.id } }))
  .withMiddleware(async (ctx, next) => {
    const res = await next(ctx);
    return { ...res, titleUppercase: res.title.toUpperCase() };
  })
  .asBound();

const commentsQuery = builder
  .withTags('refreshable')
  .withPath('/comments')
  .withSearch<{ articleId: number | null }>()
  .withData<CommentData[]>();

const editArticleMutation = builder
  .withPath('/articles/:id')
  .withMethod('put')
  .withBody<Partial<ArticleData>>()
  .withUpdates(
    {
      type: 'articles',
      optimistic: true,
      updater: 'update-body-by-id',
    },
    (ctx) => ({
      type: 'article',
      id: ctx.vars.params.id,
      optimistic: true,
      updater: 'merge-body',
    }),
  )
  .withMiddleware(async (ctx, next) => {
    const res = await next({
      ...ctx,
      vars: {
        ...ctx.vars,
        body: { ...ctx.vars.body, body: `${ctx.vars.body?.body} \n Last updated ${new Date().toISOString()}` },
      },
    });
    return res;
  });

const deleteArticleMutation = builder.withMethod('delete').withPath('/articles/:id').withUpdates({
  type: 'articles',
  optimistic: true,
  updater: 'delete-params-by-id',
});

function AppCore() {
  const [enablePrefetch, setEnablePrefetch] = useState(false);
  const [articleId, setArticleId] = useState<number | null>(null);

  const articles = articlesQuery.useInfiniteQuery({}, { enabled: articleId == null });
  const reset = resetMutation.useMutation();

  const deleteErrors = deleteArticleMutation.useMutationState(undefined, { status: 'error' }, (x) => x.state.variables?.params.id);

  const reload = () => builder.tags.reset({ tags: 'refreshable' });

  if (articleId != null) return <ArticlePage articleId={articleId} onBack={() => setArticleId(null)} />;

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
                  onClick={() => setArticleId(article.id)}
                  onMouseOver={() => {
                    if (!enablePrefetch) return;
                    articleQuery.client.prefetch({ id: article.id });
                    commentsQuery.client.prefetch({ search: { articleId: article.id } });
                  }}
                  className="text-xl font-bold cursor-pointer text-blue-800 hover:underline"
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

function ArticlePage({ articleId, onBack }: { articleId: number; onBack: () => void }) {
  const article = useArticle({ id: articleId });
  const comments = commentsQuery.useQuery({ search: { articleId: articleId } });
  const [showEdit, setShowEdit] = useState(false);
  const editArticle = editArticleMutation.useMutation();

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      {!showEdit ? (
        <>
          {article.isLoading ? (
            <div className="text-center">Loading...</div>
          ) : article.isError ? (
            <div className="text-red-500">{article.error.message}</div>
          ) : (
            <div className="p-4">
              <h2 className="text-2xl font-bold">{article.data?.titleUppercase}</h2>
              <p className="mt-2 whitespace-pre-wrap">{article.data?.body}</p>
              <button onClick={onBack} className="btn btn-secondary mt-4 mr-2">
                Back
              </button>
              <button onClick={() => setShowEdit(true)} disabled={editArticle.isPending} className="btn btn-primary mt-4">
                Edit article
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-4">
          <h2 className="text-2xl font-bold">Edit article</h2>

          <input ref={titleRef} defaultValue={article.data?.title} className="block w-full mt-2 p-2 border rounded" />

          <textarea ref={bodyRef} defaultValue={article.data?.body} className="block w-full mt-2 p-2 border rounded" />

          <button
            onClick={() => {
              editArticle.mutateAsync({
                params: { id: articleId },
                body: {
                  id: articleId,
                  title: titleRef.current!.value,
                  body: bodyRef.current!.value,
                },
              });

              setShowEdit(false);
            }}
            disabled={editArticle.isPending}
            className="btn btn-primary mt-4"
          >
            Save
          </button>
        </div>
      )}

      <h3 className="text-xl font-bold m-4">Comments</h3>

      {comments.isLoading ? (
        <div className="text-center">Loading comments...</div>
      ) : comments.isError ? (
        <div className="text-red-500">{comments.error.message}</div>
      ) : (
        comments.data?.map((comment) => (
          <div key={comment.id} className="p-4 border-b">
            <h5 className="text-lg font-bold">{comment.name}</h5>
            <p className="mt-2">{comment.body}</p>
          </div>
        ))
      )}
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppCore />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

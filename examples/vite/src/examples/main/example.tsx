import { queryClient } from 'src/client';
import { ArticleData, CommentData, baseUrl } from 'tanstack-query-builder-example-mocks';
import { HttpQueryBuilder } from 'tanstack-query-builder/http';

export const builder = new HttpQueryBuilder().withClient(queryClient).withBaseUrl(baseUrl).withTagTypes<{
  article: ArticleData;
  articles: ArticleData[];
  comments: CommentData;
  refreshable: unknown;
}>();

export const resetMutation = builder.withPath('/reset').withMethod('post').withUpdates('*');

export const articlesQuery = builder
  .withTags('articles', 'refreshable')
  .withPath('/articles')
  .withSearch<{ page?: number }>()
  .withPagination({
    initialPageParam: { search: { page: 0 } },
    getNextPageParam: (prev, __, lastVars) => (!prev?.length ? null : { search: { page: (lastVars?.search?.page || 0) + 1 } }),
  });

export const { useQuery: useArticle, ...articleQuery } = builder
  .withTags('article', 'refreshable')
  .withTags((ctx) => ({ type: 'article', id: ctx.data.id }))
  .withPath('/articles/:id')
  .withPreprocessor<{ id: number }>((vars) => ({ ...vars, params: { id: vars.id } }))
  .withPostprocessor((data) => ({ ...data, titleUppercase: data.title.toUpperCase() }))
  .asBound();

export const commentsQuery = builder
  .withTags('refreshable')
  .withPath('/comments')
  .withSearch<{ articleId: number | null }>()
  .withData<CommentData[]>();

export const editArticleMutation = builder
  .withPath('/articles/:id')
  .withMethod('put')
  .withBody<Partial<ArticleData>>()
  .withUpdates(
    {
      type: 'articles',
      optimistic: true,
      updater: 'update-with-body-by-id',
    },
    (ctx) => ({
      type: 'article',
      id: ctx.vars.params.id,
      optimistic: true,
      updater: 'merge-with-body',
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

export const deleteArticleMutation = builder.withMethod('delete').withPath('/articles/:id').withUpdates({
  type: 'articles',
  optimistic: true,
  updater: 'delete-with-params-by-id',
});

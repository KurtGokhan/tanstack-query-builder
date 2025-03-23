import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRef, useState } from 'react';
import { CommentData, PostData, baseUrl, getMockHandlers } from 'tanstack-query-builder-example-mocks';
import { setupMSW } from 'tanstack-query-builder-example-mocks/setup-msw';
import { HttpQueryBuilder } from 'tanstack-query-builder/http';
import { queryClient } from './client';
import './index.css';

await setupMSW(...getMockHandlers()).start({ onUnhandledRequest: 'bypass', quiet: true, waitUntilReady: true });

const builder = new HttpQueryBuilder().withClient(queryClient).withBaseUrl(baseUrl).withTagTypes<{
  post: PostData;
  posts: PostData[];
  comments: CommentData;
  refreshable: unknown;
}>();

const resetMutation = builder.withPath('/reset').withMethod('post').withUpdates('*');

const postsQuery = builder
  .withTags('refreshable', 'posts')
  .withPath('/posts')
  .withData<PostData[]>()
  .withSearch<{ page?: number }>()
  .withPagination({
    initialPageParam: { search: { page: 0 } },
    getNextPageParam: (prev, __, lastVars) => (!prev?.length ? null : { search: { page: (lastVars?.search?.page || 0) + 1 } }),
  });

const { useQuery: usePost, ...postQuery } = builder
  .withTags('refreshable')
  .withPath('/posts/:id')
  .withData<PostData>()
  .withTags((ctx) => ({ type: 'post', id: ctx.data.id }))
  .withPreprocessor<{ id: number }>((vars) => ({ ...vars, params: { id: vars.id } }))
  .withMiddleware(async (ctx, next) => {
    const res = await next(ctx);
    return { ...res, titleUppercase: res.title.toUpperCase() };
  })
  .asBound();

const commentsQuery = builder
  .withTags('refreshable')
  .withPath('/comments')
  .withSearch<{ postId: number | null }>()
  .withData<CommentData[]>();

const editPostMutation = builder
  .withPath('/posts/:id')
  .withMethod('put')
  .withBody<Partial<PostData>>()
  .withUpdates(
    {
      type: 'posts',
      optimistic: true,
      updater: 'update-body-by-id',
    },
    (ctx) => ({
      type: 'post',
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

const deletePostMutation = builder.withMethod('delete').withPath('/posts/:id').withUpdates({
  type: 'posts',
  optimistic: true,
  updater: 'delete-params-by-id',
});

function AppCore() {
  const [enablePrefetch, setEnablePrefetch] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);

  const posts = postsQuery.useInfiniteQuery({}, { enabled: postId == null });
  const reset = resetMutation.useMutation();

  const deleteErrors = deletePostMutation.useMutationState(undefined, { status: 'error' }, (x) => x.state.variables?.params.id);

  const reload = () => builder.tags.reset({ tags: 'refreshable' });

  if (postId != null) return <PostPage postId={postId} onBack={() => setPostId(null)} />;

  return (
    <>
      <div className="p-4">
        <button onClick={reload} disabled={posts.isFetching} className="btn btn-primary mr-2">
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

      {posts.isLoading ? (
        <div className="text-center">Loading...</div>
      ) : posts.isError ? (
        <div className="text-red-500">{posts.error.message}</div>
      ) : (
        posts.data?.pages?.flat().map((post) => (
          <div key={post.id} className="p-4 border-b flex flex-row">
            <div className="flex flex-col grow">
              <a>
                <h2
                  onClick={() => setPostId(post.id)}
                  onMouseOver={() => {
                    if (!enablePrefetch) return;
                    postQuery.client.prefetch({ id: post.id });
                    commentsQuery.client.prefetch({ search: { postId: post.id } });
                  }}
                  className="text-xl font-bold cursor-pointer text-blue-800 hover:underline"
                >
                  {post.id} - {post.title}
                </h2>
              </a>

              <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
            </div>

            <div className="flex flex-col items-end">
              <button
                onClick={() => deletePostMutation.client.mutate({ params: { id: post.id } }).catch(() => {})}
                disabled={deletePostMutation.client.isMutating({ params: { id: post.id } }) > 0}
                className="btn btn-danger mt-2"
              >
                Delete
              </button>

              {deleteErrors.includes(post.id) && <span className="text-red-500 ml-4">Error deleting post</span>}
            </div>
          </div>
        ))
      )}

      {posts.hasNextPage && (
        <button onClick={() => posts.fetchNextPage()} disabled={posts.isFetchingNextPage} className="btn btn-primary mt-4">
          Load next page
        </button>
      )}
    </>
  );
}

function PostPage({ postId, onBack }: { postId: number; onBack: () => void }) {
  const post = usePost({ id: postId });
  const comments = commentsQuery.useQuery({ search: { postId: postId } });
  const [showEdit, setShowEdit] = useState(false);
  const editPost = editPostMutation.useMutation();

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      {!showEdit ? (
        <>
          {post.isLoading ? (
            <div className="text-center">Loading...</div>
          ) : post.isError ? (
            <div className="text-red-500">{post.error.message}</div>
          ) : (
            <div className="p-4">
              <h2 className="text-2xl font-bold">{post.data?.titleUppercase}</h2>
              <p className="mt-2 whitespace-pre-wrap">{post.data?.body}</p>
              <button onClick={onBack} className="btn btn-secondary mt-4 mr-2">
                Back
              </button>
              <button onClick={() => setShowEdit(true)} disabled={editPost.isPending} className="btn btn-primary mt-4">
                Edit post
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-4">
          <h2 className="text-2xl font-bold">Edit post</h2>

          <input ref={titleRef} defaultValue={post.data?.title} className="block w-full mt-2 p-2 border rounded" />

          <textarea ref={bodyRef} defaultValue={post.data?.body} className="block w-full mt-2 p-2 border rounded" />

          <button
            onClick={() => {
              editPost.mutateAsync({
                params: { id: postId },
                body: {
                  id: postId,
                  title: titleRef.current!.value,
                  body: bodyRef.current!.value,
                },
              });

              setShowEdit(false);
            }}
            disabled={editPost.isPending}
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

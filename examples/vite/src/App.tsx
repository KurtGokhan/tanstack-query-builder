import './mocks';
import { useRef, useState } from 'react';
import { CommentData, PostData, baseUrl } from './mocks';
import './App.css';
import { HttpQueryBuilder } from 'react-query-builder';
import { queryClient } from './client';

const builder = new HttpQueryBuilder({
  queryClient,
  syncChannel: new BroadcastChannel('react-query-builder'),
})
  .withBaseUrl(baseUrl)
  .withTagTypes<{
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
  .withConfig({
    options: {
      getInitialPageParam: { search: { page: 0 } },
      getNextPageParam: (prev, __, lastVars) => (!prev?.length ? null : { search: { page: (lastVars?.search?.page || 0) + 1 } }),
    },
  });

const postQuery = builder
  .withTags('refreshable')
  .withPath('/posts/:id')
  .withData<PostData>()
  .withTags((ctx) => ({ type: 'post', id: ctx.data.id }))
  .withPreprocessor<{ id: number }>((vars) => ({ ...vars, params: { id: vars.id } }))
  .withMiddleware(async (ctx, next) => {
    const res = await next(ctx);
    return { ...res, titleUppercase: res.title.toUpperCase() };
  });

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

function App() {
  const [enablePrefetch, setEnablePrefetch] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);

  const posts = postsQuery.useInfiniteQuery({}, { enabled: postId != null });
  const reset = resetMutation.useMutation();

  const deleteErrors = deletePostMutation.useMutationState(undefined, { status: 'error' }, (x) => x.state.variables?.params.id);

  const reload = () => builder.tags.reset({ tags: 'refreshable' });

  if (postId != null) return <PostPage postId={postId} onBack={() => setPostId(null)} />;

  return (
    <>
      <button onClick={reload} disabled={posts.isFetching}>
        Reload
      </button>

      <button onClick={() => reset.mutateAsync({})} disabled={reset.isPending}>
        Reset
      </button>

      <label>
        <input type="checkbox" onChange={(e) => setEnablePrefetch(e.target.checked)} checked={enablePrefetch} />
        Enable prefetch
      </label>

      {posts.isLoading
        ? 'Loading...'
        : posts.isError
          ? posts.error.message
          : posts.data?.pages?.flat().map((post) => (
              <div key={post.id}>
                <a>
                  <h2 onClick={() => setPostId(post.id)} onMouseOver={() => enablePrefetch && postQuery.client.prefetch({ id: post.id })}>
                    {post.id} - {post.title}
                  </h2>
                </a>

                <button
                  onClick={() => deletePostMutation.client.mutate({ params: { id: post.id } })}
                  // disabled={deletePostMutation.client.isMutating() > 0}
                >
                  Delete
                </button>

                {deleteErrors.includes(post.id) && <span style={{ color: 'red' }}>Error deleting post</span>}

                <p>{post.body}</p>
              </div>
            ))}

      {posts.hasNextPage && (
        <button onClick={() => posts.fetchNextPage()} disabled={posts.isFetchingNextPage}>
          Load next page
        </button>
      )}
    </>
  );
}

function PostPage({ postId, onBack }: { postId: number; onBack: () => void }) {
  const post = postQuery.useQuery({ id: postId });
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
            'Loading...'
          ) : post.isError ? (
            post.error.message
          ) : (
            <div>
              <h2>{post.data?.titleUppercase}</h2>
              <p>{post.data?.body}</p>
              <button onClick={onBack}>Back</button>
              <button onClick={() => setShowEdit(true)} disabled={editPost.isPending}>
                Edit post
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Edit post</h2>

          <input ref={titleRef} defaultValue={post.data?.title} style={{ display: 'block' }} />

          <textarea ref={bodyRef} defaultValue={post.data?.body} style={{ display: 'block', width: 400 }} />

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
          >
            Save
          </button>
        </>
      )}

      <h3>Comments</h3>

      {comments.isLoading
        ? 'Loading comments...'
        : comments.isError
          ? comments.error.message
          : comments.data?.map((comment) => (
              <div key={comment.id}>
                <h5>{comment.name}</h5>
                <p>{comment.body}</p>
              </div>
            ))}
    </>
  );
}

export default App;

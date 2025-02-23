import './mocks';
import { useRef, useState } from 'react';
import { CommentData, PostData, baseUrl } from './mocks';
import './App.css';
import { HttpQueryBuilder, useOperateOnTags } from 'react-query-builder';
import { queryClient } from './client';

const baseQuery = new HttpQueryBuilder({ queryClient }).withBaseUrl(baseUrl);
const baseMutation = baseQuery.asMutationBuilder();

const resetMutation = baseMutation.withPath('/reset').withConfig({ invalidates: '*' });

const postsQuery = baseQuery
  .withConfig({ tags: 'refreshable' })
  .withConfig({ tags: { type: 'posts' as any, id: 'LIST' } })
  .withPath('/posts')
  .withData<PostData[]>();

const postQuery = baseQuery
  .withConfig({ tags: 'refreshable' })
  .withPath('/posts/:id')
  .withData<PostData>()
  .withConfig({
    tags: (ctx) => [{ type: 'posts' as any, id: ctx.vars.params.id }],
  });

const commentsQuery = baseQuery
  .withConfig({ tags: 'refreshable' })
  .withPath('/comments')
  .withSearch<{ postId: number | null }>()
  .withData<CommentData[]>();

const editPostMutation = baseMutation
  .withPath('/posts/:id')
  .withVars({ method: 'put' })
  .withBody<Partial<PostData>>()
  .withConfig({
    invalidates: () => [{ type: 'posts' as any, id: 'LIST' }],
    optimisticUpdates: (ctx) => [
      {
        type: 'posts' as any,
        id: ctx.vars.params.id,
        updater(ctx, target) {
          return { ...target!, ...ctx.vars.body };
        },
      },
    ],
  });

const deletePostMutation = baseMutation
  .withVars({ method: 'delete' })
  .withPath('/posts/:id')
  .withConfig({
    optimisticUpdates: {
      type: 'posts' as any,
      id: 'LIST',
      updater(ctx, target) {
        return (target as PostData[]).filter((post) => post.id !== ctx.vars.params.id);
      },
    },
  });

function App() {
  const [postId, setPostId] = useState<number | null>(null);

  const posts = postsQuery.useQuery({}, { enabled: !postId });
  const reset = resetMutation.useMutation();

  const deleteErrors = deletePostMutation.useMutationState(
    undefined,
    { status: 'error' },
    (x) => x.state.variables?.params.id,
  );

  const [refresh] = useOperateOnTags({ tags: ['refreshable'], operation: 'refetch' });

  if (postId) return <PostPage postId={postId} onBack={() => setPostId(null)} />;

  return (
    <>
      <button onClick={() => refresh()} disabled={posts.isFetching}>
        Refresh
      </button>

      <button onClick={() => reset.mutateAsync({})} disabled={reset.isPending}>
        Reset
      </button>

      {posts.isLoading
        ? 'Loading...'
        : posts.isError
          ? posts.error.message
          : posts.data?.map((post) => (
              <div key={post.id}>
                <a>
                  <h2
                    onClick={() => setPostId(post.id)}
                    onMouseOver={() => {
                      postQuery.client.prefetch({ params: { id: post.id } });
                      commentsQuery.client.prefetch({ search: { postId: post.id } });
                    }}
                  >
                    {post.title}
                  </h2>
                </a>

                <button
                  onClick={() => deletePostMutation.mutate({ params: { id: post.id } })}
                  disabled={deletePostMutation.isMutating() > 0}
                >
                  Delete
                </button>

                {deleteErrors.includes(post.id) && <span style={{ color: 'red' }}>Error deleting post</span>}

                <p>{post.body}</p>
              </div>
            ))}
    </>
  );
}

function PostPage({ postId, onBack }: { postId: number; onBack: () => void }) {
  const post = postQuery.useQuery({ params: { id: postId } });
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
              <h2>{post.data?.title}</h2>
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
                body: { title: titleRef.current!.value, body: bodyRef.current!.value },
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

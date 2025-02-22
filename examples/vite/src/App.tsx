import './mocks';
import { useState } from 'react';
import { CommentData, PostData, baseUrl } from './mocks';
import './App.css';
import { HttpMutationBuilder, HttpQueryBuilder, useOperateOnTags } from 'react-query-builder';
import { queryClient } from './client';

const baseQuery = new HttpQueryBuilder({ queryClient }).withBaseUrl(baseUrl);
const baseMutation = new HttpMutationBuilder({ queryClient }).withBaseUrl(baseUrl);

const resetMutation = baseMutation.withPath('/reset').withConfig({ invalidates: ['posts' as any, 'refreshable'] });

const postsQuery = baseQuery
  .withConfig({ tags: 'refreshable' })
  .withConfig({ tags: { type: 'posts' as any, id: 'LIST' } })
  .withPath('/posts')
  .withData<PostData[]>();

const postQuery = baseQuery.withConfig({ tags: 'refreshable' }).withPath('/posts/:id').withData<PostData>();

const commentsQuery = baseQuery
  .withConfig({ tags: 'refreshable' })
  .withPath('/comments')
  .withSearch<{ postId: number | null }>()
  .withData<CommentData[]>();

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
  const deletePost = deletePostMutation.useMutation();
  const reset = resetMutation.useMutation();

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
                      postQuery.client.ensureData({ params: { id: post.id } });
                      commentsQuery.client.ensureData({ search: { postId: post.id } });
                    }}
                  >
                    {post.title}
                  </h2>
                </a>

                <button
                  onClick={() => deletePost.mutateAsync({ params: { id: post.id } })}
                  disabled={deletePost.isPending}
                >
                  Delete
                </button>

                <p>{post.body}</p>
              </div>
            ))}
    </>
  );
}

function PostPage({ postId, onBack }: { postId: number; onBack: () => void }) {
  const post = postQuery.useQuery({ params: { id: postId } });
  const comments = commentsQuery.useQuery({ search: { postId: postId } });

  return (
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
        </div>
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

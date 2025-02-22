import { useState } from 'react';
import './App.css';
import { HttpMutationBuilder, HttpQueryBuilder, useOperateOnTags } from 'react-query-builder';

const baseQuery = new HttpQueryBuilder().withBaseUrl('https://jsonplaceholder.typicode.com');
const baseMutation = new HttpMutationBuilder().withBaseUrl('https://jsonplaceholder.typicode.com');

type PostData = { id: number; title: string; body: string; userId: number };
type CommentData = { postId: number; id: number; name: string; email: string; body: string };

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
  .withConfig({ invalidates: { type: 'posts' as any, id: 'LIST' } })
  .withVars({ method: 'delete' })
  .withPath('/posts/:id');

function App() {
  const [clickedPost, setClickedPost] = useState<number | null>(null);

  const posts = postsQuery.useQuery({}, { enabled: !clickedPost });
  const post = postQuery.useQuery({ params: { id: clickedPost } }, { enabled: !!clickedPost });
  const comments = commentsQuery.useQuery({ search: { postId: clickedPost } }, { enabled: !!clickedPost });

  const deletePost = deletePostMutation.useMutation();

  const [refresh] = useOperateOnTags({ tags: ['refreshable'], operation: 'refetch' });

  if (clickedPost) {
    return (
      <>
        <button onClick={() => refresh()} disabled={post.isFetching}>
          Refresh
        </button>

        {post.isLoading ? (
          'Loading...'
        ) : post.isError ? (
          post.error.message
        ) : (
          <div>
            <h2>{post.data?.title}</h2>
            <p>{post.data?.body}</p>
            <button onClick={() => setClickedPost(null)}>Back</button>
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

  return (
    <>
      <button onClick={() => refresh()} disabled={posts.isFetching}>
        Refresh
      </button>

      {posts.isLoading
        ? 'Loading...'
        : posts.isError
          ? posts.error.message
          : posts.data?.map((post) => (
              <div key={post.id}>
                <a>
                  <h2 onClick={() => setClickedPost(post.id)}>{post.title}</h2>
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

export default App;

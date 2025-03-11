import { QueryClient } from '@tanstack/react-query';
import { HttpQueryBuilder } from 'react-query-builder';

type PostData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const builder = new HttpQueryBuilder().withClient(client).withBaseUrl('https://jsonplaceholder.typicode.com').withTagTypes<{
  posts: PostData[];
  refreshable: unknown;
}>();

const postsQuery = builder.withTags('refreshable', 'posts').withPath('/posts').withData<PostData[]>();

const deletePostMutation = builder.withUpdates('posts').withMethod('delete').withPath('/posts/:id');

export function MyApp() {
  const [refresh, { isPending: isRefreshing }] = builder.tags.useOperation({ tags: 'refreshable' });
  const posts = postsQuery.useQuery({});
  const deletePost = deletePostMutation.useMutation();

  const onDelete = (id: number) => deletePost.mutateAsync({ params: { id } });

  if (!posts.isSuccess) return <>Loading...</>;

  return (
    <>
      <button onClick={() => refresh()} disabled={isRefreshing}>
        Refresh all posts
      </button>

      {posts.data.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>

          <button onClick={() => onDelete(post.id)} disabled={deletePost.isPending}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
}

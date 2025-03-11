import { HttpQueryBuilder } from 'react-query-builder';

type PostData = { id: number; title: string; body: string; userId: number };

const builder = new HttpQueryBuilder().withBaseUrl('https://jsonplaceholder.typicode.com').withTagTypes<{
  posts: PostData[];
  refreshable: unknown;
}>();

const postsQuery = builder.withTags('refreshable', 'posts').withPath('/posts').withData<PostData[]>();

const deletePostMutation = builder.withUpdates('posts').withMethod('delete').withPath('/posts/:id');

export function MyApp() {
  const [refresh] = builder.tags.useOperation({ tags: 'refreshable' });
  const posts = postsQuery.useQuery({});
  const deletePost = deletePostMutation.useMutation();

  const onDelete = (id: number) => deletePost.mutateAsync({ params: { id } });

  if (!posts.isSuccess) return <>Loading...</>;

  return (
    <>
      <button onClick={() => refresh()}>Refresh all posts</button>

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

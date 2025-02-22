import { useState } from 'react';
import './App.css';
import { HttpQueryBuilder, useOperateOnTags } from 'react-query-builder';

const builderBase = new HttpQueryBuilder({
  vars: {
    baseUrl: 'https://jsonplaceholder.typicode.com',
  },
});

type PostData = { title: string; id: string; body: string };
const postsQuery = builderBase.withPath('/posts').withData<PostData[]>().withConfig({ tags: 'refreshable' }).freeze();
const postQuery = builderBase.withPath('/posts/:id').withData<PostData>().withConfig({ tags: 'refreshable' }).freeze();

function App() {
  const [clickedPost, setClickedPost] = useState<string | null>(null);

  const posts = postsQuery.useQuery({}, { enabled: !clickedPost });
  const post = postQuery.useQuery({ params: { id: clickedPost } }, { enabled: !!clickedPost });

  const [refresh] = useOperateOnTags({ tags: ['refreshable'], operation: 'refetch' });

  if (clickedPost) {
    return (
      <>
        <button onClick={() => refresh()}>Refresh</button>

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
      </>
    );
  }

  return (
    <>
      <button onClick={() => refresh()}>Refresh</button>

      {posts.isLoading
        ? 'Loading...'
        : posts.isError
          ? posts.error.message
          : posts.data?.map((post) => (
              <div key={post.id}>
                <h2 onClick={() => setClickedPost(post.id)}>{post.title}</h2>
                <p>{post.body}</p>
              </div>
            ))}
    </>
  );
}

export default App;

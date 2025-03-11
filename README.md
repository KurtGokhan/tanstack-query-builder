[![npm](https://img.shields.io/npm/v/react-query-builder?style=for-the-badge)](https://www.npmjs.com/package/react-query-builder)
[![NPM](https://img.shields.io/npm/l/react-query-builder?style=for-the-badge)](https://github.com/KurtGokhan/react-query-builder/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/KurtGokhan/react-query-builder/ci.yml?style=for-the-badge)](https://github.com/KurtGokhan/react-query-builder/actions/workflows/ci.yml)

# React Query Builder

The simplest way to start building with Tanstack Query.

This library builds on top of Tanstack Query to provide out-of-the-box functionality to help you get started faster, and keep the application code well-structured.

It uses the builder pattern, the best pattern for working with complex Typescript types.

[Visit the docs →](https://gkurt.com/react-query-builder/)

## Features

- REST client using fetch API
- Automatically created query keys and easy invalidation
- Customizable with middlewares
- Tag based invalidation
- Declarative optimistic updates
- Ability to strongly type everything

## Advantages

- 💪 Strong-typed
- 🚀 Features out-of-the-box
- ⚙️ Customizable and extendable
- 🪶 Zero dependencies
- 🚢 SSR and Router compatible

## Examples

Following code loads a list of Posts from an API, and presents a Delete button to delete each one.
When a Post is deleted, the list query is automatically invalidated and refetched to show the up-to-date data.

```tsx
import { QueryClient } from "@tanstack/react-query";
import { HttpQueryBuilder } from "react-query-builder";

type PostData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const builder = new HttpQueryBuilder()
  .withClient(client)
  .withBaseUrl("https://jsonplaceholder.typicode.com")
  .withTagTypes<{
    posts: PostData[];
    refreshable: unknown;
  }>();

const postsQuery = builder
  .withTags("refreshable", "posts")
  .withPath("/posts")
  .withData<PostData[]>();

const deletePostMutation = builder
  .withUpdates("posts")
  .withMethod("delete")
  .withPath("/posts/:id");

export function MyApp() {
  const [refresh, { isPending: isRefreshing }] = builder.tags.useOperation({
    tags: "refreshable",
  });
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

          <button
            onClick={() => onDelete(post.id)}
            disabled={deletePost.isPending}
          >
            Delete
          </button>
        </div>
      ))}
    </>
  );
}
```

For more examples and documentation, [Visit the docs →](https://gkurt.com/react-query-builder/)

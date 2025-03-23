[![npm](https://img.shields.io/npm/v/tanstack-query-builder?style=for-the-badge)](https://www.npmjs.com/package/tanstack-query-builder)
[![NPM](https://img.shields.io/npm/l/tanstack-query-builder?style=for-the-badge)](https://github.com/KurtGokhan/tanstack-query-builder/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/KurtGokhan/tanstack-query-builder/ci.yml?style=for-the-badge)](https://github.com/KurtGokhan/tanstack-query-builder/actions/workflows/ci.yml)

# Tanstack Query Builder

The simplest way to start building with Tanstack Query.

This library builds on top of Tanstack Query to provide out-of-the-box functionality to help you get started faster, and keep the application code well-structured.

It uses the builder pattern, the best pattern for working with complex Typescript types.

[Visit the docs →](https://gkurt.com/tanstack-query-builder/)

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
import { HttpQueryBuilder } from "tanstack-query-builder/http";

type ArticleData = { id: number; title: string; body: string; userId: number };

const client = new QueryClient();

const builder = new HttpQueryBuilder()
  .withClient(client)
  .withBaseUrl("https://api.example.com")
  .withTagTypes<{
    articles: ArticleData[];
    refreshable: unknown;
  }>();

const articlesQuery = builder
  .withTags("refreshable", "articles")
  .withPath("/articles")
  .withData<ArticleData[]>();

const deleteArticleMutation = builder
  .withUpdates("articles")
  .withMethod("delete")
  .withPath("/articles/:id");

export function MyApp() {
  const [refresh, { isPending: isRefreshing }] = builder.tags.useOperation({
    tags: "refreshable",
  });
  const articles = articlesQuery.useQuery({});
  const deleteArticle = deleteArticleMutation.useMutation();

  const onDelete = (id: number) =>
    deleteArticle.mutateAsync({ params: { id } });

  if (!articles.isSuccess) return <>Loading...</>;

  return (
    <>
      <button onClick={() => refresh()} disabled={isRefreshing}>
        Refresh all articles
      </button>

      {articles.data.map((article) => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.body}</p>

          <button
            onClick={() => onDelete(article.id)}
            disabled={deleteArticle.isPending}
          >
            Delete
          </button>
        </div>
      ))}
    </>
  );
}
```

For more examples and documentation, [Visit the docs →](https://gkurt.com/tanstack-query-builder/)

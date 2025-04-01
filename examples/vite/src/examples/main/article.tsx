import { useNavigate, useParams } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { commentsQuery, editArticleMutation, useArticle } from './example';

export function ArticlePage() {
  const id = Number.parseInt(useParams({ from: '/main/$id' }).id);
  const nav = useNavigate();
  const article = useArticle({ id });
  const comments = commentsQuery.useQuery({ search: { articleId: id } });
  const [showEdit, setShowEdit] = useState(false);
  const editArticle = editArticleMutation.useMutation();

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      {!showEdit ? (
        <>
          {article.isLoading ? (
            <div className="text-center">Loading...</div>
          ) : article.isError ? (
            <div className="text-red-500">{article.error.message}</div>
          ) : (
            <div className="p-4">
              <h2 className="text-2xl font-bold">{article.data?.titleUppercase}</h2>
              <p className="mt-2 whitespace-pre-wrap">{article.data?.body}</p>
              <button onClick={() => nav({ to: '..' })} className="btn btn-secondary mt-4 mr-2">
                Back
              </button>
              <button onClick={() => setShowEdit(true)} disabled={editArticle.isPending} className="btn btn-primary mt-4">
                Edit article
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-4">
          <h2 className="text-2xl font-bold">Edit article</h2>

          <input ref={titleRef} defaultValue={article.data?.title} className="block w-full mt-2 p-2 border rounded" />

          <textarea ref={bodyRef} defaultValue={article.data?.body} className="block w-full mt-2 p-2 border rounded" />

          <button
            onClick={() => {
              editArticle.mutateAsync({
                params: { id },
                body: {
                  id,
                  title: titleRef.current!.value,
                  body: bodyRef.current!.value,
                },
              });

              setShowEdit(false);
            }}
            disabled={editArticle.isPending}
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

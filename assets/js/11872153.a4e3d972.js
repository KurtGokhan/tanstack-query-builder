"use strict";(self.webpackChunktanstack_query_builder_website=self.webpackChunktanstack_query_builder_website||[]).push([[541],{1210:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>l,contentTitle:()=>d,default:()=>h,frontMatter:()=>r,metadata:()=>n,toc:()=>c});const n=JSON.parse('{"id":"tags","title":"Tag Based Invalidation","description":"What are tags","source":"@site/docs/tags.mdx","sourceDirName":".","slug":"/tags","permalink":"/tanstack-query-builder/tags","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":50,"frontMatter":{"title":"Tag Based Invalidation","sidebar_position":50},"sidebar":"tutorialSidebar","previous":{"title":"Introduction","permalink":"/tanstack-query-builder/"},"next":{"title":"Builder API","permalink":"/tanstack-query-builder/api/builder"}}');var a=i(2540),s=i(3023);const r={title:"Tag Based Invalidation",sidebar_position:50},d=void 0,l={},c=[{value:"What are tags",id:"what-are-tags",level:2},{value:"How to use tags",id:"how-to-use-tags",level:2},{value:"Syncing between browser tabs",id:"syncing-between-browser-tabs",level:2},{value:"Optimistic updates",id:"optimistic-updates",level:2},{value:"Predefined updater functions (Experimental)",id:"predefined-updater-functions-experimental",level:3}];function o(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components},{Details:i}=t;return i||function(e,t){throw new Error("Expected "+(t?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h2,{id:"what-are-tags",children:"What are tags"}),"\n",(0,a.jsx)(t.p,{children:"Tanstack Query encourages invalidating queries with query keys.\nBut in our opinion query keys are hard to manage, as they are highly variable and not type safe."}),"\n",(0,a.jsx)(t.p,{children:"For this reason, we introduce a concept of tags.\nTags are a way to mark queries with a specific label. You can easily manipulate the query cache by using these tags."}),"\n",(0,a.jsxs)(t.p,{children:["This feature is heavily inspired by the same feature in\n",(0,a.jsx)(t.a,{href:"https://redux-toolkit.js.org/rtk-query/usage/automated-refetching#definitions",children:"RTK Query"}),"\nand works similarly."]}),"\n",(0,a.jsx)(t.h2,{id:"how-to-use-tags",children:"How to use tags"}),"\n",(0,a.jsx)(t.p,{children:"You can start by strongly typing the data type that corresponds to each tag:"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:"const builder = new HttpQueryBuilder().withTagTypes<{\n  article: ArticleData;\n  articles: ArticleData[];\n  refreshable: unknown;\n}>();\n"})}),"\n",(0,a.jsxs)(t.p,{children:["We recommend using single data type for each tag. But in case a tag can be used for multiple data types, you can use a union type or ",(0,a.jsx)(t.code,{children:"unknown"})," type like the ",(0,a.jsx)(t.code,{children:"refreshable"})," tag in the example above."]}),"\n",(0,a.jsx)(t.p,{children:"Then you can use the tags in your queries:"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'const listArticlesQuery = builder\n  .withPath("/articles")\n  // highlight-next-line\n  .withTag("articles", "refreshable");\n'})}),"\n",(0,a.jsxs)(t.p,{children:["The parameter passed to ",(0,a.jsx)(t.code,{children:"withTag"})," can be a function that returns tags. This function will be called with the query data and variables."]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'const singleArticleQuery = builder\n  .withPath("/articles/:id")\n  // highlight-next-line\n  .withTag(({ vars }) => ({ type: "article", id: vars.params.id }));\n'})}),"\n",(0,a.jsx)(t.p,{children:"Then, you can invalidate the queries in the mutations:"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'const deleteArticleMutation = builder\n  .withPath("/articles/:id")\n  .withMethod("delete")\n  // Invalidate the list of articles:\n  // highlight-next-line\n  .withUpdates({ type: "articles" })\n  // Invalidate the single article with given id:\n  // highlight-next-line\n  .withUpdates(({ vars }) => ({ type: "article", id: vars.params.id }));\n'})}),"\n",(0,a.jsx)(t.h2,{id:"syncing-between-browser-tabs",children:"Syncing between browser tabs"}),"\n",(0,a.jsxs)(t.p,{children:["When invalidating queries with tags, same tags are also invalidated in other browser tabs.\nThis is enabled by default after calling ",(0,a.jsx)(t.a,{href:"./api/builder#withclient",children:(0,a.jsx)(t.code,{children:"withClient"})}),".\nYou can disable this behavior by passing the option to the ",(0,a.jsx)(t.code,{children:"withClient"})," method."]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:"const builder = new HttpQueryBuilder().withClient(queryClient, {\n  // highlight-next-line\n  syncTagsWithOtherTabs: false,\n});\n"})}),"\n",(0,a.jsx)(t.h2,{id:"optimistic-updates",children:"Optimistic updates"}),"\n",(0,a.jsxs)(t.p,{children:["You can also use the tags for updating the query cache.\nThe ",(0,a.jsx)(t.code,{children:"withUpdates"})," method accepts an ",(0,a.jsx)(t.code,{children:"updater"})," function for this purpose."]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'const deleteArticleMutation = builder\n  .withPath("/articles/:id")\n  .withMethod("delete")\n  .withUpdates({\n    type: "articles",\n    optimistic: true,\n    // Remove the article with given id from the cache:\n    // highlight-next-line\n    updater: ({ vars }, cache) => cache.filter((x) => x.id !== vars.params.id),\n  });\n'})}),"\n",(0,a.jsxs)(t.p,{children:["When ",(0,a.jsx)(t.code,{children:"optimistic"})," is set to ",(0,a.jsx)(t.code,{children:"true"}),", the update is done optimistically.\nOptimistic updates are applied immediately, before the mutation is completed.\nThis is useful for providing a better user experience, as the UI can be updated immediately\nwithout waiting for the server response as opposed to the default behavior\nwhere the UI is updated only after the server response is received.\nIf an error occurs during the mutation, the optimistic update is rolled back automatically."]}),"\n",(0,a.jsx)(t.h3,{id:"predefined-updater-functions-experimental",children:"Predefined updater functions (Experimental)"}),"\n",(0,a.jsx)(t.admonition,{type:"warning",children:(0,a.jsx)(t.p,{children:"This feature is experimental and may change in the future."})}),"\n",(0,a.jsx)(t.p,{children:"You can use predefined updater functions for common operations."}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:'const deleteArticleMutation = builder\n  .withPath("/articles/:id")\n  .withMethod("delete")\n  .withUpdates({\n    type: "articles",\n    // highlight-next-line\n    updater: "delete-with-params-by-id",\n  });\n'})}),"\n",(0,a.jsxs)(i,{children:[(0,a.jsx)("summary",{children:(0,a.jsx)(t.p,{children:"Explanation"})}),(0,a.jsxs)(t.p,{children:["The predefined functions are referred as a string. This string has a format of ",(0,a.jsx)(t.code,{children:"<operation>-with-<context>-by-<field>"})," which can be broken down as follows:"]}),(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"<operation>"}),": The operation to be performed. This can be one of ",(0,a.jsx)(t.code,{children:"clear, merge, replace, create, update, upsert, delete, switch"}),"."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"<context>"}),": The body of the update that will be used in the operation. This can be one of ",(0,a.jsx)(t.code,{children:"data, vars, body, params, search, meta"})]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"<field>"}),": The field to be used in the context to match with the data in the cache. This is usually a unique identifier. This can be any field in the context."]}),"\n"]}),(0,a.jsx)(t.p,{children:"Some examples:"}),(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"delete-with-params-by-id"}),": remove the item from a list, where ",(0,a.jsx)(t.code,{children:"params.id"})," matches the ",(0,a.jsx)(t.code,{children:"id"})," field of the item."]}),"\n",(0,a.jsxs)(t.li,{children:[(0,a.jsx)(t.code,{children:"merge-with-body-by-id"}),": merge the ",(0,a.jsx)(t.code,{children:"body"})," to the item in a list, where ",(0,a.jsx)(t.code,{children:"body.id"})," matches the ",(0,a.jsx)(t.code,{children:"id"})," field of the item."]}),"\n"]})]})]})}function h(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(o,{...e})}):o(e)}},3023:(e,t,i)=>{i.d(t,{R:()=>r,x:()=>d});var n=i(3696);const a={},s=n.createContext(a);function r(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);
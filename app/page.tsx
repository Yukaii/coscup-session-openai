"use client";

import { createElement, Fragment, useEffect, useState } from "react";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import { useCompletion } from "ai/react";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/theme-toggle";
import clsx from "clsx";

const useMarkdown = (markdown: string) => {
  const [Content, setContent] = useState(Fragment as any);

  useEffect(() => {
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(remarkGfm)
      .use(rehypeReact, { createElement, Fragment })
      .process(markdown)
      .then((file) => {
        setContent(() => () => file.result);
      });
  }, [markdown]);

  return Content;
};

export default function App() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    complete,
  } = useCompletion({
    api: "/api/search",
  });

  const Content = useMarkdown(completion);

  return (
    <div className="flex flex-col gap-6 justify-center items-center h-full">
      <span className="fixed top-1 right-1">
        <ModeToggle />
      </span>

      <form
        onSubmit={handleSubmit}
        className={clsx("flex gap-6", {
          "items-center": !completion,
          "pt-5 flex-col justify-around gap-6": completion,
        })}
      >
        <label>
          <Input
            className="py-6 px-4 max-w-full text-2xl w-[300px]"
            placeholder="請輸入關鍵字"
            value={input}
            onChange={handleInputChange}
          />

          <small className="text-muted-foreground">
            來問問關於今年 COSCUP 議程的一些事吧！
          </small>
        </label>
      </form>

      {completion && <div className="px-4 w-full max-w-[800px] markdown-body">
        <Content />
      </div>
      }
    </div >
  );
}

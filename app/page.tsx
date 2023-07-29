"use client";

import { createElement, Fragment, useEffect, useState } from "react";
import { unified } from "unified";
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

const randomPlaceLengthClasses = [
  'w-[300px] h-[20px]',
  'w-[250px] h-[20px]',
  'w-[200px] h-[20px]',
  'w-[150px] h-[20px]',
  'w-[100px] h-[20px]',
]

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

      {/* placeholder */}
      {isLoading && !completion && (
        <div className="flex flex-col gap-2 justify-center animate-pulse">
          {/* randomize text placeholder */}
          {
            new Array(Math.floor(Math.random() * 3) + 5).fill(0).map((i, index) => {
              const randomLengthClass = randomPlaceLengthClasses[Math.floor(Math.random() * randomPlaceLengthClasses.length)]

              return (
                <div className={`bg-gray-300 rounded-lg ${randomLengthClass}`} key={`placeholder-${index}`} />
              )
            })
          }
        </div>
      )}

      {completion && (
        <div className="overflow-auto px-4 w-full max-w-[800px] markdown-body max-h-[600px]">
          <Content />
        </div>
      )}
    </div>
  );
}

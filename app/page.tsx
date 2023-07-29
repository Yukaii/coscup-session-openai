/* eslint-disable tailwindcss/no-custom-classname */
"use client";

import { useCompletion } from "ai/react";
import clsx from "clsx";
import Link from "next/link";
import { createElement, Fragment, useEffect, useRef, useState } from "react";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, Plugin } from "unified";
import { visit } from "unist-util-visit";

import { ModeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

const rehypeChangeHrefToTargetBlank: Plugin = () => {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "a") return;
      node.properties.target = "_blank";
      node.properties.rel = "noopener noreferrer";
    });
  };
};

const useMarkdown = (markdown: string) => {
  const [Content, setContent] = useState(Fragment as any);

  useEffect(() => {
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeChangeHrefToTargetBlank)
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
  "w-[300px] h-[20px]",
  "w-[250px] h-[20px]",
  "w-[200px] h-[20px]",
  "w-[150px] h-[20px]",
  "w-[100px] h-[20px]",
];

const presetPrompts = ["AI 的議程", "Python 的議程", "Rust 的議程", "Go 的議程", "區塊鏈相關", "關於資安的議程"];

const randomPresets = presetPrompts.sort(() => Math.random() - 0.5).slice(0, 3);

export default function App() {
  const { completion, input, handleInputChange, handleSubmit, isLoading, setInput, setCompletion, complete } =
    useCompletion({
      api: "/api/search",
    });

  const formRef = useRef<HTMLFormElement>(null);

  const Content = useMarkdown(completion);

  const onPresetClick = (prompt: string) => {
    setInput(prompt);

    complete(prompt);
  };

  const clear = () => {
    setCompletion("");
    setInput("");
  };

  return (
    <div className="container flex h-full flex-col gap-6 px-4 py-12 pt-[120px]">
      <span className="fixed right-4 top-4">
        <ModeToggle />
      </span>

      <h1 className="text-center text-2xl font-bold dark:text-white md:text-4xl">COSCUP 2023 x OpenAI 議程搜尋系統</h1>

      <form
        onSubmit={handleSubmit}
        ref={formRef}
        className={clsx("flex flex-col gap-6", {
          "justify-center": !completion,
          "pt-5 justify-around gap-6": completion,
        })}
      >
        <label className="flex flex-col items-center gap-1">
          <div className="mb-4 text-center">
            <Input
              className="w-[300px] max-w-full px-4 py-6 text-2xl md:w-[600px]"
              placeholder="請輸入關鍵字"
              value={input}
              onChange={handleInputChange}
            />

            {(input || completion) && (
              <div className="mt-2 text-center text-muted-foreground dark:text-gray-300">
                <Link className="text-sm underline md:text-base" onClick={clear} href="#">
                  清除搜尋結果
                </Link>
              </div>
            )}
          </div>

          <div className="text-lg text-muted-foreground dark:text-gray-300">
            來問問關於今年 COSCUP 議程的一些事吧！
            {!completion && !input && (
              <>
                <br />
                或是，試試以下幾種：
                <ul className="list-inside list-disc">
                  {randomPresets.map((prompt) => (
                    <li className="cursor-pointer underline" key={prompt} onClick={() => onPresetClick(prompt)}>
                      {prompt}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </label>
      </form>

      {/* placeholder */}
      {isLoading && !completion && (
        <div className="mx-auto flex w-full max-w-[500px] animate-pulse flex-col justify-center gap-2">
          {/* randomize text placeholder */}
          {new Array(Math.floor(Math.random() * 3) + 5).fill(0).map((i, index) => {
            const randomLengthClass =
              randomPlaceLengthClasses[Math.floor(Math.random() * randomPlaceLengthClasses.length)];

            return <div className={`rounded-lg bg-gray-300 ${randomLengthClass}`} key={`placeholder-${index}`} />;
          })}
        </div>
      )}

      {completion && (
        <div className="markdown-body max-h-[500px] w-full max-w-[800px] overflow-auto px-4 dark:text-white">
          <Content />
        </div>
      )}

      {/* floating footer to the bottom */}
      <div className="fixed bottom-4 flex w-full flex-col items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground dark:text-gray-300">
            <Link href="https://coscup.org/2023/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              COSCUP 2023
            </Link>{" "}
            |{" "}
            <Link
              href="https://github.com/Yukaii/coscup-session-openai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub
            </Link>{" "}
            |{" "}
            <Link href="https://yukai.dev" target="_blank" rel="noopener noreferrer" className="hover:underline">
              {`Hi, I'm Yukai`}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

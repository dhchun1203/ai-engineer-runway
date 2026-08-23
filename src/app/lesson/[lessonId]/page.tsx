import { notFound } from "next/navigation";
import { lessons } from "#site/content";
import { MDXContent } from "@/components/mdx-content";

function getLessonBySlug(slug: string) {
  return lessons.find((lesson) => lesson.slug === slug);
}

export function generateStaticParams() {
  return lessons.map((lesson) => ({ lessonId: lesson.slug }));
}

export default async function LessonPage(
  props: PageProps<"/lesson/[lessonId]">,
) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-[28px] font-semibold leading-[1.2]">
        {lesson.title}
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <MDXContent code={lesson.code} />
      </div>
    </article>
  );
}

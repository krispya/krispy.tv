import about from '@content/about.json';

export function About() {
  return (
    <article className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16 sm:py-20">
      <p className="text-primary-700 mb-3 text-xs font-bold tracking-[0.12em] uppercase">
        {about.eyebrow}
      </p>
      <h1 className="mb-6 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
        {about.title}
      </h1>
      <p className="max-w-2xl text-xl leading-8 text-gray-700">{about.intro}</p>
      <div className="mt-8 space-y-5 text-lg leading-8 text-gray-600">
        {about.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

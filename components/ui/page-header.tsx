import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 sm:w-auto"
        >
          {actionLabel}
        </Link>
      ) : null}
    </header>
  );
}

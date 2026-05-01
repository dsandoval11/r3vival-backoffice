import type { ReactNode } from "react";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  htmlFor,
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

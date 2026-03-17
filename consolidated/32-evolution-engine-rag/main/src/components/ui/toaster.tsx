"use client"

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

interface ToastItemProps {
  id: string;
  title?: string;
  description?: string;
  action?: JSX.Element;
  props: Record<string, unknown>;
}

const ToastItem = ({ id, title, description, action, props }: ToastItemProps) => (
  <Toast key={id} {...props}>
    <div className="grid gap-1">
      {title && <ToastTitle>{title}</ToastTitle>}
      {description && (
        <ToastDescription>{description}</ToastDescription>
      )}
    </div>
    {action}
    <ToastClose />
  </Toast>
);

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          props={toast}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
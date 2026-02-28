import * as React from "react"

import { formatDate } from "@/utils/date"
import { t } from "i18next"
import { toast as sonnerToast, useSonner } from "sonner"

export function useToastManager(maxToast: number)
{
  const { toasts } = useSonner();

  React.useEffect(() => {
    if (toasts.length > maxToast) {
      const excess = toasts.slice(maxToast);

      for (const t of excess) {
        sonnerToast.dismiss(t.id);
      }
    }
  }, [toasts]);
}

interface ToastOptions
{
  itemID?: number | string
  title?: (() => React.ReactNode) | React.ReactNode
  description?: (() => React.ReactNode) | React.ReactNode
  hideClose?: boolean
  duration?: number
}

interface ToastOptionsAction
{
  label: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface CustomToastOptions extends Omit<ToastOptions, "title"> {}

interface ErrorToastOptions extends Omit<ToastOptions, "title">
{
  title?: ToastOptions["title"];
  action?: ToastOptionsAction | React.ReactNode;
  cancel?: ToastOptionsAction | React.ReactNode;
}

interface ToastReturn
{
  id: number | string;
}

function customToast(jsx: (id: number | string) => React.ReactElement, { itemID, hideClose, ...props }: CustomToastOptions): ToastReturn
{
  return {
    id: sonnerToast.custom(jsx, {
      id: itemID,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function loadingToast({ itemID, title, hideClose, ...props }: ToastOptions): ToastReturn {
  return {
    id: sonnerToast.loading(title ?? t("common:toast.loading"), {
      id: itemID,
      description: formatDate('now', { fullFormat: true }),
      duration: 60000,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function successToast({ itemID, title, hideClose, ...props }: ToastOptions): ToastReturn {
  return {
    id: sonnerToast.success(title ?? t("common:toast.success"), {
      id: itemID,
      description: formatDate('now', { fullFormat: true }),
      duration: 3000,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function warningToast({ itemID, title, hideClose, ...props }: ToastOptions): ToastReturn {
  return {
    id: sonnerToast.warning(title ?? t("common:toast.warning"), {
      id: itemID,
      description: formatDate('now', { fullFormat: true }),
      duration: 5000,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function errorToast(options: ErrorToastOptions): ToastReturn;
function errorToast(error: unknown, options?: ErrorToastOptions): ToastReturn;
function errorToast(
  errorOrOptions: unknown,
  maybeOptions?: ErrorToastOptions
): ToastReturn {
  let options: ErrorToastOptions;

  if (!maybeOptions && typeof errorOrOptions === "object" && errorOrOptions && !("message" in errorOrOptions) && !("stack" in errorOrOptions)) {
    options = errorOrOptions as ErrorToastOptions;
  } else {
    const error = errorOrOptions;
    const passedOptions = maybeOptions ?? {};

    options = {
      ...passedOptions,
      description:
        error instanceof Error
          // Error instance are expected to have a message, 
          // If error.message is empty string or not provided, fallback to passed description or unknown error
          ? error.message || (passedOptions.description ?? `Unknown Error (${formatDate('now', { fullFormat: true })})`)
          // for Errors that are not instances of Error, description must be provided via options. 
          // If error.message is not provided, fallback to unknown error
          : passedOptions.description ?? `Unknown Error (${formatDate('now', { fullFormat: true })})`,
    };
  }

  const { itemID, title, description, hideClose, ...props } = options;

  return {
    id: sonnerToast.error(title ?? t("common:toast.error"), {
      id: itemID,
      description: description ?? `${formatDate('now', { fullFormat: true })}`,
      duration: 10000,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function useToast()
{
  const toast = React.useMemo(() => ({
    loading: loadingToast,
    success: successToast,
    warning: warningToast,
    error: errorToast,
    custom: customToast,
  }), []);

  const dismiss = React.useMemo(() => sonnerToast.dismiss, []);

  return { toast, dismiss };
}

export { 
  useToast, 
  loadingToast,
  successToast,
  customToast, 
  errorToast 
}

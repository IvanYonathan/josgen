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

function customToast(jsx: (id: number | string) => React.ReactElement, { itemID, hideClose, ...props }: CustomToastOptions)
{
  return {
    id: sonnerToast.custom(jsx, {
      id: itemID,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function loadingToast({ itemID, title, hideClose, ...props }: ToastOptions) {
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

function successToast({ itemID, title, hideClose, ...props }: ToastOptions) {
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

function warningToast({ itemID, title, hideClose, ...props }: ToastOptions) {
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

function errorToast({ itemID, title, hideClose, ...props }: ErrorToastOptions) {
  return {
    id: sonnerToast.error(title ?? t("common:toast.error"), {
      id: itemID,
      description: formatDate('now', { fullFormat: true }),
      duration: 10000,
      closeButton: !hideClose,
      ...props,
    })
  }
}

function useToast()
{
  return {
    toast: {
      loading: loadingToast,
      success: successToast,
      warning: warningToast,
      error: errorToast,
      custom: customToast,
    },
    dismiss: sonnerToast.dismiss
  }
}

export { 
  useToast, 
  loadingToast,
  successToast,
  customToast, 
  errorToast 
}

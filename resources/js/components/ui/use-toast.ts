import { useEffect, useState } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "destructive"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & Pick<ToasterToast, "id">
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        }
      }
      return {
        ...state,
        toasts: [],
      }
    }
    case "REMOVE_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        }
      }
      return {
        ...state,
        toasts: [],
      }
    }
  }
}

export function useToast() {
  const [state, setState] = useState<State>({ toasts: [] })

  useEffect(() => {
    state.toasts.forEach((toast) => {
      if (!toast.id || toastTimeouts.has(toast.id)) return

      const timeout = setTimeout(() => {
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toast.id),
        }))
        toastTimeouts.delete(toast.id)
      }, TOAST_REMOVE_DELAY)

      toastTimeouts.set(toast.id, timeout)
    })
  }, [state.toasts])

  function toast({
    title,
    description,
    action,
    variant,
  }: Omit<ToasterToast, "id">) {
    const id = genId()

    setState((state) => ({
      ...state,
      toasts: [
        {
          id,
          title,
          description,
          action,
          variant,
        },
        ...state.toasts,
      ].slice(0, TOAST_LIMIT),
    }))

    return id
  }

  function dismiss(toastId?: string) {
    setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== toastId),
    }))
  }

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}
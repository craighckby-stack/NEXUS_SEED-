// src/hooks/use-toast.ts
"use client"

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// Constants
const MAX_TOASTS = 1
const TOAST_REMOVE_DELAY = 1000000

// Types
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

enum ActionType {
  ADD_TOAST,
  UPDATE_TOAST,
  DISMISS_TOAST,
  REMOVE_TOAST,
}

type Action =
  | {
      type: ActionType.ADD_TOAST
      toast: ToasterToast
    }
  | {
      type: ActionType.UPDATE_TOAST
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType.DISMISS_TOAST
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType.REMOVE_TOAST
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

// Toast ID generator
let idCounter = 0
const generateId = () => {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER
  return idCounter.toString()
}

// Toast timeouts
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Add toast to remove queue
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: ActionType.REMOVE_TOAST, toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// Reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, MAX_TOASTS),
      }

    case ActionType.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case ActionType.DISMISS_TOAST:
      if (action.toastId) {
        addToRemoveQueue(action.toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }

    case ActionType.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
      return state
  }
}

// State management
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

const dispatch = (action: Action) => {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Toast function
type Toast = Omit<ToasterToast, "id">

const toast = ({ ...props }: Toast) => {
  const id = generateId()

  const update = (props: ToasterToast) =>
    dispatch({ type: ActionType.UPDATE_TOAST, toast: { ...props, id } })
  const dismiss = () => dispatch({ type: ActionType.DISMISS_TOAST, toastId: id })

  dispatch({
    type: ActionType.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

// useToast hook
const useToast = () => {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: ActionType.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }
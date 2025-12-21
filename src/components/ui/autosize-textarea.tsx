"use client"

import * as React from "react"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"

const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    React.useLayoutEffect(() => {
      const textarea = combinedRef.current
      if (textarea) {
        // Reset height to shrink if text is deleted
        textarea.style.height = "0px"
        // Set height to scrollHeight to fit content
        const scrollHeight = textarea.scrollHeight
        textarea.style.height = `${scrollHeight}px`
      }
    }, [props.value, combinedRef])

    return <Textarea {...props} ref={combinedRef} />
  }
)
AutosizeTextarea.displayName = "AutosizeTextarea"

export { AutosizeTextarea }

    

"use client"

import * as React from "react"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"

interface AutosizeTextareaProps extends TextareaProps {
    minRows?: number;
}

const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
  ({ minRows, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const [minHeight, setMinHeight] = React.useState('0px');

    React.useLayoutEffect(() => {
        const textarea = combinedRef.current;
        if (textarea && minRows) {
            // Calculate min-height based on minRows
            const style = window.getComputedStyle(textarea);
            const paddingTop = parseFloat(style.paddingTop);
            const paddingBottom = parseFloat(style.paddingBottom);
            const borderTop = parseFloat(style.borderTopWidth);
            const borderBottom = parseFloat(style.borderBottomWidth);
            const lineHeight = parseFloat(style.lineHeight);
            const calculatedMinHeight = (lineHeight * minRows) + paddingTop + paddingBottom + borderTop + borderBottom;
            setMinHeight(`${calculatedMinHeight}px`);
        }
    }, [minRows, combinedRef]);


    React.useLayoutEffect(() => {
      const textarea = combinedRef.current
      if (textarea) {
        // Reset height to shrink if text is deleted
        textarea.style.height = minHeight;
        // Set height to scrollHeight to fit content
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.max(parseFloat(minHeight), scrollHeight)}px`;
      }
    }, [props.value, combinedRef, minHeight]);

    // minRows is destructured out and not passed to the underlying Textarea
    return <Textarea {...props} ref={combinedRef} style={{minHeight}} />
  }
)
AutosizeTextarea.displayName = "AutosizeTextarea"

export { AutosizeTextarea }


"use client"

import * as React from "react"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"

interface AutosizeTextareaProps extends TextareaProps {
    minRows?: number;
}

const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
  ({ minRows = 1, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = React.useCallback(() => {
        const textarea = combinedRef.current;
        if (textarea) {
            // Temporarily reset height to calculate the "natural" scrollHeight
            textarea.style.height = "auto";
            
            // Calculate the minimum height based on minRows
            const style = window.getComputedStyle(textarea);
            const paddingTop = parseFloat(style.paddingTop);
            const paddingBottom = parseFloat(style.paddingBottom);
            // Use line-height from style, or estimate based on font-size if 'normal'
            let lineHeight = parseFloat(style.lineHeight);
            if (isNaN(lineHeight)) {
                lineHeight = parseFloat(style.fontSize) * 1.5; // A reasonable estimate for 'normal'
            }
            const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom;

            // Set the height to the max of minHeight or the content's scrollHeight
            textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
        }
    }, [minRows, combinedRef]);

    React.useLayoutEffect(() => {
        adjustHeight();
    }, [props.value, adjustHeight]);

    return <Textarea {...props} ref={combinedRef} rows={minRows} />;
  }
)
AutosizeTextarea.displayName = "AutosizeTextarea"

export { AutosizeTextarea }

import React from "react"
import "./index.scss"

interface FormItemProps {
    label?: string
    children: React.ReactNode
}

export function FormItem({ label, children }: FormItemProps) {
    return (
        <div className="form-item">
            {label && <label>{label}</label>}
            {children}
        </div>
    )
}
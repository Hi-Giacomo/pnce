import React from "react"
import "./index.scss"

interface FormCardProps {
    children: React.ReactNode
    className?: string
}

export function FormCard({ children, className = "" }: FormCardProps) {
    return (
        <div className={`form-card ${className}`}>
            {children}
        </div>
    )
}
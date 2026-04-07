import React from "react"
import "./index.scss"

interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    loading?: boolean
    variant?: "primary" | "default"
    className?: string
}

export function Button({ 
    children, 
    onClick, 
    disabled, 
    loading,
    variant = "primary",
    className = ""
}: ButtonProps) {
    return (
        <button 
            className={`btn btn-${variant} ${loading ? "loading" : ""} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? "加载中..." : children}
        </button>
    )
}
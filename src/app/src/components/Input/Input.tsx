import React from "react"
import "./index.scss"

interface InputProps {
    type?: "text" | "password"
    placeholder?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    className?: string
}

export function Input({ 
    type = "text",
    placeholder,
    value,
    onChange,
    onKeyDown,
    className = ""
}: InputProps) {
    return (
        <input 
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className={`input ${className}`}
        />
    )
}
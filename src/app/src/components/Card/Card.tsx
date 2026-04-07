import React from "react"
import "./index.scss"

interface CardProps {
    title?: string
    children: React.ReactNode
    extra?: React.ReactNode
    className?: string
}

export function Card({ title, children, extra, className = "" }: CardProps) {
    return (
        <div className={`card ${className}`}>
            {(title || extra) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {extra && <div className="card-extra">{extra}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    )
}
import React from "react"
import "./index.scss"

interface MobileHeaderProps {
    title?: string
}

export function MobileHeader({ title = "分布式服务管理平台" }: MobileHeaderProps) {
    return (
        <div className="mobile-header">
            <div className="mobile-logo">
                <span>PNCE</span>
            </div>
            <h2>{title}</h2>
        </div>
    )
}
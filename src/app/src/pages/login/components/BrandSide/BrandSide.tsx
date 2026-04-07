import React from "react"
import "./index.scss"

export function BrandSide() {
    return (
        <div className="brand-side">
            <div className="brand-content">
                <div className="brand-logo">
                    <span>PNCE</span>
                </div>
                <h1>分布式服务管理平台</h1>
                <p className="brand-en">Distributed Service Management</p>
                <div className="brand-features">
                    <div className="feature">
                        <span className="feature-dot"></span>
                        <span>服务注册与发现</span>
                    </div>
                    <div className="feature">
                        <span className="feature-dot"></span>
                        <span>API 统一管理</span>
                    </div>
                    <div className="feature">
                        <span className="feature-dot"></span>
                        <span>负载均衡</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
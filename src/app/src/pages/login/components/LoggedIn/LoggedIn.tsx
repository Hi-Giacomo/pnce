import { root } from "../../../../hooks"
import { Button } from "../../../../components/Button"
import "./index.scss"

export function LoggedIn() {
    const handleLogout = () => {
        root.user.logout()
    }
    
    return (
        <div className="user-info">
            <div className="user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <h3>{root.user.name}</h3>
            <p>登录成功</p>
            <Button variant="default" onClick={handleLogout}>退出登录</Button>
        </div>
    )
}
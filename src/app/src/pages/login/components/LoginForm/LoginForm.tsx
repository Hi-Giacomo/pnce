import { root, notify } from "../../../../hooks"
import type { UserRole, UserPermission } from '../../../../hooks/user.store'
import { Button } from "../../../../components/Button"
import { Input } from "../../../../components/Input"
import { FormItem } from "../../../../components/FormItem"
import { useState } from "react"
import { useNavigate } from "react-router"
import { mockApi } from "../../../../services/mock/mock-api"
import "./index.scss"

interface LoginFormProps {
    onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    
    const handleLogin = async () => {
        if (!username || !password) return
        
        setIsLoading(true)
        setError("")
        
        try {
            // 使用 Mock API 登录
            const result = await mockApi.auth.login({ username, password })
            
            if (result.code === 200) {
                // 登录成功，更新用户状态
                const { user } = result.data;
                root.user.roles = user.roles as UserRole[];
                root.user.permissions = user.permissions as UserPermission[];
                root.user.isLoggedIn = true;
                root.user.username = username;
                
                notify() // 触发状态更新
                
                // 跳转到仪表板
                navigate('/manager/dashboard')
                onSuccess?.()
            } else {
                // 登录失败
                setError(result.message)
            }
        } catch {
            setError('登录失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleLogin()
        }
    }
    
    return (
        <div className="login-form">
            <div className="form-header">
                <h2>账号登录</h2>
                <p>请输入您的账号信息</p>
            </div>
            
            <div className="form-body">
                {error && (
                    <div style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}
                
                <FormItem label="用户名">
                    <Input 
                        placeholder="请输入用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </FormItem>
                
                <FormItem label="密码">
                    <Input 
                        type="password"
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </FormItem>
                
                <Button 
                    loading={isLoading}
                    disabled={!username || !password}
                    onClick={handleLogin}
                >
                    登 录
                </Button>
            </div>
            
            <div className="form-footer">
                <span>测试账号: admin / developer / viewer（密码: 123456）</span>
            </div>
        </div>
    )
}
import { root } from "../../hooks"
import "./index.scss"
import { BrandSide, LoginForm, LoggedIn, FormCard, MobileHeader } from "./components"

export default function Login() {
    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>
            
            <div className="login-container">
                <BrandSide />
                
                <div className="form-side">
                    <FormCard>
                        <MobileHeader />
                        {root.user.isLoggedIn ? <LoggedIn /> : <LoginForm />}
                    </FormCard>
                </div>
            </div>
        </div>
    )
}
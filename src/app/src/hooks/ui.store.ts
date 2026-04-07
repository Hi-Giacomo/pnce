import { root } from "./index";
import { proxy } from "./utils/proxy";


export const createUIStore = () => {
    const store = {
        name: "ui",
        time: Date.now(),
        setName() {
            store.name = Date.now().toString();
        },
        callUser() {
            const user = root.user;
            user.name = "called from ui";
        }
    };

    return proxy(store) as typeof store;
};

export type UIStore = ReturnType<typeof createUIStore>;
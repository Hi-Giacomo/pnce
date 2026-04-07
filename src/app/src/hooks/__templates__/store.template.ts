import { root } from "../index";
import { proxy } from "../utils/proxy";


export const createTemplateStore = () => {
    const store = {
        name: "template",
        setName() {
            store.name = Date.now().toString();
        },
        callUser: () => {
            root.ui.callUser();
        }
    };


    return proxy(store) as typeof store;
};

export type TemplateStore = ReturnType<typeof createTemplateStore>;
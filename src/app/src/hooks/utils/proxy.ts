import { notify } from "..";

export const proxy = (store: unknown) => new Proxy(store as Record<string, unknown>, {
    set(target, prop, value) {
        target[prop as string] = value;
        notify();
        return true;
    },
    get(target, prop) {
        const value = target[prop as string];
        if (typeof value === "function") {
            return (...args: unknown[]) => {
                const result = (value as (...args: unknown[]) => unknown).apply(store, args);
                notify();
                return result;
            };
        }
        return value;
    }
});
import { create } from "zustand";
import { createUIStore } from "./ui.store";
import { createUserStore } from "./user.store";

const getStore = () => ({
    ui: createUIStore(),
    user: createUserStore()
})

let tempSetStore: (store: ReturnType<typeof getStore>) => void;
export const useStore = create((set) => {
    tempSetStore = set;
    return getStore();
});
export const root = getStore();
export const notify = () => {
    tempSetStore(getStore());
};
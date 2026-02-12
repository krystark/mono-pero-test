export { setEnv, getEnv } from "./other/env";
export { setStore, getStore, type RootStoreLike } from "./other/storeBridge";

export { waitForKernelIdle, markRegistryMutation } from "./other/registryIdle";
export function attachCommonEventHandlers() {

}

export type { User, IUserStore, IRootStore } from "./contracts";
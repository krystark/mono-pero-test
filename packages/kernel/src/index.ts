export { setEnv, getEnv } from "./other/env";
export { setStore, getStore, type RootStoreLike } from "./other/storeBridge";

export { bus } from "./bus/eventBus";

export { waitForKernelIdle, markRegistryMutation } from "./other/registryIdle";

export function attachCommonEventHandlers() {

}

export { User } from "./contracts";
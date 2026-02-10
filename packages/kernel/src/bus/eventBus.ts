type Handler<T = unknown> = (payload: T) => void;

class EventBus {
    private handlers = new Map<string, Set<Handler>>();

    publish<T = unknown>(type: string, payload: T) {
        this.handlers.get(type)?.forEach((h) => h(payload));
    }

    subscribe<T = unknown>(type: string, handler: Handler<T>) {
        const set = this.handlers.get(type) ?? new Set<Handler>();
        set.add(handler as Handler);
        this.handlers.set(type, set);

        return () => {
            set.delete(handler as Handler);
            if (set.size === 0) this.handlers.delete(type);
        };
    }

    emit<T = unknown>(type: string, payload: T) {
        this.publish(type, payload);
    }
    on<T = unknown>(type: string, handler: Handler<T>) {
        return this.subscribe(type, handler);
    }
}

const BUS_KEY = Symbol.for("krystark.bus");
const g = globalThis as any;

export const bus: EventBus = g[BUS_KEY] ?? (g[BUS_KEY] = new EventBus());

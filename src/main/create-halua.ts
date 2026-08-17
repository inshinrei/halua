import { instantiate } from "./halua"
import type { Feature, HaluaLogger, HaluaOptions, PassedDispatcher } from "./types"
import type { LogLevel } from "../types/log"

export interface HaluaBuilder<EM = Record<string, any>, Caps = {}> {
    dispatchers(d: PassedDispatcher): HaluaBuilder<EM, Caps>
    level(level: LogLevel): HaluaBuilder<EM, Caps>
    redact(redactDataRegExp: RegExp): HaluaBuilder<EM, Caps>
    withArgs(withArgs: any[]): HaluaBuilder<EM, Caps>
    use<A>(feature: Feature<A>): HaluaBuilder<EM, Caps & A>
    build(): HaluaLogger<EM, Caps> & Caps
}

class Builder<EM = Record<string, any>, Caps = {}> implements HaluaBuilder<EM, Caps> {
    private userDispatchers: PassedDispatcher = []
    private opts: HaluaOptions = {}
    private features: Feature<any>[] = []

    dispatchers(d: PassedDispatcher): HaluaBuilder<EM, Caps> {
        this.userDispatchers = d
        return this
    }

    level(level: LogLevel): HaluaBuilder<EM, Caps> {
        this.opts = { ...this.opts, level }
        return this
    }

    redact(redactDataRegExp: RegExp): HaluaBuilder<EM, Caps> {
        this.opts = { ...this.opts, redactDataRegExp }
        return this
    }

    withArgs(withArgs: any[]): HaluaBuilder<EM, Caps> {
        this.opts = { ...this.opts, withArgs }
        return this
    }

    use<A>(feature: Feature<A>): HaluaBuilder<EM, Caps & A> {
        this.features = this.features.concat(feature)
        return this as unknown as Builder<EM, Caps & A>
    }

    build(): HaluaLogger<EM, Caps> & Caps {
        return instantiate<EM, Caps>(this.userDispatchers, this.opts, this.features)
    }
}

export function createHalua<EM = Record<string, any>>(): HaluaBuilder<EM, {}> {
    return new Builder<EM, {}>()
}

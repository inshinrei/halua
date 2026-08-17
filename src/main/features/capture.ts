import type { Dispatcher } from "../dispatchers/dispatcher-types"
import type { CaptureApi, CapturedRecord, Feature } from "../types"

export function capture(): Feature<CaptureApi> {
    let records: CapturedRecord[] = []
    return {
        contributeDispatchers() {
            return [
                () => {
                    let dispatcher: Dispatcher = {
                        level: undefined,
                        exact: null,
                        dispatch(meta, args, errorMeta) {
                            let rec: CapturedRecord = {
                                timestamp: meta.timestamp,
                                level: meta.level,
                                args: args.slice(),
                            }
                            if (errorMeta != null) {
                                rec.errorMeta = errorMeta
                            }
                            records.push(rec)
                        },
                    }
                    return dispatcher
                },
            ]
        },
        apply() {
            return {
                collect() {
                    return records.slice()
                },
                clear() {
                    records.length = 0
                },
            }
        },
    }
}

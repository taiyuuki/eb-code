import { Notify } from 'quasar'

const POSITION = 'bottom-right'

function notif_info(message: string) {
    Notify.create({
        message,
        position: POSITION,
        classes: 'bg-var-eb-bg text-var-eb-fg',
    })
}

function notif_positive(message: string) {
    Notify.create({
        message,
        type: 'positive',
        position: POSITION,
    })
}

function notif_negative(message: string) {
    Notify.create({
        message,
        type: 'negative',
        position: POSITION,
    })
}

function notif_warning(message: string) {
    Notify.create({
        message,
        type: 'warning',
        position: POSITION,
    })
}

export {
    notif_info,
    notif_positive,
    notif_negative,
    notif_warning,
}

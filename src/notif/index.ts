import { Notify } from 'quasar'

function notif_info(message: string) {
    Notify.create({
        message,
        position: 'bottom-right',
        classes: 'bg-var-eb-bg text-var-eb-fg',
    })
}

function notif_positive(message: string) {
    Notify.create({
        message,
        type: 'positive',
        position: 'bottom-right',
    })
}

function notif_negative(message: string) {
    Notify.create({
        message,
        type: 'negative',
        position: 'bottom-right',
    })
}

function notif_warning(message: string) {
    Notify.create({
        message,
        type: 'warning',
        position: 'bottom-right',
    })
}

export {
    notif_info,
    notif_positive,
    notif_negative,
    notif_warning,
}

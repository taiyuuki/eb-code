import { Notify } from 'quasar'

function notif_info(message: string) {
    Notify.create({
        message,
        position: 'bottom-left',
        classes: 'bg-var-eb-bg text-var-eb-fg',
    })
}

function notif_positive(message: string) {
    Notify.create({
        message,
        type: 'positive',
        position: 'bottom-left',
    })
}

function notif_negative(message: string) {
    Notify.create({
        message,
        type: 'negative',
        position: 'bottom-left',
    })
}

function notif_warning(message: string) {
    Notify.create({
        message,
        type: 'warning',
        position: 'bottom-left',
    })
}

export {
    notif_info,
    notif_positive,
    notif_negative,
    notif_warning,
}

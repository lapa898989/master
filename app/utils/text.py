from __future__ import annotations

from app.models.enums import OrderStatus, UserRole


def role_label(role: UserRole | None) -> str:
    if role == UserRole.customer:
        return "Заказчик"
    if role == UserRole.worker:
        return "Исполнитель"
    return "Не выбрана"


def order_status_label(status: OrderStatus) -> str:
    return {
        OrderStatus.new: "НОВЫЙ",
        OrderStatus.active: "АКТИВНЫЙ",
        OrderStatus.worker_selected: "ИСПОЛНИТЕЛЬ ВЫБРАН",
        OrderStatus.in_progress: "В РАБОТЕ",
        OrderStatus.finished: "РАБОТА ЗАВЕРШЕНА",
        OrderStatus.paid: "ОПЛАЧЕНА",
        OrderStatus.completed: "ЗАВЕРШЕН",
        OrderStatus.cancelled: "ОТМЕНЕН",
    }.get(status, status.value)


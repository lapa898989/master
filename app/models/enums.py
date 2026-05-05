from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    customer = "customer"
    worker = "worker"


class OrderStatus(str, enum.Enum):
    new = "NEW"
    active = "ACTIVE"  # published, taking bids
    worker_selected = "WORKER_SELECTED"
    in_progress = "IN_PROGRESS"
    finished = "FINISHED"
    paid = "PAID"
    completed = "COMPLETED"  # both confirmed / auto after 24h
    cancelled = "CANCELLED"


class BidStatus(str, enum.Enum):
    submitted = "SUBMITTED"
    accepted = "ACCEPTED"
    rejected = "REJECTED"


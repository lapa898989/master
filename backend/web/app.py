from __future__ import annotations

from fastapi import Depends, FastAPI, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.db import SessionLocal
from backend.models.category import Category
from backend.models.order import Order
from backend.models.review import Review
from backend.models.user import User


security = HTTPBasic()
templates = Jinja2Templates(directory="app/web/templates")


def _check_basic(creds: HTTPBasicCredentials = Depends(security)) -> None:
    if creds.username != settings.admin_username or creds.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, headers={"WWW-Authenticate": "Basic"})


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


def create_app() -> FastAPI:
    app = FastAPI(title="ServiceInDriver Admin")

    @app.get("/admin", response_class=HTMLResponse, dependencies=[Depends(_check_basic)])
    async def admin_index(request: Request):
        return templates.TemplateResponse("index.html", {"request": request})

    @app.get("/admin/users", response_class=HTMLResponse, dependencies=[Depends(_check_basic)])
    async def admin_users(request: Request, session: AsyncSession = Depends(get_session)):
        res = await session.execute(select(User).order_by(User.created_at.desc()).limit(200))
        users = list(res.scalars().all())
        return templates.TemplateResponse("users.html", {"request": request, "users": users})

    @app.post("/admin/users/{user_id}/ban", dependencies=[Depends(_check_basic)])
    async def admin_user_ban(user_id: int, is_banned: bool = Form(...), session: AsyncSession = Depends(get_session)):
        await session.execute(update(User).where(User.id == user_id).values(is_banned=is_banned))
        await session.commit()
        return RedirectResponse(url="/admin/users", status_code=303)

    @app.get("/admin/orders", response_class=HTMLResponse, dependencies=[Depends(_check_basic)])
    async def admin_orders(request: Request, session: AsyncSession = Depends(get_session)):
        res = await session.execute(select(Order).order_by(Order.created_at.desc()).limit(200))
        orders = list(res.scalars().all())
        return templates.TemplateResponse("orders.html", {"request": request, "orders": orders})

    @app.get("/admin/reviews", response_class=HTMLResponse, dependencies=[Depends(_check_basic)])
    async def admin_reviews(request: Request, session: AsyncSession = Depends(get_session)):
        res = await session.execute(select(Review).order_by(Review.created_at.desc()).limit(200))
        reviews = list(res.scalars().all())
        return templates.TemplateResponse("reviews.html", {"request": request, "reviews": reviews})

    @app.post("/admin/reviews/{review_id}/delete", dependencies=[Depends(_check_basic)])
    async def admin_review_delete(review_id: int, session: AsyncSession = Depends(get_session)):
        r = await session.get(Review, review_id)
        if r:
            await session.delete(r)
            await session.commit()
        return RedirectResponse(url="/admin/reviews", status_code=303)

    @app.get("/admin/categories", response_class=HTMLResponse, dependencies=[Depends(_check_basic)])
    async def admin_categories(request: Request, session: AsyncSession = Depends(get_session)):
        res = await session.execute(select(Category).order_by(Category.sort_order.asc(), Category.id.asc()))
        categories = list(res.scalars().all())
        return templates.TemplateResponse("categories.html", {"request": request, "categories": categories})

    @app.post("/admin/categories/add", dependencies=[Depends(_check_basic)])
    async def admin_category_add(
        name: str = Form(...),
        icon: str = Form(""),
        sort_order: int = Form(0),
        session: AsyncSession = Depends(get_session),
    ):
        session.add(Category(name=name, icon=icon or None, sort_order=sort_order, is_active=True))
        await session.commit()
        return RedirectResponse(url="/admin/categories", status_code=303)

    @app.post("/admin/categories/{cat_id}/toggle", dependencies=[Depends(_check_basic)])
    async def admin_category_toggle(cat_id: int, session: AsyncSession = Depends(get_session)):
        c = await session.get(Category, cat_id)
        if c:
            c.is_active = not c.is_active
            await session.commit()
        return RedirectResponse(url="/admin/categories", status_code=303)

    return app


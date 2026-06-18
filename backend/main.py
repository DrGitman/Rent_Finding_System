from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.routers import auth, users, agents, rules, notifications, webhooks, scrapers, validators, evaluators, listings
from core.config import settings
from core.database import engine, Base

# Create tables on startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Rent Scout API starting...")
    yield
    # Shutdown
    print("🛑 Rent Scout API shutting down...")

app = FastAPI(
    title="Rent Scout API",
    description="AI-powered rental intelligence backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(rules.router, prefix="/api/rules", tags=["Automation Rules"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(scrapers.router, prefix="/api/scrapers", tags=["Web Scrapers"])
app.include_router(validators.router, prefix="/api/validators", tags=["Validators"])
app.include_router(evaluators.router, prefix="/api/evaluators", tags=["Evaluators"])
app.include_router(listings.router, prefix="/api/listings", tags=["Listings"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "rent-scout-api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

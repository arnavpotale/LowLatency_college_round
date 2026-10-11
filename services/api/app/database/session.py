import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Handle SQLite vs PostgreSQL configurations
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def backfill_persisted_trust_scores(db_session):
    """
    Backfills existing audit records in the database to update their summary
    trust_score and decisive_claims using the canonical normalized formula:
        trust_score = supported / (supported + contradicted + unsupported) * 100
    Does not rerun or modify actual claim verdicts.
    """
    import json
    import logging
    from app.models import AuditModel
    from app.verification.scoring import compute_trust_score

    logger = logging.getLogger(__name__)

    try:
        audits = db_session.query(AuditModel).filter(AuditModel.results_json.isnot(None)).all()
        updated_count = 0
        for audit in audits:
            try:
                data = json.loads(audit.results_json)
                summary = data.get("summary")
                if summary and isinstance(summary, dict):
                    sup = summary.get("supported_claims", 0)
                    cont = summary.get("contradicted_claims", 0)
                    unsup = summary.get("unsupported_claims", 0)
                    score, decisive = compute_trust_score(sup, cont, unsup)
                    if summary.get("trust_score") != score or summary.get("decisive_claims") != decisive:
                        summary["trust_score"] = score
                        summary["decisive_claims"] = decisive
                        data["summary"] = summary
                        audit.results_json = json.dumps(data)
                        updated_count += 1
            except Exception as e:
                logger.warning("Failed to backfill audit %s: %s", getattr(audit, 'id', 'unknown'), e)
        if updated_count > 0:
            db_session.commit()
            logger.info("Successfully backfilled trust scores for %d audits.", updated_count)
    except Exception as e:
        logger.warning("Trust score backfill encountered an error: %s", e)
        db_session.rollback()


def init_db():
    """Initialise database tables and apply safe backfills."""
    import app.models  # Ensure models are imported before creating tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        backfill_persisted_trust_scores(db)
    finally:
        db.close()

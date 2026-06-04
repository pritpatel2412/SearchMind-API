"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-06-04 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('plan', sa.String(length=50), server_default='free', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 2. api_keys
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key_prefix', sa.String(length=12), nullable=False),
        sa.Column('hashed_key', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('monthly_limit', sa.Integer(), server_default='1000', nullable=True),
        sa.Column('rate_limit_per_min', sa.Integer(), server_default='10', nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('hashed_key')
    )

    # 3. search_logs
    op.create_table(
        'search_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('endpoint', sa.String(length=50), nullable=False),
        sa.Column('query', sa.Text(), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=True),
        sa.Column('cached', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), server_default='0', nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_search_logs_user_id', 'search_logs', ['user_id'], unique=False)
    op.create_index('idx_search_logs_api_key_id', 'search_logs', ['api_key_id'], unique=False)
    op.create_index('idx_search_logs_created_at', 'search_logs', ['created_at'], unique=False)

    # 4. usage_records
    op.create_table(
        'usage_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('search_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('extract_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('crawl_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('research_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('total_tokens', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'api_key_id', 'period_year', 'period_month', name='uq_user_api_key_period')
    )

    # 5. cached_results
    op.create_table(
        'cached_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cache_key', sa.String(length=255), nullable=False),
        sa.Column('endpoint', sa.String(length=50), nullable=False),
        sa.Column('response_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('hit_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cache_key')
    )
    op.create_index('idx_cached_results_cache_key', 'cached_results', ['cache_key'], unique=False)
    op.create_index('idx_cached_results_expires_at', 'cached_results', ['expires_at'], unique=False)

def downgrade() -> None:
    op.drop_index('idx_cached_results_expires_at', table_name='cached_results')
    op.drop_index('idx_cached_results_cache_key', table_name='cached_results')
    op.drop_table('cached_results')
    op.drop_table('usage_records')
    op.drop_index('idx_search_logs_created_at', table_name='search_logs')
    op.drop_index('idx_search_logs_api_key_id', table_name='search_logs')
    op.drop_index('idx_search_logs_user_id', table_name='search_logs')
    op.drop_table('search_logs')
    op.drop_table('api_keys')
    op.drop_table('users')

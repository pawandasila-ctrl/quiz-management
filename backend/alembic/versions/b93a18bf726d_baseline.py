"""baseline

Revision ID: b93a18bf726d
Revises: 
Create Date: 2026-07-04 14:15:10.367085

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b93a18bf726d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop existing custom ENUM types first to avoid DuplicateObjectError on clean runs
    op.execute("DROP TYPE IF EXISTS userrole CASCADE")
    op.execute("DROP TYPE IF EXISTS quizstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS questiontype CASCADE")
    op.execute("DROP TYPE IF EXISTS attemptstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS answerstatus CASCADE")

    # 1. Create categories table
    op.create_table('categories',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)
    
    # 2. Create users table (Note: Enum will be automatically created by SQLAlchemy)
    op.create_table('users',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=True),
    sa.Column('role', sa.Enum('ADMIN', 'STUDENT', name='userrole'), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('email_verified', sa.Boolean(), nullable=False),
    sa.Column('image', sa.String(length=1024), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # 3. Create quizzes table
    op.create_table('quizzes',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('category_id', sa.Integer(), nullable=True),
    sa.Column('created_by_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('DRAFT', 'PUBLISHED', 'CLOSED', name='quizstatus'), nullable=False),
    sa.Column('time_limit_minutes', sa.Integer(), nullable=True),
    sa.Column('pass_mark', sa.Integer(), nullable=False),
    sa.Column('total_marks', sa.Integer(), nullable=False),
    sa.Column('shuffle_questions', sa.Boolean(), nullable=False),
    sa.Column('max_attempts', sa.Integer(), nullable=False),
    sa.Column('results_visible', sa.Boolean(), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quizzes_category_id'), 'quizzes', ['category_id'], unique=False)
    op.create_index(op.f('ix_quizzes_created_by_id'), 'quizzes', ['created_by_id'], unique=False)
    op.create_index(op.f('ix_quizzes_id'), 'quizzes', ['id'], unique=False)
    
    # 4. Create sessions table
    op.create_table('sessions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('token', sa.String(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('ip_address', sa.String(), nullable=True),
    sa.Column('user_agent', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sessions_id'), 'sessions', ['id'], unique=False)
    op.create_index(op.f('ix_sessions_token'), 'sessions', ['token'], unique=True)
    
    # 5. Create enrollments table
    op.create_table('enrollments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('quiz_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('enrolled_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('quiz_id', 'student_id', name='uq_quiz_student_enrollment')
    )
    op.create_index(op.f('ix_enrollments_id'), 'enrollments', ['id'], unique=False)
    op.create_index(op.f('ix_enrollments_quiz_id'), 'enrollments', ['quiz_id'], unique=False)
    op.create_index(op.f('ix_enrollments_student_id'), 'enrollments', ['student_id'], unique=False)
    
    # 6. Create questions table
    op.create_table('questions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('quiz_id', sa.Integer(), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('type', sa.Enum('MCQ', 'TRUE_FALSE', name='questiontype'), nullable=False),
    sa.Column('marks', sa.Integer(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.Column('explanation', sa.Text(), nullable=True),
    sa.Column('image_url', sa.String(length=1024), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
    op.create_index(op.f('ix_questions_quiz_id'), 'questions', ['quiz_id'], unique=False)
    
    # 7. Create quiz_attempts table
    op.create_table('quiz_attempts',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('quiz_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('attempt_number', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('IN_PROGRESS', 'SUBMITTED', 'GRADED', name='attemptstatus'), nullable=False),
    sa.Column('score', sa.Integer(), nullable=True),
    sa.Column('total_marks', sa.Integer(), nullable=False),
    sa.Column('passed', sa.Boolean(), nullable=True),
    sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quiz_attempts_id'), 'quiz_attempts', ['id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_quiz_id'), 'quiz_attempts', ['quiz_id'], unique=False)
    op.create_index(op.f('ix_quiz_attempts_student_id'), 'quiz_attempts', ['student_id'], unique=False)
    
    # 8. Create options table
    op.create_table('options',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.Column('text', sa.String(length=1024), nullable=False),
    sa.Column('is_correct', sa.Boolean(), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_options_id'), 'options', ['id'], unique=False)
    op.create_index(op.f('ix_options_question_id'), 'options', ['question_id'], unique=False)
    
    # 9. Create answers table
    op.create_table('answers',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('attempt_id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.Column('selected_option_id', sa.Integer(), nullable=False),
    sa.Column('is_correct', sa.Boolean(), nullable=False),
    sa.Column('marks_awarded', sa.Integer(), nullable=False),
    sa.Column('answered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['selected_option_id'], ['options.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_answers_attempt_id'), 'answers', ['attempt_id'], unique=False)
    op.create_index(op.f('ix_answers_id'), 'answers', ['id'], unique=False)
    op.create_index(op.f('ix_answers_question_id'), 'answers', ['question_id'], unique=False)
    op.create_index(op.f('ix_answers_selected_option_id'), 'answers', ['selected_option_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_answers_selected_option_id'), table_name='answers')
    op.drop_index(op.f('ix_answers_question_id'), table_name='answers')
    op.drop_index(op.f('ix_answers_id'), table_name='answers')
    op.drop_index(op.f('ix_answers_attempt_id'), table_name='answers')
    op.drop_table('answers')
    op.drop_index(op.f('ix_options_question_id'), table_name='options')
    op.drop_index(op.f('ix_options_id'), table_name='options')
    op.drop_table('options')
    op.drop_index(op.f('ix_quiz_attempts_student_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_quiz_id'), table_name='quiz_attempts')
    op.drop_index(op.f('ix_quiz_attempts_id'), table_name='quiz_attempts')
    op.drop_table('quiz_attempts')
    op.drop_index(op.f('ix_questions_quiz_id'), table_name='questions')
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_enrollments_student_id'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_quiz_id'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_id'), table_name='enrollments')
    op.drop_table('enrollments')
    op.drop_index(op.f('ix_sessions_token'), table_name='sessions')
    op.drop_index(op.f('ix_sessions_id'), table_name='sessions')
    op.drop_table('sessions')
    op.drop_index(op.f('ix_quizzes_id'), table_name='quizzes')
    op.drop_index(op.f('ix_quizzes_created_by_id'), table_name='quizzes')
    op.drop_index(op.f('ix_quizzes_category_id'), table_name='quizzes')
    op.drop_table('quizzes')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
    
    # Drop enum types explicitly
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS quizstatus")
    op.execute("DROP TYPE IF EXISTS questiontype")
    op.execute("DROP TYPE IF EXISTS attemptstatus")

class PracticeException(Exception):
    """Base exception for all system-related errors."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class SessionNotFoundError(PracticeException):
    """Session not found in DB."""
    def __init__(self, message: str = "Session not found or already invalidated."):
        super().__init__(message)

class SessionExpiredError(PracticeException):
    """Session has expired."""
    def __init__(self, message: str = "Session expired. Please login again."):
        super().__init__(message)

class UserNotFoundError(PracticeException):
    """User not found in DB."""
    def __init__(self, message: str = "User not found."):
        super().__init__(message)

class UserInactiveError(PracticeException):
    """User is disabled."""
    def __init__(self, message: str = "User account is disabled."):
        super().__init__(message)

class DuplicateEmailError(PracticeException):
    """Email already registered."""
    def __init__(self, message: str = "A user with this email address already exists."):
        super().__init__(message)

class QuizNotFoundError(PracticeException):
    """Quiz not found."""
    def __init__(self, message: str = "Quiz not found."):
        super().__init__(message)

class QuizStatusError(PracticeException):
    """Quiz is in wrong status (e.g. editing published, taking draft)."""
    def __init__(self, message: str = "Operation not allowed on the current quiz status."):
        super().__init__(message)

class CategoryNotFoundError(PracticeException):
    """Category not found."""
    def __init__(self, message: str = "Category not found."):
        super().__init__(message)

class QuestionNotFoundError(PracticeException):
    """Question not found."""
    def __init__(self, message: str = "Question not found."):
        super().__init__(message)

class OptionNotFoundError(PracticeException):
    """Option not found."""
    def __init__(self, message: str = "Option not found."):
        super().__init__(message)

class AttemptNotFoundError(PracticeException):
    """Quiz attempt not found."""
    def __init__(self, message: str = "Quiz attempt not found."):
        super().__init__(message)

class MaxAttemptsReachedError(PracticeException):
    """Max attempts exceeded."""
    def __init__(self, message: str = "You have reached the maximum number of attempts allowed for this quiz."):
        super().__init__(message)

class EnrollmentRequiredError(PracticeException):
    """Enrollment required to take the quiz."""
    def __init__(self, message: str = "You are not enrolled in this quiz."):
        super().__init__(message)

class AttemptTimeExpiredError(PracticeException):
    """Quiz attempt time has run out."""
    def __init__(self, message: str = "The time limit for this quiz attempt has expired."):
        super().__init__(message)

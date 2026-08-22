from typing import List, Tuple
from app.models.entities import QuestionAttemptProgress, QuestionEntity

class ScoringService:
    @staticmethod
    def calculate_total_score(
        questions: List[QuestionEntity],
        progress_map: dict[str, QuestionAttemptProgress],
    ) -> Tuple[int, int, float]:
        """
        Returns (total_earned_marks, total_maximum_marks, percentage)
        """
        total_earned = 0
        total_max = 0

        for q in questions:
            q_max = q.max_marks
            prog = progress_map.get(q.id)
            q_earned = prog.earned_marks if prog else 0

            total_earned += q_earned
            total_max += q_max

        percentage = round((total_earned / total_max * 100.0), 2) if total_max > 0 else 0.0
        return total_earned, total_max, percentage

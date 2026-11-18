export type QuestionType = "text" | "single_choice" | "multi_choice" | "rating";

export interface QuestionCondition {
  questionId: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
  condition?: QuestionCondition | null;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type AnswerValue = string | string[] | number;

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, AnswerValue>;
  submittedAt: string;
}

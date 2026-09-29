                    ┌────────────┐
                    │ auth.users │
                    └─────┬──────┘
                          │
                          ▼
                    ┌──────────┐
                    │ profiles │
                    │ teacher  │
                    │ admin    │
                    └────┬─────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       │
      teacher_students               │ graded_by
             │                       │
             ▼                       │
         students ◄──────────────────┤
             │
             │
        ┌────┴─────────┐
        ▼              ▼
weekly_records    exam_results
│
▼
exams
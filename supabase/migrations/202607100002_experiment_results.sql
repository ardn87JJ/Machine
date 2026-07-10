alter table public.execution_experiments
  add column outcome text not null default 'UNKNOWN',
  add column result_note text not null default '';

alter table public.execution_experiments
  add constraint execution_experiments_outcome_is_valid check (
    outcome in ('UNKNOWN', 'PASSED', 'FAILED')
  );

create index execution_experiments_outcome_idx
  on public.execution_experiments (outcome);
